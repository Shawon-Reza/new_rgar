import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useState, useMemo, useEffect } from 'react';
import axiosApi from '../../../service/axiosInstance';
import { base_URL } from '../../../config/Config';
import { queryClient } from '../../../main';
import { toast } from 'react-toastify';

const fakeRoles = ['doctor', 'manager', 'staff', 'jr_staff'];

const CreateNewMessageModal = ({ onClose }) => {
    const [userSearch, setUserSearch] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [message, setMessage] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);

    // .................**Console Search and Role**.................. //
    useEffect(() => {
        console.log("User search : ", userSearch, " ", "role: ", selectedRole, " ", "selected users: ", selectedUsers, " message: ", message);
    }, [userSearch, selectedRole, selectedUsers, message]);


    // .......................*Fetch Clinics & Users List*......................... //
    const { data: userList, isLoading: userListIsLoading, error: userListError } = useQuery({
        queryKey: ['clinics&userlist', userSearch, selectedRole],
        queryFn: async () => {
            // Simulate API call with filtering
            const res = await axiosApi.get(`/api/v1/chat/clinic/members/?search=${userSearch}&role=${selectedRole}`);
            return res.data;
        },
    });
    console.log("=======================",userList)

    // ..............*Mutation query function for create Private Chat*.............. //
    // Fixed typo + better name
    const createPrivateChats = useMutation({
        mutationFn: async ({ payload }) => {
            console.log("Creating private chat with payload:", payload);

            const res = await axiosApi.post('/api/v1/rooms/directmesseges/', payload);
            return res.data; // Always return data
        },
        onSuccess: (data) => {
            console.log("Private chat created successfully:", data);

            // Important: Refresh the chat list so the new room appears immediately
            queryClient.invalidateQueries({ queryKey: ['myRooms'] });
            // Optional: Show success toast
        },
        onError: (error) => {
            console.error("Error creating private chat:", error);
            // Better toast message
            const msg = error?.response?.data?.message || error?.message || "Failed to start chat";
            toast.error(msg);
        },
    });

    const handleRoleChange = (e) => {
        setSelectedRole(e.target.value);
    };

    const handleUserToggle = (userId) => {
        console.log("just Select :", userId);
        // If clicking the already-selected user, allow deselect
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
            return;
        }

        // Prevent selecting more than one user
        if (selectedUsers.length >= 1) {
            toast.error("You already selected a user for chat");
            return;
        }

        // Select this user as the sole selection
        setSelectedUsers([userId]);
    };

    const handleSendMessage = () => {
        const payload = {
            user_ids: selectedUsers,
            content: message,
        };
        // ...................**Call Mutation Function**................... //
        createPrivateChats.mutate({ payload });

        // For now, just log the data
        console.log('Send Message:', {
            selectedUsers,
            selectedRole,
            message,
        });
        onClose();
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
                        <select
                            className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] border-gray-300 shadow-sm"
                            value={selectedRole}
                            onChange={handleRoleChange}
                        >
                            <option value="">Select a role</option>
                            {fakeRoles.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
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
                                        <div key={user.id} className="flex items-center justify-between gap-3 py-2 hover:bg-gray-50 rounded-lg px-2">
                                            <div className="flex items-center gap-2">
                                                <img src={`${base_URL}${user.image}`} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                                                <span className="font-medium text-sm">{user.name}</span>
                                            </div>

                                            <div className='space-x-4 flex items-center justify-center'>

                                                <div className='flex justify-center items-center gap-2 '>
                                                    <span className="bg-pink-100 text-pink-600 rounded-full px-3 py-1 text-xs font-semibold  ">{user.role}</span>
                                                </div>

                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded border-2 border-teal-500 text-teal-600 focus:ring-2 focus:ring-teal-500 cursor-pointer"
                                                    checked={selectedUsers.includes(user.id)}
                                                    onChange={() => handleUserToggle(user.id)}
                                                />
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
                    <button type="button" className="bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-teal-700" onClick={handleSendMessage}>
                        Send Message
                    </button>
                </div>
            </form>
        </div >
    );
};

export default CreateNewMessageModal;