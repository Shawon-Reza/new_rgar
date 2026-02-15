import React, { useState, useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import axiosApi from '../../service/axiosInstance'

const UserManageMentSetAction = ({ isOpen, onClose, userId, permissionData, permissionLoading, onSave }) => {
    const queryClient = useQueryClient()
    const dropdownRef = useRef(null)
    const [permissions, setPermissions] = useState({
        ai_training: false,
        block_user: false,
        user_management: false,
        chat: false,
        assessment: false
    })
    const [togglingGroup, setTogglingGroup] = useState(null)
    
    console.log("[UserManageMentSetAction] permissionData:", permissionData?.groupPerms)
    console.log("[UserManageMentSetAction] UUserID:", userId)

    // Mutation for toggling permissions
    const togglePermissionMutation = useMutation({
        mutationFn: async ({ group, enabled }) => {
            const payload = {
                user_id: userId,
                group: group,
                enabled: enabled
            }
            console.log('[UserManageMentSetAction] Toggling permission:', payload)
            const response = await axiosApi.post('/api/v1/permissions/groups/toggle/', payload)
            return response.data
        },
        onSuccess: (data, variables) => {
            toast.success(`Permission updated successfully`)
            // Invalidate the permissions query to refetch data
            queryClient.invalidateQueries({ queryKey: ['user-permissions', userId] })
        },
        onError: (error) => {
            const message = error?.response?.data?.message || "Failed to update permission"
            toast.error(message)
        }
    })

    // Update permissions when permissionData changes
    useEffect(() => {
        if (permissionData?.groupPerms) {
            setPermissions({
                ai_training: permissionData.groupPerms.ai_training || false,
                block_user: permissionData.groupPerms.block_user || false,
                user_management: permissionData.groupPerms.user_management || false,
                chat: permissionData.groupPerms.chat || false,
                assessment: permissionData.groupPerms.assessment || false
            })
        }
    }, [permissionData])

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose && onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen, onClose])

    const handleTogglePermission = (permission) => {
        setTogglingGroup(permission)
        const newValue = !permissions[permission]
        
        // Optimistically update local state
        setPermissions((prev) => ({
            ...prev,
            [permission]: newValue
        }))

        // Make API call
        togglePermissionMutation.mutate(
            { group: permission, enabled: newValue },
            {
                onSettled: () => {
                    setTogglingGroup(null)
                }
            }
        )
    }

    if (!isOpen) return null

    return (
        <div
            ref={dropdownRef}
            className="absolute md:right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50"
        >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Allow Actions</h3>
            </div>

            {/* Permissions List */}
            <div className="p-4 space-y-1">
                {permissionLoading ? (
                    <div className="space-y-2 p-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* AI Training */}
                        <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-lg transition">
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700">AI Training</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={permissions.ai_training}
                                    onChange={() => handleTogglePermission('ai_training')}
                                    disabled={togglingGroup === 'ai_training'}
                                    className="sr-only peer"
                                />
                                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600 ${togglingGroup === 'ai_training' ? 'opacity-50' : ''}`}></div>
                            </label>
                        </div>

                        {/* Block User */}
                        <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-lg transition">
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700">Block User</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={permissions.block_user}
                                    onChange={() => handleTogglePermission('block_user')}
                                    disabled={togglingGroup === 'block_user'}
                                    className="sr-only peer"
                                />
                                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600 ${togglingGroup === 'block_user' ? 'opacity-50' : ''}`}></div>
                            </label>
                        </div>

                        {/* User Management */}
                        <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-lg transition">
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700">User Management</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={permissions.user_management}
                                    onChange={() => handleTogglePermission('user_management')}
                                    disabled={togglingGroup === 'user_management'}
                                    className="sr-only peer"
                                />
                                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600 ${togglingGroup === 'user_management' ? 'opacity-50' : ''}`}></div>
                            </label>
                        </div>

                        {/* Chat */}
                        <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-lg transition">
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700">Chat</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={permissions.chat}
                                    onChange={() => handleTogglePermission('chat')}
                                    disabled={togglingGroup === 'chat'}
                                    className="sr-only peer"
                                />
                                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600 ${togglingGroup === 'chat' ? 'opacity-50' : ''}`}></div>
                            </label>
                        </div>

                        {/* Assessment */}
                        <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-lg transition">
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700">Assessment</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={permissions.assessment}
                                    onChange={() => handleTogglePermission('assessment')}
                                    disabled={togglingGroup === 'assessment'}
                                    className="sr-only peer"
                                />
                                <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600 ${togglingGroup === 'assessment' ? 'opacity-50' : ''}`}></div>
                            </label>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default UserManageMentSetAction