import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import axiosApi from '../../../service/axiosInstance';
import { base_URL } from '../../../config/Config';
import { toast } from 'react-toastify';
import { queryClient } from '../../../main';

const EditGroupModal = ({ onClose, roomId }) => {
    console.log("Edit Group Modal opened with Room ID:", roomId);

    const [groupName, setGroupName] = useState('');
    const [groupImage, setGroupImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    // Handle image selection
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setGroupImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    //......................................................Update Group info Mutation......................................................//
    const updateGroupMutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            if (groupName.trim()) {
                formData.append('name', groupName);
            }
            if (groupImage) {
                formData.append('image', groupImage);
            }

            const res = await axiosApi.patch(`/api/v1/chat-rooms/${roomId}/update/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return res.data;
        },
        onSuccess: (data) => {
            console.log('Group updated successfully:', data);
            toast.success('Group details updated successfully');
            // Refresh the chat list
            queryClient.invalidateQueries({ queryKey: ['myRooms'] });
            onClose();
        },
        onError: (error) => {
            console.error('Error updating group:', error);
            const msg = error?.response?.data?.message || error?.message || 'Failed to update group';
            toast.error(msg);
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!groupName.trim() && !groupImage) {
            toast.warning('Please update group name or image');
            return;
        }
        updateGroupMutation.mutate();
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-gray-300 pb-2">Edit Group Details</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Group Image */}
                <div>
                    <label className="text-sm font-medium mb-2 flex items-center gap-2">
                        Group Image
                    </label>
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-lg border-2 border-gray-300 overflow-hidden flex items-center justify-center bg-gray-50">
                            {previewImage ? (
                                <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-gray-400 text-sm">No image</span>
                            )}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] border-gray-300 shadow-sm"
                        />
                    </div>
                </div>

                {/* Group Name */}
                <div>
                    <label className="text-sm font-medium mb-1 flex items-center gap-2">
                        Group Name
                    </label>
                    <input
                        type="text"
                        className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] border-gray-300 shadow-sm"
                        placeholder="Enter group name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                    />
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
                        type="submit"
                        disabled={updateGroupMutation.isPending}
                        className="bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {updateGroupMutation.isPending ? 'Updating...' : 'Update'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditGroupModal;
