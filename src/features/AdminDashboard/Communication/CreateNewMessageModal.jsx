import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { FiCheck, FiChevronDown } from 'react-icons/fi';
import axiosApi from '../../../service/axiosInstance';
import { base_URL } from '../../../config/Config';
import { queryClient } from '../../../main';
import { toast } from 'react-toastify';

const fakeRoles = ['doctor', 'manager', 'staff', 'jr_staff'];
const dropdownButtonClass = "flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-[#d9e1ec] bg-white px-4 text-left text-sm font-extrabold text-[#172033] shadow-sm outline-none transition hover:border-[#2f6ff3] focus:border-[#2f6ff3] focus:ring-4 focus:ring-blue-100";
const dropdownMenuClass = "absolute left-0 right-0 top-[calc(100%+8px)] z-[80] max-h-56 overflow-y-auto rounded-2xl border border-[#dfe7f2] bg-white p-1.5 shadow-[0_18px_42px_rgba(15,23,42,0.16)]";

const CreateNewMessageModal = ({ onClose, onChatCreated }) => {
    const [userSearch, setUserSearch] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [message, setMessage] = useState('');
    const [showRoleDropdown, setShowRoleDropdown] = useState(false);


    // .......................*Fetch Clinics & Users List*......................... //
    const { data: userList, isLoading: userListIsLoading, error: userListError } = useQuery({
        queryKey: ['clinics&userlist', userSearch, selectedRole],
        queryFn: async () => {
            // Simulate API call with filtering
            const res = await axiosApi.get(`/api/v1/chat/clinic/members/?search=${userSearch}&role=${selectedRole}`);
            return res.data;
        },
    });

    // ..............*Mutation query function for create Private Chat*.............. //
    // Fixed typo + better name
    const createPrivateChats = useMutation({
        mutationFn: async ({ payload }) => {
            const res = await axiosApi.post('/api/v1/rooms/directmesseges/', payload);
            return res.data; // Always return data
        },
        onSuccess: (data) => {

            // Important: Refresh the chat list so the new room appears immediately
            queryClient.invalidateQueries({ queryKey: ['myRooms'] });

            const roomId = data?.data?.results?.[0]?.room_id;
            if (roomId && typeof onChatCreated === 'function') {
                onChatCreated(roomId, data);
            }
            onClose?.();
        },
        onError: (error) => {
            // Better toast message
            const msg = error?.response?.data?.message || error?.message || "Failed to start chat";
            toast.error(msg);
        },
    });

    const handleRoleChange = (role) => {
        setSelectedRole(role);
        setShowRoleDropdown(false);
    };

    const handleUserClick = (userId) => {
        const payload = {
            user_ids: [userId],
            content: message,
        };
        // ...................**Call Mutation Function**................... //
        createPrivateChats.mutate({ payload });
    };



    return (
        <div className="" >
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-gray-300 pb-2">New Direct Message</h2>
            <form className="space-y-4">
                {/* Search User & Role */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="text-sm font-medium mb-1 flex items-center gap-2">
                            Search User
                        </label>
                        <input
                            type="text"
                            className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] border-gray-300 shadow-sm"
                            placeholder="Search here"
                            value={userSearch}
                            onChange={e => setUserSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-sm font-medium mb-1 flex items-center gap-2">
                            Role
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowRoleDropdown((value) => !value)}
                                className={dropdownButtonClass}
                            >
                                <span className={`truncate ${selectedRole ? "" : "text-[#8da0ba]"}`}>
                                    {selectedRole ? selectedRole.replace("_", " ") : "Select a role"}
                                </span>
                                <FiChevronDown className={`h-4 w-4 shrink-0 text-[#74839f] transition-transform ${showRoleDropdown ? "rotate-180" : ""}`} />
                            </button>

                            {showRoleDropdown && (
                                <div className={dropdownMenuClass}>
                                    {fakeRoles.map((role) => {
                                        const isActive = selectedRole === role;

                                        return (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => handleRoleChange(role)}
                                                className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm font-bold transition ${isActive
                                                    ? "bg-[#eef4ff] text-[#245fd1]"
                                                    : "text-[#526174] hover:bg-[#f8fafc] hover:text-[#172033]"
                                                }`}
                                            >
                                                <span className="truncate">{role.replace("_", " ")}</span>
                                                {isActive && <FiCheck className="h-4 w-4 shrink-0" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Send Message */}
                <div>
                    <label className="text-sm font-medium mb-1 flex items-center gap-2">
                        Send Message
                    </label>
                    <textarea
                        className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] border-gray-300 shadow-sm resize-none"
                        placeholder="Type message here"
                        rows="5"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                    />
                </div>



                {/* ...................*Display User Lisr*................... */}
                {
                    userListIsLoading ? (
                        <div>Loading users...</div>
                    ) : userListError ? (
                        <div>Error loading users</div>
                    ) : (
                        <div className="mt-6">
                            <label className="text-sm font-medium mb-2 flex items-center gap-2">
                                User List
                            </label>
                            <div className="border-t pt-2 border-gray-400 max-h-60 overflow-y-auto">
                                {userList.length === 0 ? (
                                    <div className="text-gray-500 text-sm py-4">No users found</div>
                                ) : (
                                    userList?.results.map(user => (
                                        <div
                                            key={user.id}
                                            className={`flex items-center justify-between gap-3 py-2 hover:bg-gray-50 rounded-lg px-2 ${createPrivateChats.isPending ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                                            onClick={() => {
                                                if (!createPrivateChats.isPending) {
                                                    handleUserClick(user.id);
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <img src={`${base_URL}${user.image}`} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                                                <span className="font-medium text-sm">{user.name}</span>
                                            </div>

                                            <div className='space-x-4 flex items-center justify-center'>

                                                <div className='flex justify-center items-center gap-2 '>
                                                    <span className="bg-pink-100 text-pink-600 rounded-full px-3 py-1 text-xs font-semibold  ">{user.role}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )
                }

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 mt-8">
                    <button type="button" className="border border-red-400 text-red-500 px-6 py-2 rounded-lg font-semibold bg-white hover:bg-red-50" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </form>
        </div >
    );
};

export default CreateNewMessageModal;
