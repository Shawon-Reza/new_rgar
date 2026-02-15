import { useMutation } from '@tanstack/react-query';
import React, { useState, useEffect } from 'react';
import axiosApi from '../../../service/axiosInstance';
import { base_URL } from '../../../config/Config';
import { toast } from 'react-toastify';
import { queryClient } from '../../../main';

const BlockMemberModal = ({ onClose, roomId, roomMembers, room_type }) => {
  console.log("Block Member Modal opened with Room ID:", roomId);
  console.log("Block Member Modal opened with Room Type:", room_type);

  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter members based on search query and exclude owner
  const filteredMembers = roomMembers?.results?.filter(member =>
    !member.is_owner && // Don't show owner in the list
    (member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  // Handle member selection
  const handleMemberToggle = (memberId) => {
    console.log("Member toggled:", memberId);
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  // Log selected members and room ID
  useEffect(() => {
    console.log("Selected Members to Block:", selectedMembers);
    console.log("Room ID:", roomId);
  }, [selectedMembers, roomId]);

  // Mutation for toggling block/unblock on double-click
  const toggleBlockMutation = useMutation({
    mutationFn: async (userId) => {
      console.log("Toggling block for user:", userId);
      const payload = { user_id: userId };
      const response = await axiosApi.post(`/api/v1/rooms/${roomId}/toggle-block/`, payload);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Member block status toggled successfully:', data);
      toast.success('Member block status updated');
      // Refresh the room members list
      queryClient.invalidateQueries({ queryKey: ['roomMembers'] });
      queryClient.invalidateQueries({ queryKey: ['myRooms'] });
    },
    onError: (error) => {
      console.error('Error toggling block status:', error);
      const msg = error?.response?.data?.message || error?.message || 'Failed to toggle block status';
      toast.error(msg);
    },
  });

  // Mutation for blocking members
  const blockMemberMutation = useMutation({
    mutationFn: async () => {
      console.log("Blocking members:", selectedMembers);

      // Block each member individually
      const promises = selectedMembers.map(userId => {
        const payload = {
          user_id: userId,
          action: "block"
        };
        console.log("Blocking user with payload:", payload);
        return axiosApi.post(`/api/v1/rooms/${roomId}/member/block/`, payload);
      });

      const results = await Promise.all(promises);
      return results.map(res => res.data);
    },
    onSuccess: (data) => {
      console.log('Members blocked successfully:', data);
      toast.success('Members blocked successfully');
      // Refresh the room members list
      queryClient.invalidateQueries({ queryKey: ['roomMembers'] });
      queryClient.invalidateQueries({ queryKey: ['myRooms'] });
      onClose();
    },
    onError: (error) => {
      console.error('Error blocking members:', error);
      const msg = error?.response?.data?.message || error?.message || 'Failed to block members';
      toast.error(msg);
    },
  });

  // Handle double-click to toggle block/unblock
  const handleToggleBlock = (userId) => {
    console.log("Double-click - Toggling block for user:", userId);
    toggleBlockMutation.mutate(userId);
  };

  const handleBlockMembers = () => {
    if (selectedMembers.length === 0) {
      toast.warning('Please select at least one member to block');
      return;
    }
    console.log("Final Selected Members to Block:", selectedMembers);
    console.log("Final Room ID:", roomId);
    blockMemberMutation.mutate();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 border-b-2 border-gray-300 pb-2">Block Members</h2>
      <form className="space-y-4">
        {/* Search */}
        <div>
          <label className="text-sm font-medium mb-1 flex items-center gap-2">
            Search Member
          </label>
          <input
            type="text"
            className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] border-gray-300 shadow-sm"
            placeholder="Search by name or email"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Member List */}
        <div>
          <label className="text-sm font-medium mb-2 flex items-center gap-2">
            Select Members to Block ({selectedMembers.length} selected)
          </label>
          <div className="border rounded-lg p-3 max-h-96 overflow-y-auto space-y-2">
            {filteredMembers.length === 0 ? (
              <div className="text-gray-500 text-sm py-4 text-center">
                {searchQuery ? 'No members found matching your search' : 'No members available'}
              </div>
            ) : (
              filteredMembers.map(member => (
                <div
                  key={member.id}
                  className={`flex items-center justify-between gap-3 p-2 hover:bg-gray-50 rounded-lg border cursor-pointer ${member.is_blocked ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                  onDoubleClick={() => handleToggleBlock(member.id)}
                  title="Double-click to toggle block/unblock"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{member.name}</p>
                      <p className="text-xs text-gray-500 truncate">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {member.is_blocked ? (
                      <span className="bg-red-100 text-red-600 rounded-full px-2 py-1 text-xs font-semibold">
                        Blocked
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-600 rounded-full px-2 py-1 text-xs font-semibold">
                        Active
                      </span>
                    )}
                    <span className="bg-pink-100 text-pink-600 rounded-full px-2 py-1 text-xs font-semibold">
                      {member.role}
                    </span>
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-2 border-yellow-500 text-yellow-600 focus:ring-2 focus:ring-yellow-500 cursor-pointer"
                      checked={selectedMembers.includes(member.id)}
                      onChange={() => handleMemberToggle(member.id)}
                      disabled={member.is_blocked}
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
            onClick={handleBlockMembers}
            disabled={blockMemberMutation.isPending}
            className="bg-yellow-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {blockMemberMutation.isPending ? 'Blocking...' : 'Block Members'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BlockMemberModal;
