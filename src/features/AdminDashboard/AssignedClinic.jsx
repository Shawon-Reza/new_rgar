import { useQuery } from '@tanstack/react-query'
import axiosApi from '../../service/axiosInstance'
import { FaFax } from "react-icons/fa"
import { FiGlobe, FiMapPin, FiPhone, FiUser } from "react-icons/fi"
import { BiClinic } from "react-icons/bi"
import { TbCategory2 } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'
import useGetUserProfile from '../../hooks/useGetUserProfile'

const AssignedClinic = () => {
    const navigate = useNavigate();
    const { userProfileData } = useGetUserProfile();
    
    // ============ FETCH CLINICS DATA ============
    const { data: clinics, isLoading: loading, error, refetch } = useQuery({
        queryKey: ['clinics-assigned'],
        queryFn: async () => {
            const response = await axiosApi.get('/api/v1/clinics/')
            console.log('[Clinics API Response]:', response.data)
            return Array.isArray(response.data) ? response.data : response.data?.results || response.data?.data || []
        },
    })

    console.log(clinics)


    // ============ CLINIC CARD COMPONENT ============
    const ClinicCard = ({ clinic }) => (
        <div className=" bg-white/50 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">



            {/* Card Header with Title */}
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
            </div>

            {/* Card Content */}
            <div className="space-y-3">


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
        </div>
    )

    return (
        <div className="min-h-screen font-sans">
            {/* Header */}
            <div className="border-b border-gray-200 sticky top-0 z-30">
                <div className="px-6 py-8 bg-[#F0FDF4] flex justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Assigned Clinics</h1>
                        <p className="text-gray-600 mt-1">View your assigned clinic details</p>
                    </div>
                    {/* ======================================== ROles ===================================== */}
                    <button
                        onClick={() => {
                            navigate('/admin/manage-clinic/roles')
                        }}
                        className={`flex items-center sm:gap-2 text-white font-semibold py-2 px-2 sm:px-4 rounded-lg transition-colors hover:opacity-90 ${userProfileData?.role==="president"?"":"hidden"}`}
                        style={{ backgroundColor: "var(--color-primary)" }}
                    >
                        <TbCategory2 size={20} />
                        Roles
                    </button>
                </div>

            </div>

            {/* Main Content */}
            <div className="mx-auto  py-8">
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

export default AssignedClinic