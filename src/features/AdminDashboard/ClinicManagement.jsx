"use client"

import { useState } from "react"
import { FaFax } from "react-icons/fa"
import { FiEdit2, FiFacebook, FiGlobe, FiMapPin, FiPhone, FiPlus, FiTrash2, FiUser } from "react-icons/fi"
import AddClinicModal from "./AddClinicModal"
import { BiClinic } from "react-icons/bi"
import { useQuery, useMutation } from "@tanstack/react-query"
import axiosApi from "../../service/axiosInstance"
import { toast } from "react-toastify"
import Swal from "sweetalert2"
import { GoHistory } from "react-icons/go";
import { useNavigate } from "react-router-dom"
import { TbCategory2 } from "react-icons/tb";

const ClinicManagement = () => {
    // ============ STATE MANAGEMENT ============
    const [isAddClinicOpen, setIsAddClinicOpen] = useState(false)
    const [isEditClinicOpen, setIsEditClinicOpen] = useState(false)
    const [selectedClinic, setSelectedClinic] = useState(null)
    const navigate = useNavigate()

    // ============ FETCH CLINICS DATA ============
    const { data: clinics, isLoading: loading, error, refetch } = useQuery({
        queryKey: ['clinics'],
        queryFn: async () => {
            const response = await axiosApi.get('/api/v1/clinics/')
            console.log('[Clinics API Response]:', response.data)
            return Array.isArray(response.data) ? response.data : response.data?.results || response.data?.data || []
        },
    })

    console.log(clinics)

    // ============ DELETE CLINIC MUTATION ============
    const deleteClinicMutation = useMutation({
        mutationFn: async (clinicId) => {
            const response = await axiosApi.delete(`/api/v1/clinics/${clinicId}/delete/`)
            console.log('[Delete Clinic Response]:', response.data)
            return response.data
        },
        onSuccess: () => {
            refetch()
        },
        onError: (error) => {
            const message = error?.response?.data?.detail || error.message || "Failed to delete clinic"
            toast.error(message)
            console.log(error)
        },
    })

    // =============================================== TOGGLE ACTIVE/INACTIVE CLINIC MUTATION ==========================================\\
    const toggleClinicStatusMutation = useMutation({
        mutationFn: async ({ clinicId, isCurrentlyDeleted }) => {
            const response = await axiosApi.post(
                `/api/v1/clinics/${clinicId}/active/`,
                { is_deleted: !isCurrentlyDeleted }
            )
            console.log('[Toggle Clinic Status Response]:', response.data)
            return response.data
        },
        onSuccess: (data, { clinicId, isCurrentlyDeleted }) => {
            refetch()
            const newStatus = !isCurrentlyDeleted
            toast.success(
                `Clinic ${newStatus ? 'deactivated' : 'activated'} successfully!`
            )
        },
        onError: (error) => {
            const message = error?.response?.data?.detail || error.message || "Failed to update clinic status"
            toast.error(message)
            console.log(error)
        },
    })

    // ============ EVENT HANDLERS ============
    const handleAddClinic = () => {
        setSelectedClinic(null)
        setIsAddClinicOpen(true)
    }

    // =========== EDIT & DELETE HANDLERS ============
    const handleEditClinic = ({ id }) => {
        const clinicToEdit = clinics?.find((clinic) => clinic.id === id)
        setSelectedClinic(clinicToEdit)
        setIsAddClinicOpen(true)
    }

    const handleRoles = () => {
        navigate('/admin/manage-clinic/roles')
    }


    const handleDeleteClinic = (clinicId, clinicName) => {
        Swal.fire({
            title: "Are you sure?",
            html: `
        You won't be able to revert this!<br/><br/>
        <span style="color: red; font-weight: bold;">
            ⚠ If you delete this clinic, all its members and chat history will be permanently removed.
        </span>
    `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "Yes, delete it!"
        }).then((result) => {
            if (result.isConfirmed) {
                deleteClinicMutation.mutate(clinicId);

                Swal.fire({
                    title: "Deleted!",
                    text: "The clinic and all related data have been removed.",
                    icon: "success"
                });
            }
        });

    }

    // ============ CLINIC CARD COMPONENT ============
    const ClinicCard = ({ clinic }) => (

        <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col">
            {/* Card Header with Title and Actions */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: "var(--color-primary)" }}
                    >
                        <FiMapPin className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{clinic.name}</h3>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleEditClinic({ id: clinic.id })}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit clinic"
                    >
                        <FiEdit2
                            className="w-4 h-4 text-gray-600 cursor-pointer" />
                    </button>
                    <button
                        onClick={() => handleDeleteClinic(clinic.id, clinic.name)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete clinic"
                    >
                        <FiTrash2 className="w-4 h-4 text-red-500" />
                    </button>
                </div>
            </div>

            {/* Card Content */}
            <div className="space-y-3 flex-1">


                {/* Phone & Fax Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                        <FiMapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Address</p>
                            <p className="text-sm text-gray-700">{clinic.address}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <BiClinic className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Type</p>
                            <p className="text-sm text-gray-700">{clinic.clinic_type_name}</p>
                        </div>
                    </div>
                </div>


                {/* Phone & Fax Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                        <FiPhone className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Phone</p>
                            <p className="text-sm text-gray-700">{clinic.phone}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <FaFax className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500 font-medium">FAX Number</p>
                            <p className="text-sm text-gray-700">{clinic.fax}</p>
                        </div>
                    </div>
                </div>

                {/* Website & Staff Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                        <FiGlobe className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div className="overflow-hidden flex-1">
                            <p className="text-xs text-gray-500 font-medium">Website</p>
                            {/* open in new tab */}
                            <a href={clinic.website}
                                className="text-sm text-blue-600 hover:underline block truncate"
                                target="_blank"
                                rel="noopener noreferrer"
                            >{clinic.website}
                            </a>

                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <FiUser className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Staff Members</p>
                            <p className="text-sm text-gray-700">{clinic.staffMembers} members</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-4">
                <button
                    onDoubleClick={() =>
                        toggleClinicStatusMutation.mutate({
                            clinicId: clinic.id,
                            isCurrentlyDeleted: clinic.is_deleted,
                        })
                    }
                    disabled={toggleClinicStatusMutation.isPending}
                    className={`w-full py-3 rounded-lg font-semibold border transition-colors flex items-center justify-center gap-2 ${clinic.is_deleted
                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                        : 'bg-primary text-white border-primary/40 hover:opacity-90'
                        } ${toggleClinicStatusMutation.isPending
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer'
                        }`}
                    title="Double-click to toggle status"
                >
                    <span
                        className={`w-2 h-2 rounded-full ${clinic.is_deleted ? 'bg-red-600' : 'bg-white'
                            }`}
                    ></span>
                    {clinic.is_deleted ? 'Inactive' : 'Active'}
                </button>
            </div>
        </div>
    )




    // =============================================== RENDER ====================================================
    return (
        <div className="min-h-screen  font-sans">
            {/* Add Clinic Modal */}
            <AddClinicModal
                isOpen={isAddClinicOpen}
                onClose={() => {
                    setIsAddClinicOpen(false);
                    setSelectedClinic(null);
                    refetch();
                }}
                data={selectedClinic}
            />

            {/* Header */}
            {/* sticky top-0 z-30 */}
            <div className=" border-gray-200 ">

                <div className=" px-6 py-8 flex flex-col sm:flex-row items-center justify-between bg-white/8 shadow-lg rounded-xl ">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Clinic Management</h1>
                        <p className="text-gray-600 mt-1">Manage your clinic and address</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/admin/clinicwise-chat-history')}
                            className="flex items-center sm:gap-2 text-white font-semibold py-2 px-2 sm:px-4 rounded-lg transition-colors hover:opacity-90"
                            style={{ backgroundColor: "var(--color-primary)" }}
                        >
                            <GoHistory size={20} />
                            Clinics chat history
                        </button>
                        <button
                            onClick={handleAddClinic}
                            className="flex items-center sm:gap-2 text-white font-semibold py-2 px-2 sm:px-4 rounded-lg transition-colors hover:opacity-90"
                            style={{ backgroundColor: "var(--color-primary)" }}
                        >
                            <FiPlus size={20} />
                            Add Clinic
                        </button>
                        <button
                            onClick={handleRoles}
                            className="flex items-center sm:gap-2 text-white font-semibold py-2 px-2 sm:px-4 rounded-lg transition-colors hover:opacity-90"
                            style={{ backgroundColor: "var(--color-primary)" }}
                        >
                            <TbCategory2 size={20} />
                            Roles
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className=" mx-auto  py-8">
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600">Loading clinics data...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <p className="text-red-600">Error loading clinics: {error.message}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1  lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {clinics?.map((clinic) => (
                            <ClinicCard key={clinic.id} clinic={clinic} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default ClinicManagement
