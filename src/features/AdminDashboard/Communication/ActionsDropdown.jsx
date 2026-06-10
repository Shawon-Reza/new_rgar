import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FiEdit3, FiSlash, FiTrash2, FiUserPlus } from 'react-icons/fi';

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
  const myUserId = userProfileData?.id;



  const roomId = chatInfo?.id;
  const clinic_id = chatInfo?.clinic_id;
  const room_type = chatInfo?.type;


  const isPrivate = chatInfo?.type === 'private';



  // ......................................*Fetch Clinic Members*.......................................... //
  const { data: clinicMembers, isLoading: isLoadingMembers, error: membersError } = useQuery({
    queryKey: ['clinicMembers_for_addMembers', clinic_id],
    queryFn: async () => {
      const res = await axiosApi.get(`/api/v1/chat/clinic/members/?clinic_id=${clinic_id}`);
      return res.data;
    },
    enabled: !!clinic_id, // Only fetch if clinic_id exists
    keepPreviousData: true,
  });

  // ........................................Fetch Chat Room Members*.......................................... //
  const { data: roomMembers, isLoading: isLoadingRoomMembers, error: roomMembersError } = useQuery({
    queryKey: ['roomMembers', roomId],
    queryFn: async () => {
      const res = await axiosApi.get(`/api/v1/rooms/${roomId}/members/`);
      return res.data;
    },
    enabled: !!roomId, // Only fetch if roomId exists
    keepPreviousData: true,
  });
  // ...........................................Get Private Chat Another Member ID................................... //
  const privetChatAnotherMemberId = isPrivate
    ? roomMembers?.results?.find(member => member.id !== myUserId)?.id
    : null;

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
      const res = await axiosApi.post(`/api/v1/block/`, payload);

      return res.data;
    },
    onSuccess: (data) => {
      const action = data.action || "Block/Unblock";
      toast.success(`Chat ${action}ed successfully`);
      // Refresh the chat list
      queryClient.invalidateQueries({ queryKey: ['myRooms'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (error) => {
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
      toast.success('Chat deleted successfully');
      // Refresh the chat list
      queryClient.invalidateQueries({ queryKey: ['myRooms'] });
      // Call the parent's onDeleteChat to close dropdown/handle UI
      if (onDeleteChat) onDeleteChat();
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error?.message || 'Failed to delete chat';
      toast.error(msg);
    },
  });

  // ........................................ Action Dropdown UI ........................................ //
  return (
    <>
      <div className="absolute right-0 top-11 z-50 w-64 rounded-2xl border border-[#dfe7f2] bg-white p-2 shadow-[0_18px_44px_rgba(15,23,42,0.16)]">
        <div className="absolute -top-1.5 right-5 h-3 w-3 rotate-45 border-l border-t border-[#dfe7f2] bg-white" />
        <div className="relative px-3 pb-2 pt-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#8da0ba]">Conversation</p>
          <h3 className="mt-0.5 text-sm font-extrabold text-[#172033]">Actions</h3>
        </div>
        <div className="relative space-y-1">
          {!isPrivate && (
            <button
              onClick={() => setShowEditModal(true)}
              className="group flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-extrabold text-[#172033] transition hover:bg-[#f6f8fb] focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-[#2f6ff3] transition group-hover:bg-[#2f6ff3] group-hover:text-white">
                <FiEdit3 size={15} />
              </span>
              <span>Edit Details</span>
            </button>
          )}
          {!isPrivate && (
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="group flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-extrabold text-[#172033] transition hover:bg-[#f6f8fb] focus:outline-none focus:ring-4 focus:ring-emerald-100"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-500 group-hover:text-white">
                <FiUserPlus size={15} />
              </span>
              <span>Add Member</span>
            </button>
          )}

          {/* ..............................................Block/Unblock Chat.....................................................*/}
          {isPrivate && (
            <button
              onClick={() => blockChatMutation.mutate(chatInfo?.chat_blocked ? 'unblock' : 'block')}
              disabled={blockChatMutation.isPending}
              className="group flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-extrabold text-[#172033] transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-amber-100"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-600 transition group-hover:bg-amber-500 group-hover:text-white">
                <FiSlash size={15} />
              </span>
              <span>{blockChatMutation.isPending ? 'Processing...' : (chatInfo?.chat_blocked ? 'Unblock Chat' : 'Block Chat')}</span>
            </button>
          )}


          {!isPrivate && (
            <button
              onClick={() => setShowBlockMemberModal(true)}
              className="group flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-extrabold text-[#172033] transition hover:bg-amber-50 focus:outline-none focus:ring-4 focus:ring-amber-100"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-600 transition group-hover:bg-amber-500 group-hover:text-white">
                <FiSlash size={15} />
              </span>
              <span>Block Member</span>
            </button>
          )}


          <button
            onClick={() => deleteChatMutation.mutate()}
            disabled={deleteChatMutation.isPending}
            className="group flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-extrabold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-red-100"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-50 text-red-600 transition group-hover:bg-red-500 group-hover:text-white">
              <FiTrash2 size={15} />
            </span>
            <span>{deleteChatMutation.isPending ? 'Deleting...' : 'Delete Chat'}</span>
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
