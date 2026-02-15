import React, { use, useEffect, useMemo, useState } from 'react'
import { FiArrowLeft, FiFileText, FiHash, FiMessageCircle, FiUserX } from 'react-icons/fi'
import { RiContactsBook3Line } from 'react-icons/ri';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import axiosApi from '../../service/axiosInstance';

import UserManageMentSetAction from './UserManageMentSetAction';
import Communication from './Communication/Communication';
import UserDetailsSection from './UserDetailsSection';
import useGetUserProfile from '../../hooks/useGetUserProfile';
import useUserPermissions from '../../hooks/useUserPermissions';


// Small, reusable stat card component
const StatCard = ({ icon: Icon, label, value, children, tone = 'default' }) => {
    const toneClasses = useMemo(() => {
        switch (tone) {
            case 'danger':
                return 'text-red-500';
            case 'muted':
                return 'text-gray-500';
            default:
                return 'text-[#2F2F2F]';
        }
    }, [tone])

    return (
        <div className="bg-white/50 rounded-xl shadow-md p-5 border border-gray-100">
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mb-3">
                <Icon size={25} />
                <span className='font-medium'>{label}</span>
            </div>
            <div className={`text-xl font-bold ${children ? 'mb-3' : ''} ${toneClasses}`}>
                {value}
            </div>
            {children}
        </div>
    )
}

const StatusPill = ({ status }) => {
    const map = {
        Active: 'bg-green-50 text-green-700 border-green-200',
        Blocked: 'bg-red-50 text-red-600 border-red-200',
        Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    }
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${map[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            {status}
        </span>
    )
}

const UserProfileFromAdmin = () => {
    // Mocked state; swap fetchUser with real API later
    const [showActionsMenu, setShowActionsMenu] = useState(false)
    const [userPermissions, setUserPermissions] = useState({
        trainAI: false,
        blockUser: false,
        accessUserProfile: false,
        accessChatHistory: false,
        createAssessment: false
    })

    const { userId } = useParams();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // ............................Fetch user data from API...................................\\
    const { data: user, isLoading: loading, error } = useQuery({
        queryKey: ['user-profile-admin', userId],
        queryFn: async () => {
            const res = await axiosApi.get(`/api/v1/users/${userId}/`);
            console.log('[UserProfileFromAdmin] Fetched user data:', res.data);
            return res.data;
        },
        enabled: !!userId,
    });

    console.log("   User Data:=====================================================================", user)

    // ............................Fetch user permission data from API...................................\\
    // const { data: userPermission, isLoading: loadingPermission, error: errorPermission } = useQuery({
    //     queryKey: ['user-Permissions', userId],
    //     queryFn: async () => {
    //         const res = await axiosApi.get(`/api/v1/permissions/users/${userId}/`);
    //         console.log('[UserProfileFromAdmin] Fetched user data:', res.data);
    //         return res.data;
    //     },
    //     enabled: !!userId,
    // });
    // console.log("   User Permission:", userPermission)
    const {
        data: permissionData,
        isLoading: permissionLoading,
        error: permissionError
    } = useUserPermissions(userId);

    console.log("User Permissions:", permissionData?.groupPerms);






    // Status mutation for toggling active/inactive
    const statusMutation = useMutation({
        mutationFn: async ({ userId, nextStatus }) => {
            const payload = { is_active: !!nextStatus };
            console.log('[UserProfileFromAdmin] Toggle status payload:', payload);
            const response = await axiosApi.patch(`/api/v1/users/status/${userId}/`, payload);
            return response.data;
        },
        onSuccess: (_, variables) => {
            toast.success(`User ${variables.nextStatus ? "activated" : "deactivated"} successfully`);
            queryClient.invalidateQueries({ queryKey: ['user-profile-admin', userId] });
        },
        onError: (error) => {
            const message = error?.response?.data?.message || "Failed to update status";
            toast.error(message);
        }
    });

    const handleBack = () => {

        navigate(-1);
    }

    const handleToggleChat = () => {
        console.log('[UserProfileFromAdmin] Chat toggle clicked - implement API call');
        // TODO: Implement API call to toggle chat status
    }

    const handleToggleStatus = () => {
        if (!user?.id) return;
        statusMutation.mutate({
            userId: user.id,
            nextStatus: !user.is_active
        });
    }

    const handleToggleActionsMenu = () => {
        setShowActionsMenu(prev => !prev)
    }

    const handleSavePermissions = (userId, permissions) => {
        setUserPermissions(permissions)
        console.log('[UserProfileFromAdmin] Permissions saved for user:', userId, permissions)
        // TODO: Call API to save permissions
        // Example: PUT /api/users/${userId}/permissions with body: permissions
    }

    const handleCloseActionsMenu = () => {
        setShowActionsMenu(false)
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="h-6 w-28 rounded bg-gray-200 animate-pulse mb-6" />
                <div className="h-10 w-64 rounded bg-gray-200 animate-pulse mb-3" />
                <div className="h-6 w-80 rounded bg-gray-200 animate-pulse mb-8" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-28 bg-white rounded-xl shadow-md border border-gray-100 animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 md:p-8">
            {/* Top actions */}
            <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-primary hover:bg-teal-50 border border-primary"
                style={{ borderColor: "var(--color-primary)" }}
                aria-label="Go back"
            >
                <FiArrowLeft className="w-4 h-4" />
                <span>Back</span>
            </button>

            {/* Header  */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between">
                <div className="mb-4 sm:mb-0">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#2F2F2F]">
                        {user?.full_name} <span className="font-semibold">Profile</span>
                    </h1>
                    <p className="text-gray-500 mt-2">See the profile overview and chat history</p>
                </div>

                <div className="relative">
                    <button
                        onClick={handleToggleActionsMenu}
                        disabled={user?.role !== 'manager'}
                        className={`text-lg font-medium px-4 xl:px-12 py-2 bg-primary text-white rounded-md w-max hover:opacity-90 transition
                        ${user?.role !== 'manager' ? 'opacity-50 cursor-not-allowed' : ''}
                   `}
                    >
                        Actions
                    </button>


                    {/* Actions Dropdown */}
                    <UserManageMentSetAction
                        isOpen={showActionsMenu}
                        onClose={handleCloseActionsMenu}
                        userId={userId}
                        permissionData={permissionData}
                        permissionLoading={permissionLoading}
                        onSave={handleSavePermissions}
                    />
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 text-center itc">
                <StatCard icon={RiContactsBook3Line} label="Employee ID" value={user?.employee_id || '--'} />

                <StatCard icon={FiFileText} label="Sub Roles Matter" value={user?.subroles?.join(', ') || '--'} />

                <StatCard icon={FiUserX} label="Account Status" value={<span className={!user?.is_active ? 'text-red-500' : ''}>{user?.is_active ? 'Active' : 'Inactive'}</span>}>
                    <div className="mt-2">
                        <StatusPill status={user?.is_active ? 'Active' : 'Blocked'} />
                        <button
                            onClick={handleToggleStatus}
                            disabled={statusMutation.isPending}
                            className={`ml-3 px-3 py-1.5 text-xs rounded-lg border transition-colors ${statusMutation.isPending
                                ? 'opacity-60 cursor-not-allowed border-gray-200 text-gray-500'
                                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {statusMutation.isPending
                                ? 'Updating...'
                                : user?.is_active ? 'Set Inactive' : 'Set Active'}
                        </button>
                    </div>
                </StatCard>
            </div>

            {/* User Details Section */}
            <UserDetailsSection
                user={user}
                permissionData={permissionData}
                permissionLoading={permissionLoading}
                permissionError={permissionError}
            />

            {/* Chat History Section */}
            <div className="mt-8">
                <h2 className="text-xl font-semibold text-[#2F2F2F] mb-3">Viewing Chat History</h2>
                {/* ............................User Chat History ........................ */}
                <Communication />




                {/* Placeholder for future chat list */}
                {/* <div className="rounded-xl border border-dashed border-gray-300 p-6 text-gray-500">
                    Chat history will appear here. Integrate your messages API and render the conversation list.

                    
                </div> */}
            </div>
        </div>
    )
}

export default UserProfileFromAdmin