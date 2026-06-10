"use client"

import { useEffect, useRef, useState } from "react"
import { useLocation } from 'react-router-dom'
import { FiFileText, FiUploadCloud, FiX } from "react-icons/fi"
import AiTrainingChat from "./AiTraining/AiTrainingChat"
import { useMutation, useQuery } from "@tanstack/react-query"
import axiosApi from "../../service/axiosInstance"
import { toast } from "react-toastify"
import { queryClient } from "../../main"

export default function AITrainingCenter() {
    const [uploadQueue, setUploadQueue] = useState([])
    const [title, setTitle] = useState("")
    const [providedTopics, setProvidedTopics] = useState("")
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef(null)
    const location = useLocation()

    useEffect(() => {
        const fromId = location?.state?.fromDislikeId
        const fromNotification = location?.state?.fromNotification
        if (!fromNotification || !fromId) return

        const storageKey = `processed_dislike_${fromId}`
        if (sessionStorage.getItem(storageKey)) {
            try { window.history.replaceState({}, document.title, window.location.pathname) } catch (e) { }
            return
        }

        (async () => {
            try {
                sessionStorage.setItem(storageKey, 'pending')
                await axiosApi.post(`/api/v1/dislike/${fromId}/`)
                sessionStorage.setItem(storageKey, 'done')
            } catch (err) {
                sessionStorage.removeItem(storageKey)
            } finally {
                try { window.history.replaceState({}, document.title, window.location.pathname) } catch (e) { }
            }
        })()
    }, [location])

    const { data: roomData } = useQuery({
        queryKey: ['aiTrainingRoom'],
        queryFn: async () => {
            const response = await axiosApi.post('/api/v1/mytrainingrooms/')
            return response.data
        },
    })

    const chatRoom = roomData?.data?.room_id

    const uploadTrainingMutation = useMutation({
        mutationFn: async (formData) => {
            const response = await axiosApi.post(`/api/v1/mytrainingrooms/${chatRoom}/upload/`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })
            return response.data
        },
        onSuccess: () => {
            toast.success("Training materials uploaded successfully.")
            setUploadQueue([])
            setTitle("")
            setProvidedTopics("")
            queryClient.invalidateQueries({ queryKey: ['aiTrainingDocs'] })
        },
        onError: () => {
            toast.error("Upload failed. Please try again.")
        },
    })

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        handleFiles(e.dataTransfer.files)
    }

    const handleFileChange = (e) => {
        handleFiles(e.target.files)
        e.target.value = ""
    }

    const handleFiles = (files) => {
        const newFiles = Array.from(files || []).map((file, index) => ({
            id: `${Date.now()}-${index}-${file.name}`,
            name: file.name,
            size: file.size,
            status: "Ready",
            file,
        }))

        setUploadQueue((current) => [...current, ...newFiles])
    }

    const removeFile = (id) => {
        setUploadQueue((current) => current.filter((file) => file.id !== id))
    }

    const handleUpdateAIModel = () => {
        if (!chatRoom) return

        const formData = new FormData()
        formData.append("file_name", title)
        formData.append("document_type", providedTopics)

        uploadQueue.forEach((item) => {
            if (item.file) {
                formData.append("files", item.file)
            }
        })

        uploadTrainingMutation.mutate(formData)
    }

    const isFormValid = providedTopics.trim() !== "" && uploadQueue.length > 0 && !!chatRoom

    return (
        <section className="overflow-hidden rounded-lg border border-[#dfe5ee] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <div className="border-b border-[#edf1f7] px-5 py-5 md:px-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2B76F4]">Workspace</p>
                <h2 className="mt-1 text-xl font-semibold text-[#111827]">Train and Test</h2>
                <p className="mt-1 text-sm font-medium text-[#6b7890]">
                    Upload source material, then ask the assistant to validate how it understands your training data.
                </p>
            </div>

            <div className="grid gap-5 bg-[#f8fafc] p-5 lg:grid-cols-[0.95fr_1.05fr] md:p-6">
                <div className="rounded-lg border border-[#dfe5ee] bg-white p-5">
                    <div className="mb-5 flex items-start justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-[#111827]">Training Upload</h3>
                            <p className="mt-1 text-sm font-medium leading-6 text-[#6b7890]">
                                Add PDFs, documents, spreadsheets, or images for AI training.
                            </p>
                        </div>
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eef4ff] text-[#2B76F4]">
                            <FiUploadCloud className="h-5 w-5" />
                        </span>
                    </div>

                    <div className="grid gap-4">
                        <div>
                            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#77849a]">
                                Document Label
                            </label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Optional label"
                                className="h-11 w-full rounded-lg border border-[#d9e1ec] bg-white px-4 text-sm font-medium text-[#172033] outline-none transition placeholder:text-[#97a4b8] focus:border-[#2B76F4] focus:ring-4 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label htmlFor="providedTopics" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#77849a]">
                                Provided Topics
                            </label>
                            <textarea
                                id="providedTopics"
                                value={providedTopics}
                                onChange={(e) => setProvidedTopics(e.target.value)}
                                placeholder="Describe the topics, policies, procedures, or clinical references in these files"
                                rows={4}
                                className="w-full resize-none rounded-lg border border-[#d9e1ec] bg-white px-4 py-3 text-sm font-medium leading-6 text-[#172033] outline-none transition placeholder:text-[#97a4b8] focus:border-[#2B76F4] focus:ring-4 focus:ring-blue-100"
                            />
                        </div>

                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`rounded-lg border border-dashed p-6 text-center transition ${dragActive
                                ? "border-[#2B76F4] bg-[#eef4ff]"
                                : "border-[#cbd5e1] bg-[#f8fafc]"
                                }`}
                        >
                            <FiUploadCloud className="mx-auto mb-3 h-8 w-8 text-[#2B76F4]" />
                            <p className="text-sm font-semibold text-[#172033]">Drop files here</p>
                            <p className="mt-1 text-sm font-medium text-[#6b7890]">PDF, DOC, XLS, JPG, PNG and more</p>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-4 h-10 rounded-lg border border-[#d9e1ec] bg-white px-4 text-sm font-semibold text-[#2B76F4] transition hover:border-[#2B76F4]"
                            >
                                Browse Files
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>

                        {uploadQueue.length > 0 && (
                            <div className="rounded-lg border border-[#e3e9f2] bg-[#f8fafc] p-3">
                                <div className="mb-3 flex items-center justify-between">
                                    <h4 className="text-sm font-semibold text-[#111827]">Ready to Upload</h4>
                                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#6b7890]">
                                        {uploadQueue.length} file{uploadQueue.length === 1 ? "" : "s"}
                                    </span>
                                </div>
                                <div className="max-h-36 space-y-2 overflow-y-auto">
                                    {uploadQueue.map((file) => (
                                        <div key={file.id} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <FiFileText className="h-4 w-4 shrink-0 text-[#2B76F4]" />
                                                <span className="truncate text-sm font-medium text-[#172033]">{file.name}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(file.id)}
                                                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#8b98ad] transition hover:bg-red-50 hover:text-red-600"
                                                aria-label={`Remove ${file.name}`}
                                            >
                                                <FiX className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleUpdateAIModel}
                            disabled={!isFormValid || uploadTrainingMutation.isPending}
                            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#2B76F4] px-5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(43,118,244,0.22)] transition hover:bg-[#1f68e8] disabled:cursor-not-allowed disabled:bg-[#9aa8bd] disabled:shadow-none"
                        >
                            {uploadTrainingMutation.isPending ? "Uploading..." : "Upload Training Materials"}
                        </button>
                    </div>
                </div>

                <AiTrainingChat />
            </div>
        </section>
    )
}
