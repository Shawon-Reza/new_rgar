import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosApi from "../../../service/axiosInstance";
import { toast } from "react-toastify";


const PromtModifier = () => {
    const queryClient = useQueryClient();
    const [modifierValue, setModifierValue] = useState("");
    const [modifierName, setModifierName] = useState("");
    const [isActive, setIsActive] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedModifierId, setSelectedModifierId] = useState("");
    const isCreatingNew = selectedModifierId === "new";

    const stripMarkdownToText = (value) => {
        if (!value) return "";
        return value
            .replace(/```[\s\S]*?```/g, "")
            .replace(/`([^`]*)`/g, "$1")
            .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
            .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
            .replace(/[*_~>#-]+/g, "")
            .replace(/\n{3,}/g, "\n\n")
            .trim();
    };

    // ======================================= Fetch modifier ==========================================\\
    const {
        data: modifierData,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["presidentPromptModifier"],
        queryFn: async () => {
            const response = await axiosApi.get(
                "/api/v1/president-prompt/modifier/"
            );
            return response.data;
        },
    });

    console.log("=================================:",modifierData)

    const modifierList = Array.isArray(modifierData?.data) ? modifierData.data : [];
    const selectedModifier =
        modifierList.find((item) => String(item?.id) === String(selectedModifierId)) || null;

    // ======================================= Update modifier ==========================================\\
    const updateModifierMutation = useMutation({
        mutationFn: async ({ id, payload }) => {
            const response = await axiosApi.patch(
                `/api/v1/president-prompt/modifier/${id}/`,
                payload
            );
            return response.data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["presidentPromptModifier"] });
            await queryClient.refetchQueries({ queryKey: ["presidentPromptModifier"] });
            setIsEditing(false);
        },
        onError: (err) => {
            console.error("[PromtModifier] Failed to update modifier:", err);
        },
    });

    // ======================================= Create modifier ==========================================\\
    const createModifierMutation = useMutation({
        mutationFn: async (payload) => {
            const response = await axiosApi.post(
                "/api/v1/president-prompt/modifier/",
                payload
            );
            return response.data;
        },
        onSuccess: async (data) => {
            await queryClient.invalidateQueries({ queryKey: ["presidentPromptModifier"] });
            await queryClient.refetchQueries({ queryKey: ["presidentPromptModifier"] });
            const createdId = data?.data?.id;
            if (createdId) {
                setSelectedModifierId(String(createdId));
            }
            setIsEditing(false);
        },
        onError: (err) => {
            console.error("[PromtModifier] Failed to create modifier:", err);
        },
    });

    // ======================================= Delete modifier ==========================================\\
    const deleteModifierMutation = useMutation({
        mutationFn: async (id) => {
            const response = await axiosApi.delete(`/api/v1/president-prompt/modifier/${id}/`);
            return response.data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["presidentPromptModifier"] });
            await queryClient.refetchQueries({ queryKey: ["presidentPromptModifier"] });
            setIsEditing(false);
        },
        onError: (err) => {
            console.error("[PromtModifier] Failed to delete modifier:", err);
            console.log(err?.response?.data?.message)
            toast.error(err?.response?.data?.message || "Failed to delete modifier");
        },
    });

    useEffect(() => {
        if (isLoading || error) {
            return;
        }

        if (!modifierList.length) {
            if (!selectedModifierId) {
                setSelectedModifierId("new");
                setIsEditing(true);
            }
            return;
        }

        if (selectedModifierId === "new") {
            return;
        }

        const activeModifier = modifierList.find((item) => item?.is_active);
        const fallbackModifier = activeModifier || modifierList[0];

        if (!selectedModifierId) {
            setSelectedModifierId(String(fallbackModifier?.id));
            return;
        }

        const stillExists = modifierList.some(
            (item) => String(item?.id) === String(selectedModifierId)
        );

        if (!stillExists) {
            setSelectedModifierId(String(fallbackModifier?.id));
        }
    }, [modifierList, selectedModifierId, isLoading, error]);

    useEffect(() => {
        if (isCreatingNew) {
            return;
        }

        if (selectedModifier?.modifier && !isEditing) {
            setModifierValue(stripMarkdownToText(selectedModifier.modifier));
        }
        if (!selectedModifier?.modifier && !isEditing) {
            setModifierValue("");
        }
    }, [selectedModifier?.modifier, isEditing, isCreatingNew]);

    useEffect(() => {
        if (isCreatingNew) {
            setModifierName("");
            setModifierValue("");
        }
    }, [isCreatingNew]);

    useEffect(() => {
        if (!isCreatingNew && selectedModifier?.name && !isEditing) {
            setModifierName(String(selectedModifier.name));
        }
        if (!isCreatingNew && !selectedModifier?.name && !isEditing) {
            setModifierName("");
        }
    }, [selectedModifier?.name, isCreatingNew, isEditing]);

    useEffect(() => {
        if (!isCreatingNew && !isEditing) {
            setIsActive(Boolean(selectedModifier?.is_active));
        }
        if (isCreatingNew) {
            setIsActive(false);
        }
    }, [selectedModifier?.is_active, isCreatingNew, isEditing]);

    if (isLoading) {
        return (
            <section className="rounded-2xl shadow-lg border border-[#E9E4DB] p-6 md:p-8">
                <div className="">
                    <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-32 mb-3"></div>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-5">
                            <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                            <div className="h-32 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="rounded-2xl border border-red-200 p-6 md:p-8 bg-red-50">
                <div className="">
                    <p className="text-red-600">Failed to load modifier data</p>
                </div>
            </section>
        );
    }

    const handleSave = async () => {
        if (isCreatingNew && (!modifierName.trim() || !modifierValue.trim())) {
            Swal.fire({
                icon: "warning",
                title: "Missing fields",
                text: "Please enter modifier name and modifier text.",
            });
            return;
        }

        const result = await Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, save it!"
        });

        if (result.isConfirmed) {
            if (isCreatingNew) {
                createModifierMutation.mutate({
                    name: modifierName.trim(),
                    modifier: modifierValue.trim(),
                });
                return;
            }

            if (!selectedModifier?.id) {
                return;
            }

            updateModifierMutation.mutate({
                id: selectedModifier.id,
                payload: {
                    name: modifierName.trim() || selectedModifier?.name || "",
                    modifier: modifierValue.trim(),
                    is_active: isActive,
                },
            });
        }
    };

    const handleDelete = async () => {
        if (isCreatingNew || !selectedModifier?.id) {
            return;
        }

        const result = await Swal.fire({
            title: "Delete this modifier?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it",
        });

        if (result.isConfirmed) {
            deleteModifierMutation.mutate(selectedModifier.id);
        }
    };

    return (
        <section className="rounded-2xl border border-[#E9E4DB] bg-white/50 shadow-sm h-full">
            <div className="flex h-full flex-col gap-3 rounded-xl border border-gray-200 bg-white/50 p-4 md:p-5">
                <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 font-bold">Core Behavior For Chartly AI</p>

                    <select
                        className="min-w-[180px] text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700"
                        value={selectedModifierId}
                        onChange={(e) => {
                            const nextValue = e.target.value;
                            setSelectedModifierId(nextValue);
                            setIsEditing(nextValue === "new");
                            if (nextValue === "new") {
                                setModifierName("");
                                setModifierValue("");
                            }
                        }}
                    >
                        <option value="" disabled>
                            Select modifier
                        </option>
                        <option value="new">+ Create New Modifier</option>
                        {modifierList.length
                            ? modifierList.map((item) => (
                                <option key={item.id} value={String(item.id)}>
                                    {item.name ? `Modifier ${item.name}` : `Modifier ${item.id}`}
                                    {item.is_active ? " (Active)" : ""}
                                </option>
                            ))
                            : (
                                <option value="" disabled>
                                    No modifiers found
                                </option>
                            )}
                    </select>
                </div>

                <input
                    type="text"
                    className="w-full border border-gray-200 rounded-lg p-3 text-sm md:text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Modifier name"
                    value={modifierName}
                    onChange={(e) => setModifierName(e.target.value)}
                    disabled={!isEditing}
                />

                <textarea
                    className="w-full flex-1 min-h-[260px] md:min-h-[320px] resize-none border border-gray-200 rounded-lg p-3 text-sm md:text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={modifierValue}
                    onChange={(e) => setModifierValue(e.target.value)}
                    disabled={!isEditing}
                />

                {!isCreatingNew && (
                    <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            disabled={!isEditing}
                        />
                        Active modifier
                    </label>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Last updated by: {isCreatingNew ? "N/A" : selectedModifier?.updated_by || "N/A"}</span>
                    <span>
                        {!isCreatingNew && selectedModifier?.updated_at
                            ? new Date(selectedModifier.updated_at).toLocaleString()
                            : "N/A"}
                    </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition disabled:opacity-50"
                        disabled={isEditing}
                    >
                        {isCreatingNew ? "Create" : "Edit"}
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#5E5B4E] transition disabled:opacity-50"
                        disabled={!isEditing || updateModifierMutation.isPending || createModifierMutation.isPending || deleteModifierMutation.isPending}
                    >
                        {updateModifierMutation.isPending || createModifierMutation.isPending ? "Saving..." : "Save"}
                    </button>
                </div>
                {!isCreatingNew && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="w-full rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition disabled:opacity-50"
                        disabled={deleteModifierMutation.isPending || updateModifierMutation.isPending || createModifierMutation.isPending}
                    >
                        {deleteModifierMutation.isPending ? "Deleting..." : "Delete"}
                    </button>
                )}
            </div>
        </section>
    );
};

export default PromtModifier;