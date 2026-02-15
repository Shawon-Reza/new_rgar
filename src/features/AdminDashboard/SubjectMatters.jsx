"use client"

import { useState } from "react"
import { FiEdit2, FiTrash2, FiPlus, FiFileText } from "react-icons/fi"
import AddMatterModal from "./AddMatterModal"
import { useQuery, useMutation } from "@tanstack/react-query"
import axiosApi from "../../service/axiosInstance"
import { toast } from "react-toastify"
import Swal from "sweetalert2"

const SubjectMatters = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedMatter, setSelectedMatter] = useState(null)

    // ..........................................Fetch subject matters from API............................................
    const { data: subjectMatters = [], isLoading: loading, error, refetch } = useQuery({
        queryKey: ['subjectMatters'],
        queryFn: async () => {
            const response = await axiosApi.get('/api/v1/subjects/')
            console.log('[Subject Matters API Response]:', response.data)
            // Handle both array and object responses
            const dataArray = Array.isArray(response.data) ? response.data : response.data?.results || response.data?.data || []
            return dataArray
        },
    })

    // Create subject matter mutation
    const createMatterMutation = useMutation({
        mutationFn: async (matterData) => {
            const response = await axiosApi.post('/api/v1/subjects/create/', {
                title: matterData.title,
                description: matterData.description,
            })
            console.log('[Create Subject Matter Response]:', response.data)
            return response.data
        },
        onSuccess: () => {
            toast.success('Subject matter created successfully')
            refetch()
            handleModalClose()
        },
        onError: (error) => {
            const message = error?.response?.data?.detail || error.message || 'Failed to create subject matter'
            toast.error(message)
            console.log(error)
        },
    })

    // Update subject matter mutation
    const updateMatterMutation = useMutation({
        mutationFn: async (matterData) => {
            const response = await axiosApi.put(`/api/v1/subjects/${matterData.id}/update/`, {
                title: matterData.title,
                description: matterData.description,
            })
            console.log('[Update Subject Matter Response]:', response.data)
            return response.data
        },
        onSuccess: () => {
            toast.success('Subject matter updated successfully')
            refetch()
            handleModalClose()
        },
        onError: (error) => {
            const message = error?.response?.data?.detail || error.message || 'Failed to update subject matter'
            toast.error(message)
            console.log(error)
        },
    })

    // Delete subject matter mutation
    const deleteMatterMutation = useMutation({
        mutationFn: async (matterId) => {
            const response = await axiosApi.delete(`/api/v1/subjects/${matterId}/delete/`)
            console.log('[Delete Subject Matter Response]:', response.data)
            return response.data
        },
        onSuccess: () => {
            toast.success('Subject matter deleted successfully')
            refetch()
        },
        onError: (error) => {
            const message = error?.response?.data?.detail || error.message || 'Failed to delete subject matter'
            toast.error(message)
            console.log(error)
        },
    })

    //    Open modal to add new matter
    const handleModalOpen = () => {
        setIsModalOpen(true)
    }
    const handleModalClose = () => {
        setIsModalOpen(false)
    }



    // Handle add subject matter
    const handleAddSubjectMatter = () => {
        console.log("[SubjectMatters] Add Subject Matter clicked")
        setSelectedMatter(null)
        handleModalOpen()
    }

    // Handle edit subject matter
    const handleEditSubjectMatter = (id, title) => {
        console.log("[SubjectMatters] Edit clicked for ID:", id, "Title:", title)
        const matter = subjectMatters.find((m) => m.id === id) || null
        setSelectedMatter(matter)
        handleModalOpen()
    }

    // Save handler for add/edit
    const handleSaveMatter = (payload) => {
        if (payload.id) {
            // Edit existing
            updateMatterMutation.mutate(payload)
        } else {
            // Add new
            createMatterMutation.mutate(payload)
        }
    }

    // Handle delete subject matter
    const handleDeleteSubjectMatter = (id, title) => {
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        }).then((result) => {
            deleteMatterMutation.mutate(id)
            if (result.isConfirmed) {
                Swal.fire({
                    title: "Deleted!",
                    text: "Your file has been deleted.",
                    icon: "success"
                });
            }
        });
    }

    if (loading) {
        return <div className="p-8">Loading...</div>
    }

    if (error) {
        return <div className="p-8 text-red-600">Error loading subject matters: {error.message}</div>
    }



    return (
        <div className="p-8">
            {/* Add Matter Modal */}
            <AddMatterModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                data={selectedMatter}
                onSubmit={handleSaveMatter}
                isLoading={createMatterMutation.isPending || updateMatterMutation.isPending}
            />

            {/* Header Section */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[#2F2F2F] mb-2">Subject Matters</h1>
                    <p className="text-gray-500">Manage your subject matters</p>
                </div>
                <button
                    onClick={handleAddSubjectMatter}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 bg-primary hover:opacity-90"
                    //   style={{ backgroundColor: "#00A4A6" }}
                    onMouseEnter={(e) => (e.target.style.opacity = "0.9")}
                    onMouseLeave={(e) => (e.target.style.opacity = "1")}
                >
                    <FiPlus size={20} />
                    Add Subject Matter
                </button>
            </div>

            {/* Subject Matters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {subjectMatters?.map((matter) => (
                    <div
                        key={matter.id}
                        className={`${matter.borderColor} rounded-lg p-6 transition-all duration-200 hover:shadow-lg`}
                    >
                        {/* Card Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg text-white bg-primary" >
                                    <FiFileText size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-[#2F2F2F]">{matter.title}</h3>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEditSubjectMatter(matter.id, matter.title)}
                                    className="p-2 hover:bg-white rounded-lg transition-colors duration-200"
                                    title="Edit"
                                >
                                    <FiEdit2 size={18} style={{ color: "#00A4A6" }} />
                                </button>
                                <button
                                    onClick={() => handleDeleteSubjectMatter(matter.id, matter.title)}
                                    className="p-2 hover:bg-white rounded-lg transition-colors duration-200"
                                    title="Delete"
                                >
                                    <FiTrash2 size={18} color="#EF4444" />
                                </button>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="flex items-start gap-3">
                            <FiFileText size={16} className="text-gray-400 mt-1 flex-shrink-0" />
                            <p className="max-h-[250px] overflow-auto text-gray-600 text-sm leading-relaxed thin-scroll">{matter.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default SubjectMatters
