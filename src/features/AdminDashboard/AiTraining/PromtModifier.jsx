import { useEffect, useState } from "react"
import Swal from "sweetalert2"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FiEdit3, FiSave, FiTrash2 } from "react-icons/fi"
import axiosApi from "../../../service/axiosInstance"
import { toast } from "react-toastify"

const PromtModifier = () => {
    const queryClient = useQueryClient()
    const [modifierValue, setModifierValue] = useState("")
    const [modifierName, setModifierName] = useState("")
    const [isActive, setIsActive] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [selectedModifierId, setSelectedModifierId] = useState("")
    const isCreatingNew = selectedModifierId === "new"

    const stripMarkdownToText = (value) => {
        if (!value) return ""
        return value
            .replace(/```[\s\S]*?```/g, "")
            .replace(/`([^`]*)`/g, "$1")
            .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
            .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
            .replace(/[*_~>#-]+/g, "")
            .replace(/\n{3,}/g, "\n\n")
            .trim()
    }

    const { data: modifierData, isLoading, error } = useQuery({
        queryKey: ["presidentPromptModifier"],
        queryFn: async () => {
            const response = await axiosApi.get("/api/v1/president-prompt/modifier/")
            return response.data
        },
    })

    const modifierList = Array.isArray(modifierData?.data) ? modifierData.data : []
    const selectedModifier =
        modifierList.find((item) => String(item?.id) === String(selectedModifierId)) || null

    const updateModifierMutation = useMutation({
        mutationFn: async ({ id, payload }) => {
            const response = await axiosApi.patch(`/api/v1/president-prompt/modifier/${id}/`, payload)
            return response.data
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["presidentPromptModifier"] })
            await queryClient.refetchQueries({ queryKey: ["presidentPromptModifier"] })
            setIsEditing(false)
        },
        onError: () => {
            toast.error("Failed to update modifier.")
        },
    })

    const createModifierMutation = useMutation({
        mutationFn: async (payload) => {
            const response = await axiosApi.post("/api/v1/president-prompt/modifier/", payload)
            return response.data
        },
        onSuccess: async (data) => {
            await queryClient.invalidateQueries({ queryKey: ["presidentPromptModifier"] })
            await queryClient.refetchQueries({ queryKey: ["presidentPromptModifier"] })
            const createdId = data?.data?.id
            if (createdId) setSelectedModifierId(String(createdId))
            setIsEditing(false)
        },
        onError: () => {
            toast.error("Failed to create modifier.")
        },
    })

    const deleteModifierMutation = useMutation({
        mutationFn: async (id) => {
            const response = await axiosApi.delete(`/api/v1/president-prompt/modifier/${id}/`)
            return response.data
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["presidentPromptModifier"] })
            await queryClient.refetchQueries({ queryKey: ["presidentPromptModifier"] })
            setSelectedModifierId("")
            setIsEditing(false)
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || "Failed to delete modifier.")
        },
    })

    useEffect(() => {
        if (isLoading || error) return

        if (!modifierList.length) {
            if (!selectedModifierId) {
                setSelectedModifierId("new")
                setIsEditing(true)
            }
            return
        }

        if (selectedModifierId === "new") return

        const activeModifier = modifierList.find((item) => item?.is_active)
        const fallbackModifier = activeModifier || modifierList[0]

        if (!selectedModifierId) {
            setSelectedModifierId(String(fallbackModifier?.id))
            return
        }

        const stillExists = modifierList.some((item) => String(item?.id) === String(selectedModifierId))
        if (!stillExists) {
            setSelectedModifierId(String(fallbackModifier?.id))
        }
    }, [modifierList, selectedModifierId, isLoading, error])

    useEffect(() => {
        if (isCreatingNew) return

        if (selectedModifier?.modifier && !isEditing) {
            setModifierValue(stripMarkdownToText(selectedModifier.modifier))
        }
        if (!selectedModifier?.modifier && !isEditing) {
            setModifierValue("")
        }
    }, [selectedModifier?.modifier, isEditing, isCreatingNew])

    useEffect(() => {
        if (isCreatingNew) {
            setModifierName("")
            setModifierValue("")
        }
    }, [isCreatingNew])

    useEffect(() => {
        if (!isCreatingNew && selectedModifier?.name && !isEditing) {
            setModifierName(String(selectedModifier.name))
        }
        if (!isCreatingNew && !selectedModifier?.name && !isEditing) {
            setModifierName("")
        }
    }, [selectedModifier?.name, isCreatingNew, isEditing])

    useEffect(() => {
        if (!isCreatingNew && !isEditing) {
            setIsActive(Boolean(selectedModifier?.is_active))
        }
        if (isCreatingNew) {
            setIsActive(false)
        }
    }, [selectedModifier?.is_active, isCreatingNew, isEditing])

    const handleSave = async () => {
        if (isCreatingNew && (!modifierName.trim() || !modifierValue.trim())) {
            Swal.fire({
                icon: "warning",
                title: "Missing fields",
                text: "Please enter modifier name and modifier text.",
            })
            return
        }

        const result = await Swal.fire({
            title: "Save modifier?",
            text: "This will update Chartly AI behavior.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#2B76F4",
            cancelButtonColor: "#ef4444",
            confirmButtonText: "Save"
        })

        if (!result.isConfirmed) return

        if (isCreatingNew) {
            createModifierMutation.mutate({
                name: modifierName.trim(),
                modifier: modifierValue.trim(),
                is_active: true,
            })
            return
        }

        if (!selectedModifier?.id) return

        updateModifierMutation.mutate({
            id: selectedModifier.id,
            payload: {
                name: modifierName.trim() || selectedModifier?.name || "",
                modifier: modifierValue.trim(),
                is_active: isActive,
            },
        })
    }

    const handleDelete = async () => {
        if (isCreatingNew || !selectedModifier?.id) return

        const result = await Swal.fire({
            title: "Delete this modifier?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#2B76F4",
            confirmButtonText: "Delete",
        })

        if (result.isConfirmed) {
            deleteModifierMutation.mutate(selectedModifier.id)
        }
    }

    const handleSetActiveModifier = async () => {
        if (isCreatingNew || !selectedModifier?.id || selectedModifier?.is_active) return

        updateModifierMutation.mutate({
            id: selectedModifier.id,
            payload: {
                name: modifierName.trim() || selectedModifier?.name || "",
                modifier: modifierValue.trim() || selectedModifier?.modifier || "",
                is_active: true,
            },
        })
    }

    if (isLoading) {
        return (
            <section className="rounded-lg border border-[#dfe5ee] bg-white p-5">
                <div className="animate-pulse">
                    <div className="h-5 w-40 rounded bg-[#e8edf5]" />
                    <div className="mt-4 h-72 rounded-lg bg-[#f3f6fb]" />
                </div>
            </section>
        )
    }

    if (error) {
        return (
            <section className="rounded-lg border border-red-100 bg-white p-5">
                <p className="text-sm font-semibold text-red-600">Failed to load modifier data.</p>
            </section>
        )
    }

    return (
        <section className="flex h-full flex-col rounded-lg border border-[#dfe5ee] bg-white p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 className="text-base font-semibold text-[#111827]">Chartly Modifier</h3>
                    <p className="mt-1 text-sm font-medium text-[#6b7890]">Behavior layer for Chartly AI.</p>
                </div>

                <select
                    className="h-10 min-w-[200px] rounded-lg border border-[#d9e1ec] bg-white px-3 text-sm font-medium text-[#172033] outline-none transition focus:border-[#2B76F4] focus:ring-4 focus:ring-blue-100"
                    value={selectedModifierId}
                    onChange={(e) => {
                        const nextValue = e.target.value
                        setSelectedModifierId(nextValue)
                        setIsEditing(nextValue === "new")
                        if (nextValue === "new") {
                            setModifierName("")
                            setModifierValue("")
                        }
                    }}
                >
                    <option value="" disabled>Select modifier</option>
                    <option value="new">Create New Modifier</option>
                    {modifierList.length ? (
                        modifierList.map((item) => (
                            <option key={item.id} value={String(item.id)}>
                                {item.name ? `Modifier ${item.name}` : `Modifier ${item.id}`}
                                {item.is_active ? " (Active)" : ""}
                            </option>
                        ))
                    ) : (
                        <option value="" disabled>No modifiers found</option>
                    )}
                </select>
            </div>

            <div className="mb-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                <input
                    type="text"
                    className="h-11 rounded-lg border border-[#d9e1ec] bg-white px-4 text-sm font-medium text-[#172033] outline-none transition placeholder:text-[#97a4b8] disabled:bg-[#f8fafc] disabled:text-[#6b7890] focus:border-[#2B76F4] focus:ring-4 focus:ring-blue-100"
                    placeholder="Modifier name"
                    value={modifierName}
                    onChange={(e) => setModifierName(e.target.value)}
                    disabled={!isEditing}
                />
                <label className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#d9e1ec] bg-[#f8fafc] px-3 text-sm font-semibold text-[#41506a]">
                    <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        disabled={!isEditing || isCreatingNew}
                        className="h-4 w-4 accent-[#2B76F4]"
                    />
                    Active
                </label>
            </div>

            <textarea
                className="min-h-[300px] flex-1 resize-none rounded-lg border border-[#d9e1ec] bg-white px-4 py-3 text-sm font-medium leading-6 text-[#172033] outline-none transition disabled:bg-[#f8fafc] disabled:text-[#6b7890] focus:border-[#2B76F4] focus:ring-4 focus:ring-blue-100"
                value={modifierValue}
                onChange={(e) => setModifierValue(e.target.value)}
                disabled={!isEditing}
            />

            <div className="mt-4 grid gap-2 text-xs font-medium text-[#8b98ad] sm:grid-cols-2">
                <span>Updated by: {isCreatingNew ? "N/A" : selectedModifier?.updated_by || "N/A"}</span>
                <span className="sm:text-right">
                    {!isCreatingNew && selectedModifier?.updated_at ? new Date(selectedModifier.updated_at).toLocaleString() : "N/A"}
                </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d9e1ec] bg-white px-4 text-sm font-semibold text-[#41506a] transition hover:border-[#2B76F4] hover:text-[#2B76F4] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isEditing}
                >
                    <FiEdit3 className="h-4 w-4" />
                    {isCreatingNew ? "Create" : "Edit"}
                </button>
                <button
                    type="button"
                    onClick={isCreatingNew || isEditing ? handleSave : handleSetActiveModifier}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2B76F4] px-4 text-sm font-semibold text-white transition hover:bg-[#1f68e8] disabled:cursor-not-allowed disabled:bg-[#9aa8bd]"
                    disabled={
                        updateModifierMutation.isPending ||
                        createModifierMutation.isPending ||
                        deleteModifierMutation.isPending ||
                        (!isCreatingNew && !isEditing && selectedModifier?.is_active)
                    }
                >
                    <FiSave className="h-4 w-4" />
                    {updateModifierMutation.isPending || createModifierMutation.isPending
                        ? "Saving"
                        : isCreatingNew
                            ? "Save & Activate"
                            : isEditing
                                ? "Update"
                                : selectedModifier?.is_active
                                    ? "Active"
                                    : "Activate"}
                </button>
            </div>

            {!isCreatingNew && (
                <button
                    type="button"
                    onClick={handleDelete}
                    className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={deleteModifierMutation.isPending || updateModifierMutation.isPending || createModifierMutation.isPending}
                >
                    <FiTrash2 className="h-4 w-4" />
                    {deleteModifierMutation.isPending ? "Deleting" : "Delete Modifier"}
                </button>
            )}
        </section>
    )
}

export default PromtModifier
