import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import axiosApi from "../../../service/axiosInstance"
import ChatPanel from "../Communication/ChatPanel"
import ClinicSelector from "./ClinicSelector"
import ChatRoomsSidebar from "./ChatRoomsSidebar"

// Constants for filter options
const ROOM_TYPES = [
    { value: 'all', label: 'All' },
    { value: 'private', label: 'Private' },
    { value: 'group', label: 'Group' }
]

const MEMBER_ROLES = [
    { value: 'all', label: 'All' },
    { value: 'president', label: 'President' },
    { value: 'manager', label: 'Manager' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'staff', label: 'Staff' },
    { value: 'jr_staff', label: 'Junior Staff' }
]

const ClinicwiseChatHistory = () => {
    // ============ STATE MANAGEMENT ============
    const [selectedClinic, setSelectedClinic] = useState(null)
    const [selectedType, setSelectedType] = useState('all')
    const [selectedRole, setSelectedRole] = useState('all')
    const [selectedRoom, setSelectedRoom] = useState(null)

    // ============ FETCH CLINIC CHAT DATA ============
    const { data: clinicChatData, isLoading: clinicsLoading } = useQuery({
        queryKey: ['clinicChat'],
        queryFn: async () => {
            const response = await axiosApi.get('/api/v1/clinicChat/')
            console.log('[Clinic Chat API Response]:', response.data)
            return response.data
        },
    })

    console.log('Clinic Chat Data:', clinicChatData?.clinics)

    // ============ FETCH ROOM LIST ============
    const { data: roomsData, isLoading: roomsLoading, error: roomsError } = useQuery({
        queryKey: ['roomsList_for_clinicHistory', selectedClinic?.id, selectedType, selectedRole],
        enabled: !!selectedClinic?.id, // Only fetch when clinic is selected
        queryFn: async () => {
            const response = await axiosApi.get('/api/v1/clinicChat/', {
                params: {
                    clinic_id: selectedClinic.id,
                    type: selectedType === 'all' ? '' : selectedType,
                    member_role: selectedRole === 'all' ? '' : selectedRole
                }
            })
            console.log('[Rooms API Response]:', response.data)
            console.log('[Filtered Rooms]:', response.data?.rooms)
            return response.data
        },
    })

    console.log('Room Lists:====================================================================================', roomsData?.results)

    // ============ HANDLE CLINIC SELECTION ============
    const handleSelectClinic = (clinic) => {
        console.log("Clinic selected in parent:", clinic)
        setSelectedClinic(clinic)
        setSelectedRoom(null) // Reset selected room when clinic changes
    }

    // ============ HANDLE ROOM SELECTION ============
    const handleSelectRoom = (room) => {
        console.log("Room selected:", room)
        setSelectedRoom(room)
    }

    return (
        <div className="pb-10">

            {/* ================================== CLINIC SELECTOR DROPDOWN =================================== */}
            <ClinicSelector
                clinics={clinicChatData?.clinics}
                isLoading={clinicsLoading}
                onSelectClinic={handleSelectClinic}
            />

            {/* ================================== FILTER Clinics =================================== */}
            {selectedClinic && (
                <div className="mb-6 grid grid-cols-2 gap-4">
                    {/* Type Filter */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Room Type</label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {ROOM_TYPES.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Role Filter */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Member Role</label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {MEMBER_ROLES.map(role => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* ================================== ROOMS LOADING STATE =================================== */}
            {selectedClinic && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    {roomsLoading ? (
                        <p className="text-gray-600">Loading rooms...</p>
                    ) : roomsError ? (
                        <p className="text-red-600">Error loading rooms: {roomsError.message}</p>
                    ) : roomsData?.rooms?.length === 0 ? (
                        <p className="text-gray-600">No rooms found for selected filters</p>
                    ) : (
                        <p className="text-gray-700">
                            Found <span className="font-semibold">{roomsData?.rooms?.length}</span> room(s)
                        </p>
                    )}
                </div>
            )}
            {/* =================================== COMMUNICATION PANEL FOR CHAT HISTORY ==================================== */}
            <section className="grid grid-cols-10 gap-6 mt-6 h-[calc(100vh-350px)]">
                {/* Chat Rooms Sidebar - 30% width (3 out of 10 columns) */}
                <div className="col-span-3 h-[calc(100vh-350px)] overflow-auto">
                    <ChatRoomsSidebar
                        roomsData={roomsData}
                        roomsLoading={roomsLoading}
                        roomsError={roomsError}
                        selectedRoom={selectedRoom}
                        onSelectRoom={handleSelectRoom}
                    />
                </div>

                {/* Chat Panel - 70% width (7 out of 10 columns) */}
                <div className="col-span-7 h-[calc(100vh-350px)]">
                    {selectedRoom ? (
                        <ChatPanel chatRoom={selectedRoom.room_id} activeTab="messages" />
                    ) : (
                        <div className="bg-white/50 rounded-lg shadow-sm border border-gray-200 h-full flex items-center justify-center">
                            <p className="text-gray-500 text-center">
                                Select a chat room to start messaging
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}

export default ClinicwiseChatHistory