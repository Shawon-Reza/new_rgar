import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FiCheck, FiChevronDown, FiCpu, FiRefreshCw, FiSave } from "react-icons/fi"
import { toast } from "react-toastify"
import axiosApi from "../../../service/axiosInstance"

const MODEL_FIELDS = [
    {
        key: "chartly_model",
        title: "Chartly AI",
        description: "Charting conversations and clinical note support.",
    },
    {
        key: "assistant_model",
        title: "AI Assistant",
        description: "General assistant chat responses.",
    },
    {
        key: "training_model",
        title: "Training",
        description: "Training uploads and knowledge-base requests.",
    },
]

const buildInitialSelection = (data) => ({
    chartly_model: data?.chartly_model || "",
    assistant_model: data?.assistant_model || "",
    training_model: data?.training_model || "",
})

const getErrorMessage = (error, fallback) => (
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    fallback
)

const AIModelSettings = () => {
    const queryClient = useQueryClient()
    const [openModelKey, setOpenModelKey] = useState("")
    const [selectedModels, setSelectedModels] = useState({
        chartly_model: "",
        assistant_model: "",
        training_model: "",
    })

    const {
        data: modelResponse,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
    } = useQuery({
        queryKey: ["aiModels"],
        queryFn: async () => {
            const response = await axiosApi.get("/api/v1/ai-models/")
            return response.data
        },
    })

    const modelData = modelResponse?.data
    const originalModels = useMemo(() => buildInitialSelection(modelData), [modelData])
    const modelChoices = Array.isArray(modelData?.choices) ? modelData.choices : []

    useEffect(() => {
        if (modelData) {
            setSelectedModels(buildInitialSelection(modelData))
        }
    }, [modelData])

    useEffect(() => {
        if (!openModelKey) return undefined

        const handleClickOutside = (event) => {
            if (!event.target.closest("[data-model-dropdown-root]")) {
                setOpenModelKey("")
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [openModelKey])

    const updateModelMutation = useMutation({
        mutationFn: async (payload) => {
            const response = await axiosApi.patch("/api/v1/ai-models/", payload)
            return response.data
        },
        onSuccess: async () => {
            toast.success("AI models updated successfully.")
            await queryClient.invalidateQueries({ queryKey: ["aiModels"] })
        },
        onError: (mutationError) => {
            toast.error(getErrorMessage(mutationError, "Failed to update AI models."))
        },
    })

    const hasChanges = MODEL_FIELDS.some(
        (field) => selectedModels[field.key] !== originalModels[field.key]
    )
    const hasMissingSelection = MODEL_FIELDS.some((field) => !selectedModels[field.key])

    const handleModelChange = (fieldKey, value) => {
        setSelectedModels((current) => ({
            ...current,
            [fieldKey]: value,
        }))
        setOpenModelKey("")
    }

    const handleSave = () => {
        if (hasMissingSelection) {
            toast.error("Please select a model for every AI area.")
            return
        }

        setOpenModelKey("")
        updateModelMutation.mutate(selectedModels)
    }

    const getModelOptions = (currentValue) => {
        const hasCurrentValue = modelChoices.some((choice) => choice?.id === currentValue)
        const normalizedChoices = modelChoices.map((choice) => ({
            id: choice.id,
            label: choice.label || choice.id,
        }))

        if (hasCurrentValue || !currentValue) return normalizedChoices
        return [{ id: currentValue, label: currentValue }, ...normalizedChoices]
    }

    const getSelectedLabel = (currentValue) => {
        const selectedChoice = modelChoices.find((choice) => choice?.id === currentValue)
        return selectedChoice?.label || currentValue || "Select model"
    }

    if (isLoading) {
        return (
            <section className="overflow-hidden rounded-lg border border-[#dfe5ee] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                <div className="animate-pulse p-6">
                    <div className="h-6 w-44 rounded bg-[#e8edf5]" />
                    <div className="mt-6 grid gap-4 lg:grid-cols-3">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="h-32 rounded-lg bg-[#f3f6fb]" />
                        ))}
                    </div>
                </div>
            </section>
        )
    }

    if (isError) {
        return (
            <section className="rounded-lg border border-red-100 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-[#111827]">Model settings unavailable</h3>
                        <p className="mt-1 text-sm font-medium text-[#6b7890]">
                            {getErrorMessage(error, "Failed to load AI model settings.")}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                    >
                        <FiRefreshCw className="h-4 w-4" />
                        Retry
                    </button>
                </div>
            </section>
        )
    }

    return (
        <section className="overflow-visible rounded-lg border border-[#dfe5ee] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-4 border-b border-[#edf1f7] px-5 py-5 lg:flex-row lg:items-start lg:justify-between md:px-6">
                <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#eef4ff] text-[#2B76F4]">
                        <FiCpu className="h-5 w-5" />
                    </span>
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2B76F4]">Model Settings</p>
                        <h2 className="mt-1 text-xl font-semibold text-[#111827]">AI Models</h2>
                        <p className="mt-1 text-sm font-medium text-[#6b7890]">
                            Select the backend model for each AI workflow.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-[#8b98ad]">
                            <span>Owner: {modelData?.owner_name || "N/A"}</span>
                            <span>
                                Updated: {modelData?.updated_at ? new Date(modelData.updated_at).toLocaleString() : "N/A"}
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={!hasChanges || hasMissingSelection || updateModelMutation.isPending}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#2B76F4] px-5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(43,118,244,0.22)] transition hover:bg-[#1f68e8] disabled:cursor-not-allowed disabled:bg-[#9aa8bd] disabled:shadow-none"
                >
                    <FiSave className="h-4 w-4" />
                    {updateModelMutation.isPending ? "Saving..." : "Save Models"}
                </button>
            </div>

            <div className="grid gap-4 bg-[#f8fafc] p-5 lg:grid-cols-3 md:p-6">
                {MODEL_FIELDS.map((field) => (
                    <div key={field.key} className="rounded-lg border border-[#dfe5ee] bg-white p-4">
                        <div className="mb-4">
                            <h4 className="text-sm font-semibold text-[#111827]">{field.title}</h4>
                            <p className="mt-1 min-h-10 text-sm font-medium leading-5 text-[#6b7890]">{field.description}</p>
                        </div>
                        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#77849a]">
                            Selected Model
                        </label>
                        <div className="relative" data-model-dropdown-root>
                            <button
                                type="button"
                                onClick={() => {
                                    if (updateModelMutation.isPending || isFetching) return
                                    setOpenModelKey((current) => current === field.key ? "" : field.key)
                                }}
                                disabled={updateModelMutation.isPending || isFetching}
                                className={`flex h-11 w-full items-center justify-between gap-3 rounded-lg border bg-white px-3 text-left text-sm font-semibold outline-none transition disabled:cursor-not-allowed disabled:bg-[#f3f6fb] ${openModelKey === field.key
                                    ? "border-[#2B76F4] ring-4 ring-blue-100"
                                    : "border-[#d9e1ec] hover:border-[#2B76F4]"
                                    }`}
                            >
                                <span className="truncate text-[#172033]">
                                    {getSelectedLabel(selectedModels[field.key])}
                                </span>
                                <FiChevronDown className={`h-4 w-4 shrink-0 text-[#8b98ad] transition ${openModelKey === field.key ? "rotate-180 text-[#2B76F4]" : ""}`} />
                            </button>

                            {openModelKey === field.key && (
                                <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-lg border border-[#dfe5ee] bg-white p-1 shadow-[0_18px_45px_rgba(15,23,42,0.14)]">
                                    <div className="max-h-64 overflow-y-auto">
                                        {getModelOptions(selectedModels[field.key]).map((choice) => {
                                            const isSelected = choice.id === selectedModels[field.key]

                                            return (
                                                <button
                                                    key={choice.id}
                                                    type="button"
                                                    onClick={() => handleModelChange(field.key, choice.id)}
                                                    className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-sm font-semibold transition ${isSelected
                                                        ? "bg-[#eef4ff] text-[#2B76F4]"
                                                        : "text-[#41506a] hover:bg-[#f8fafc]"
                                                        }`}
                                                >
                                                    <span className="truncate">{choice.label}</span>
                                                    {isSelected && <FiCheck className="h-4 w-4 shrink-0" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default AIModelSettings
