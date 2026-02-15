import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosApi from "../../../service/axiosInstance";

const PromtModifier = () => {
    const queryClient = useQueryClient();
    const [modifierValue, setModifierValue] = useState("");
    const [isEditing, setIsEditing] = useState(false);

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

    // =======================================Reset Modifier==========================================\\
    const resetModifierMutation = useMutation({
        mutationFn: async () => {
            const response = await axiosApi.delete(
                "/api/v1/president-prompt/modifier/"
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["presidentPromptModifier"] });
            setModifierValue("");
            setIsEditing(false);
        },
        onError: (err) => {
            console.error("[PromtModifier] Failed to reset modifier:", err);
        },
    });

    // =======================================Fetch modifier==========================================\\
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
            console.log("[PromtModifier] Modifier Data:", response.data);
            return response.data;
        },
    });
    console.log("[PromtModifier] Modifier Data from useQuery:", modifierData);

    // =======================================Update modifier==========================================\\
    const updateModifierMutation = useMutation({
        mutationFn: async (payload) => {
            const response = await axiosApi.put(
                "/api/v1/president-prompt/modifier/",
                payload
            );
            console.log("[PromtModifier] Update Modifier Response:", response.data);
            return response.data;
        },
        onSuccess: (data) => {
            console.log("[PromtModifier] Modifier updated successfully:", data);
            queryClient.invalidateQueries({ queryKey: ["presidentPromptModifier"] });
            setIsEditing(false);
        },
        onError: (err) => {
            console.error("[PromtModifier] Failed to update modifier:", err);
        },
    });

    console.log("[PromtModifier] Modifier Data State:", modifierData?.data);

    useEffect(() => {
        if (modifierData?.data?.modifier && !isEditing) {
            setModifierValue(stripMarkdownToText(modifierData.data.modifier));
        }
    }, [modifierData?.data?.modifier, isEditing]);

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
            updateModifierMutation.mutate({ modifier: modifierValue });
        }
    };

    return (
        <section className="rounded-2xl border border-[#E9E4DB] bg-white/50 shadow-sm h-full">
            <div className="flex h-full flex-col gap-3 rounded-xl border border-gray-200 bg-white/50 p-4 md:p-5">
                <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 font-bold">Output Modifier</p>
                    <button
                        type="button"
                        onClick={() => resetModifierMutation.mutate()}
                        className="text-xs text-white bg-primary px-3 py-2 rounded-lg font-medium cursor-pointer disabled:opacity-50"
                        disabled={resetModifierMutation.isPending}
                    >
                        {resetModifierMutation.isPending ? "Resetting..." : "Reset"}
                    </button>
                </div>

                <textarea
                    className="w-full flex-1 min-h-[260px] md:min-h-[320px] resize-none border border-gray-200 rounded-lg p-3 text-sm md:text-base text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={modifierValue}
                    onChange={(e) => setModifierValue(e.target.value)}
                    disabled={!isEditing}
                />

                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Last updated by: {modifierData?.data?.updated_by || "N/A"}</span>
                    <span>
                        {modifierData?.data?.updated_at
                            ? new Date(modifierData.data.updated_at).toLocaleString()
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
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#5E5B4E] transition disabled:opacity-50"
                        disabled={!isEditing || updateModifierMutation.isPending}
                    >
                        {updateModifierMutation.isPending ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </section>
    );
};

export default PromtModifier;