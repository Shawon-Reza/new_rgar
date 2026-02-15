"use client"

import { useState, useRef, useEffect } from "react"
import { useLocation, useNavigate } from 'react-router-dom'
import { FiUploadCloud, FiX } from "react-icons/fi"
import AiTrainingChat from "./AiTraining/AiTrainingChat"
import { useMutation, useQuery } from "@tanstack/react-query"
import axiosApi from "../../service/axiosInstance"
import { toast } from "react-toastify"
import { queryClient } from "../../main"

export default function AITrainingCenter() {
    const [uploadQueue, setUploadQueue] = useState([]);

    const [title, setTitle] = useState("");
    const [providedTopics, setProvidedTopics] = useState("");
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Console logging for component initialization
    useEffect(() => {
        console.log("[AITrainingCenter] Component Initialized")
        console.log("[AITrainingCenter] Initial Upload Queue:", uploadQueue)
    }, [])

    // If navigated from a dislike notification, call the dislike endpoint once
    useEffect(() => {
        const fromId = location?.state?.fromDislikeId
        const fromNotification = location?.state?.fromNotification
        if (!fromNotification || !fromId) return

        const storageKey = `processed_dislike_${fromId}`
        // prevent duplicate calls (handles dev StrictMode and re-renders)
        if (sessionStorage.getItem(storageKey)) {
            // clear history state so future mounts don't see it
            try { window.history.replaceState({}, document.title, window.location.pathname) } catch (e) { }
            return
        }

        (async () => {
            try {
                sessionStorage.setItem(storageKey, 'processing')
                console.log('[AITrainingCenter] Calling dislike endpoint for id:', fromId)
                const res = await axiosApi.post(`/api/v1/dislike/${fromId}/`)
                console.log('[AITrainingCenter] Dislike POST response:', res?.status, res?.data)
                sessionStorage.setItem(storageKey, 'done')
            } catch (err) {
                console.error('[AITrainingCenter] Dislike POST failed:', err?.response?.status, err?.response?.data || err?.message)
                sessionStorage.removeItem(storageKey)
            } finally {
                // Clear the location state without triggering a React navigation
                try { window.history.replaceState({}, document.title, window.location.pathname) } catch (e) { }
            }
        })()
    }, [location])


    // ......................................... Get Room ID for AI Training Chat ...........................................\\
    const { data: roomData, isLoading: isLoadingRoom, error: roomError } = useQuery({
        queryKey: ['aiTrainingRoom'],
        queryFn: async () => {
            const response = await axiosApi.post('/api/v1/mytrainingrooms/')
            console.log('[AiTrainingChat] Room data:', response.data)
            return response.data
        },
        onError: (err) => {
            console.error('[AiTrainingChat] Error fetching room:', err)
        },
    })

    const chatRoom = roomData?.data?.room_id
    console.log(chatRoom)

    const uploadTrainingMutation = useMutation({
        mutationFn: async (formData) => {
            console.log("[AITrainingCenter] Uploading to:", `/api/v1/mytrainingrooms/${chatRoom}/upload/`)
            const response = await axiosApi.post(`/api/v1/mytrainingrooms/${chatRoom}/upload/`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })
            return response.data
        },
        onSuccess: (data) => {
            console.log("[AITrainingCenter] Upload success:", data)
            toast.success("Files uploaded successfully!")
            setUploadQueue([])
            setTitle("")
            setProvidedTopics("")
            queryClient.invalidateQueries({ queryKey: ['aiTrainingDocs'] })
        },
        onError: (error) => {
            console.error("[AITrainingCenter] Upload failed:", error)
            toast.error("Upload failed. Please try again.")
        },
    })

    // Handle drag events
    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    // Handle file drop
    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        const files = e.dataTransfer.files
        console.log("[v0] Files dropped:", files)
        handleFiles(files)
    }

    // Handle file selection
    const handleFileChange = (e) => {
        const files = e.target.files
        console.log("[v0] Files selected:", files)
        handleFiles(files)
    }

    // Process files
    const handleFiles = (files) => {
        const newFiles = Array.from(files).map((file, index) => {
            const fileObj = {
                id: Date.now() + index,
                name: file.name,
                status: "processing",
                progress: Math.floor(Math.random() * 100),
                file,
            }
            console.log("[AITrainingCenter] File added to queue:", fileObj)
            return fileObj
        })

        setUploadQueue([...uploadQueue, ...newFiles])
        console.log("[AITrainingCenter] Updated upload queue:", [...uploadQueue, ...newFiles])
    }

    // Remove file from queue
    const removeFile = (id) => {
        console.log("[AITrainingCenter] Removing file with id:", id)
        const updatedQueue = uploadQueue.filter((file) => file.id !== id)
        setUploadQueue(updatedQueue)
        console.log("[AITrainingCenter] Updated upload queue after removal:", updatedQueue)
    }

    // Handle update AI model
    const handleUpdateAIModel = () => {
        if (!chatRoom) {
            console.error("[AITrainingCenter] No chat room available for upload")
            return
        }

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

    // Check if all required fields are filled
    // const isFormValid = title.trim() !== "" && providedTopics.trim() !== "" && uploadQueue.length > 0 && !!chatRoom
    const isFormValid = providedTopics.trim() !== "" && uploadQueue.length > 0 && !!chatRoom

    return (
        <div className="  h-[calc(100vh-200px)] flex flex-col overflow-y-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Training Center</h1>
                <p className="text-gray-600">Upload and manage training materials for the chatbot</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                {/* Left Section - Upload Documents */}
                <div className="border border-teal-500 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Documents</h2>
                    <p className="text-gray-600 text-sm mb-6">
                        Upload images, PDFs, Word documents, or Excel files to train the AI on clinic procedures, insurance policy medical
                        reference materials, clinical guidelines, and treatment protocols.
                    </p>

                    {/* Title Input */}
                    {/* <div className="mb-4">
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                            Title
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter training title..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                    </div> */}

                    {/* Provided Topics Input */}
                    <div className="mb-6">
                        <label htmlFor="providedTopics" className="block text-sm font-medium text-gray-700 mb-2">
                            Provided Topics
                        </label>
                        <textarea
                            id="providedTopics"
                            value={providedTopics}
                            onChange={(e) => setProvidedTopics(e.target.value)}
                            placeholder="Enter topics to train the AI on..."
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Drag and Drop Area */}
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${dragActive ? "border-teal-500 bg-teal-50" : "border-gray-300"
                            }`}
                    >
                        <FiUploadCloud className="mx-auto text-teal-500 mb-3" size={32} />
                        <p className="text-gray-700 font-medium mb-1">Drag and drop files here, or</p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-teal-500 hover:text-teal-600 font-medium"
                        >
                            Browse files
                        </button>
                        <p className="text-gray-500 text-xs mt-2">Accepted file types: images, pdf, doc, xls</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    {/* Upload Queue */}
                    {uploadQueue.length > 0 && (
                        <div className="border border-gray-200 rounded-lg p-4 mb-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Upload Queue</h3>
                            <div className="space-y-3 max-h-[120px] overflow-auto ">
                                {uploadQueue.map((file) => (
                                    <div key={file.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                                            <span className="text-gray-700 text-sm">{file.name}</span>
                                            <span className="text-teal-500 text-xs font-medium">{file.status}</span>
                                        </div>
                                        <button onClick={() => removeFile(file.id)} className="text-gray-400 hover:text-gray-600">
                                            <FiX size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Update AI Model Button */}
                    <button
                        onClick={handleUpdateAIModel}
                        disabled={!isFormValid || uploadTrainingMutation.isPending}
                        className={`w-full font-semibold py-3 rounded-lg transition-colors ${isFormValid
                            ? "bg-teal-500 hover:bg-teal-600 text-white cursor-pointer"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                    >
                        {uploadTrainingMutation.isPending ? "Updating..." : "Update AI Model"}
                    </button>
                </div>

                {/* ...................................................................*/}

                {/* ................Right Section - AI Assistant Chat................... */}
                <AiTrainingChat />
            </div>
        </div>
    )
}
