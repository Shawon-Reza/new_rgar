import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { queryClient } from '../../../main';
import { toast } from 'react-toastify';
import axiosApi from '../../../service/axiosInstance';
import EditGroupModal from './EditGroupModal';
import AddMemberModal from './AddMemberModal';
import BlockMemberModal from './BlockMemberModal';
import useGetUserProfile from '../../../hooks/useGetUserProfile';

const ActionsDropdown = ({ showActions, onEditDetails, onAddMember, onBlockMember, onDeleteChat, chatInfo }) => {
  if (!showActions) return null;

  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showBlockMemberModal, setShowBlockMemberModal] = useState(false);

  const { userProfileData } = useGetUserProfile();

  console.log("CHat Info >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>:", chatInfo)
  const myUserId = userProfileData?.id;



  const roomId = chatInfo?.id;
  const clinic_id = chatInfo?.clinic_id;
  const room_type = chatInfo?.type;


  console.log("Room Id from dropdown :", roomId)
  console.log("Room room_type from dropdown :", room_type)
  console.log("Room room_type from chatInfo======================== :", chatInfo)


  const isPrivate = chatInfo?.type === 'private';



  // ......................................*Fetch Clinic Members*.......................................... //
  const { data: clinicMembers, isLoading: isLoadingMembers, error: membersError } = useQuery({
    queryKey: ['clinicMembers_for_addMembers', clinic_id],
    queryFn: async () => {
      const res = await axiosApi.get(`/api/v1/chat/clinic/members/?clinic_id=${clinic_id}`);
      console.log("Clinic Members Data:", res.data);
      return res.data;
    },
    enabled: !!clinic_id, // Only fetch if clinic_id exists
    keepPreviousData: true,
  });
  console.log("Clinic Members:", clinicMembers?.results);

  // ........................................Fetch Chat Room Members*.......................................... //
  const { data: roomMembers, isLoading: isLoadingRoomMembers, error: roomMembersError } = useQuery({
    queryKey: ['roomMembers', roomId],
    queryFn: async () => {
      const res = await axiosApi.get(`/api/v1/rooms/${roomId}/members/`);
      console.log("Room Members Data:", res.data);
      return res.data;
    },
    enabled: !!roomId, // Only fetch if roomId exists
    keepPreviousData: true,
  });
  console.log("Room Members:================================================================", roomMembers?.results);
  // ...........................................Get Private Chat Another Member ID................................... //
  const privetChatAnotherMemberId = isPrivate
    ? roomMembers?.results?.find(member => member.id !== myUserId)?.id
    : null;
  console.log("Room privetChatAnotherMemberId:================================================================", privetChatAnotherMemberId);

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //..............................................Block/Unblock Chat Mutation..............................................//
  //  queryKey: ["myRooms", searchQuery, selectedRole, path, userId],
  // queryKey: ["messages", chatRoom],
  const blockChatMutation = useMutation({
    mutationFn: async (action) => {
      const payload = {
        user_id: privetChatAnotherMemberId, // or however the other user ID is stored in chatInfo
        action: action, // "block" or "unblock"
      };

      console.log("Block/Unblock chat with payload:+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++", payload);
      const res = await axiosApi.post(`/api/v1/block/`, payload);

      return res.data;
    },
    onSuccess: (data) => {
      const action = data.action || "Block/Unblock";
      console.log('Chat action successful:', data);
      toast.success(`Chat ${action}ed successfully`);
      // Refresh the chat list
      queryClient.invalidateQueries({ queryKey: ['myRooms'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (error) => {
      console.error('Error blocking/unblocking chat:', error);
      const msg = error?.response?.data?.error?.message || error?.message || 'Failed to update chat';
      toast.error(msg);
    },
  });

  //..............................................Delete Chat Mutation..............................................//
  const deleteChatMutation = useMutation({
    mutationFn: async () => {
      const res = await axiosApi.post(`/api/v1/rooms/${roomId}/delete/`);

      return res.data;
    },
    onSuccess: () => {
      console.log('Chat deleted successfully');
      toast.success('Chat deleted successfully');
      // Refresh the chat list
      queryClient.invalidateQueries({ queryKey: ['myRooms'] });
      // Call the parent's onDeleteChat to close dropdown/handle UI
      if (onDeleteChat) onDeleteChat();
    },
    onError: (error) => {
      console.error('Error deleting chat:', error);
      const msg = error?.response?.data?.message || error?.message || 'Failed to delete chat';
      toast.error(msg);
    },
  });

  // ........................................ Action Dropdown UI ........................................ //
  return (
    <>
      <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg p-4 w-56 z-50 border border-gray-200 ">
        <h3 className="text-center font-bold text-gray-800 mb-3">Actions</h3>
        <div className="space-y-2">
          {!isPrivate && (
            <button
              onClick={() => setShowEditModal(true)}
              className="w-full border-2 border-teal-500 text-teal-600 px-4 py-2 rounded-lg font-semibold hover:bg-teal-50 transition"
            >
              Edit Details
            </button>
          )}
          {!isPrivate && (
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="w-full bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition"
            >
              Add Member
            </button>
          )}

          {/* ..............................................Block/Unblock Chat.....................................................*/}
          {isPrivate && (
            <button
              onClick={() => blockChatMutation.mutate(chatInfo?.chat_blocked ? 'unblock' : 'block')}
              disabled={blockChatMutation.isPending}
              className="w-full bg-yellow-400 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {blockChatMutation.isPending ? 'Processing...' : (chatInfo?.chat_blocked ? 'Unblock Chat' : 'Block Chat')}
            </button>
          )}


          {!isPrivate && (
            <button
              onClick={() => setShowBlockMemberModal(true)}
              className="w-full bg-yellow-400 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition"
            >
              Block Member
            </button>
          )}


          <button
            onClick={() => deleteChatMutation.mutate()}
            disabled={deleteChatMutation.isPending}
            className="w-full bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleteChatMutation.isPending ? 'Deleting...' : 'Delete Chat'}
          </button>
        </div>
      </div>

      {/* Edit Group Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-xl relative">
            <EditGroupModal onClose={() => setShowEditModal(false)} roomId={roomId} />
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl relative mx-5 sm:mx-10">
            <AddMemberModal
              onClose={() => setShowAddMemberModal(false)}
              roomId={roomId}
              userList={clinicMembers}
            />
          </div>
        </div>
      )}

      {/* Block Member Modal */}
      {showBlockMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl relative mx-5 sm:mx-10">
            <BlockMemberModal
              onClose={() => setShowBlockMemberModal(false)}
              roomId={roomId}
              roomMembers={roomMembers}
              room_type={room_type}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ActionsDropdown;
