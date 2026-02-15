import { useMutation } from '@tanstack/react-query';
import React, { useState, useEffect } from 'react';
import axiosApi from '../../../service/axiosInstance';
import { base_URL } from '../../../config/Config';
import { toast } from 'react-toastify';
import { queryClient } from '../../../main';

const AddMemberModal = ({ onClose, roomId, userList }) => {
    console.log("Add Member Modal opened with Room ID:", roomId);

    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter users based on search query
    const filteredUsers = userList?.results?.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    // Handle user selection
    const handleUserToggle = (userId) => {
        console.log("User toggled:", userId);
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    // Log selected users and room ID
    useEffect(() => {
        console.log("Selected Users:", selectedUsers);
        console.log("Room ID:", roomId);
    }, [selectedUsers, roomId]);

    // Mutation for adding members to group
    const addMemberMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                user_ids: selectedUsers,
            };

            console.log("Adding members with payload:", payload);

            const res = await axiosApi.post(`/api/v1/rooms/${roomId}/members/add/`, payload);
            return res.data;
        },
        onSuccess: (data) => {
            console.log('Members added successfully:', data);
            toast.success('Members added successfully');
            // Refresh the chat list
            queryClient.invalidateQueries({ queryKey: ['myRooms'] });
            onClose();
        },
        onError: (error) => {
            console.error('Error adding members:', error);
            const msg = error?.response?.data?.message || error?.message || 'Failed to add members';
            toast.error(error?.response?.data?.error?.message || msg);
        },
    });

    const handleAddMembers = () => {
        if (selectedUsers.length === 0) {
            toast.warning('Please select at least one user');
            return;
        }
        console.log("Final Selected Users:", selectedUsers);
        console.log("Final Room ID:", roomId);
        addMemberMutation.mutate();
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-gray-300 pb-2">Add Members</h2>
            <form className="space-y-4">
                {/* Search */}
                <div>
                    <label className="text-sm font-medium mb-1 flex items-center gap-2">
                        Search User
                    </label>
                    <input
                        type="text"
                        className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] border-gray-300 shadow-sm"
                        placeholder="Search by name or email"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* User List */}
                <div>
                    <label className="text-sm font-medium mb-2 flex items-center gap-2">
                        Select Users ({selectedUsers.length} selected)
                    </label>
                    <div className="border rounded-lg p-3 max-h-96 overflow-y-auto space-y-2">
                        {filteredUsers.length === 0 ? (
                            <div className="text-gray-500 text-sm py-4 text-center">
                                {searchQuery ? 'No users found matching your search' : 'No users available'}
                            </div>
                        ) : (
                            filteredUsers.map(user => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between gap-3 p-2 hover:bg-gray-50 rounded-lg border border-gray-200"
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {user.image ? (
                                            <img
                                                src={`${base_URL}${user.image}`}
                                                alt={user.name}
                                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm truncate">{user.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="bg-pink-100 text-pink-600 rounded-full px-2 py-1 text-xs font-semibold">
                                            {user.role}
                                        </span>
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

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 mt-8">
                    <button
                        type="button"
                        className="border border-red-400 text-red-500 px-6 py-2 rounded-lg font-semibold bg-white hover:bg-red-50"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleAddMembers}
                        disabled={addMemberMutation.isPending}
                        className="bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {addMemberMutation.isPending ? 'Adding...' : 'Add Members'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddMemberModal;
