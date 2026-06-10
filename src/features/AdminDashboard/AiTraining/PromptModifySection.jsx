import { useEffect, useState } from "react"
import Swal from "sweetalert2"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FiEdit3, FiRefreshCw, FiSave } from "react-icons/fi"
import axiosApi from "../../../service/axiosInstance"

const PromptModifySection = () => {
    const queryClient = useQueryClient()
    const [promptValue, setPromptValue] = useState("")
    const [isEditing, setIsEditing] = useState(false)

    const stripMarkdownToText = (value) => {
        if (!value) return ""
        return value
            .replace(/```[\s\S]*?```/g, "")
            .replace(/`([^`]*)`/g, "$1")
            .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
            .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
            .replace(/\n{3,}/g, "\n\n")
            .trim()
    }

    const resetPromptMutation = useMutation({
        mutationFn: async () => {
            const response = await axiosApi.delete('/api/v1/global-prompt/')
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['globalPrompt'] })
            setPromptValue("")
            setIsEditing(false)
        },
    })

    const { data: promptData, isLoading, error } = useQuery({
        queryKey: ['globalPrompt'],
        queryFn: async () => {
            const response = await axiosApi.get('/api/v1/global-prompt/')
            return response.data
        },
    })

    const updatePromptMutation = useMutation({
        mutationFn: async (payload) => {
            const response = await axiosApi.put('/api/v1/global-prompt/', payload)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['globalPrompt'] })
            setIsEditing(false)
        },
    })

    useEffect(() => {
        if (promptData?.data?.prompt && !isEditing) {
            setPromptValue(stripMarkdownToText(promptData.data.prompt))
        }
    }, [promptData?.data?.prompt, isEditing])

    const handleSave = async () => {
        const result = await Swal.fire({
            title: "Save prompt template?",
            text: "This will update the global assistant behavior.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#2B76F4",
            cancelButtonColor: "#ef4444",
            confirmButtonText: "Save"
        })

        if (result.isConfirmed) {
            updatePromptMutation.mutate({ prompt: promptValue })
        }
    }

    if (isLoading) {
        return (
            <section className="rounded-lg border border-[#dfe5ee] bg-white p-5">
                <div className="animate-pulse">
                    <div className="h-5 w-32 rounded bg-[#e8edf5]" />
                    <div className="mt-4 h-72 rounded-lg bg-[#f3f6fb]" />
                </div>
            </section>
        )
    }

    if (error) {
        return (
            <section className="rounded-lg border border-red-100 bg-white p-5">
                <p className="text-sm font-semibold text-red-600">Failed to load prompt data.</p>
            </section>
        )
    }

    return (
        <section className="flex h-full flex-col rounded-lg border border-[#dfe5ee] bg-white p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-base font-semibold text-[#111827]">Global Template</h3>
                    <p className="mt-1 text-sm font-medium text-[#6b7890]">Primary assistant instruction set.</p>
                </div>
                <button
                    type="button"
                    onClick={() => resetPromptMutation.mutate()}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#d9e1ec] bg-white px-3 text-xs font-semibold text-[#41506a] transition hover:border-[#2B76F4] hover:text-[#2B76F4] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={resetPromptMutation.isPending}
                >
                    <FiRefreshCw className={`h-4 w-4 ${resetPromptMutation.isPending ? 'animate-spin' : ''}`} />
                    {resetPromptMutation.isPending ? "Resetting" : "Reset"}
                </button>
            </div>

            <textarea
                className="min-h-[300px] flex-1 resize-none rounded-lg border border-[#d9e1ec] bg-white px-4 py-3 text-sm font-medium leading-6 text-[#172033] outline-none transition disabled:bg-[#f8fafc] disabled:text-[#6b7890] focus:border-[#2B76F4] focus:ring-4 focus:ring-blue-100"
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                disabled={!isEditing}
            />

            <div className="mt-4 grid gap-2 text-xs font-medium text-[#8b98ad] sm:grid-cols-2">
                <span>Updated by: {promptData?.data?.updated_by || 'N/A'}</span>
                <span className="sm:text-right">
                    {promptData?.data?.updated_at ? new Date(promptData.data.updated_at).toLocaleString() : 'N/A'}
                </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d9e1ec] bg-white px-4 text-sm font-semibold text-[#41506a] transition hover:border-[#2B76F4] hover:text-[#2B76F4] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isEditing}
                >
                    <FiEdit3 className="h-4 w-4" />
                    Edit
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2B76F4] px-4 text-sm font-semibold text-white transition hover:bg-[#1f68e8] disabled:cursor-not-allowed disabled:bg-[#9aa8bd]"
                    disabled={!isEditing || updatePromptMutation.isPending}
                >
                    <FiSave className="h-4 w-4" />
                    {updatePromptMutation.isPending ? 'Saving' : 'Save'}
                </button>
            </div>
        </section>
    )
}

export default PromptModifySection
