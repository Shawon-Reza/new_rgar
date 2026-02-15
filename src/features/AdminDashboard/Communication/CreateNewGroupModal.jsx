import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useState, useMemo } from 'react';
import axiosApi from '../../../service/axiosInstance';
import { base_URL } from '../../../config/Config';
import toast from 'daisyui/components/toast';
import { queryClient } from '../../../main';

const roles = ['doctor', 'manager', 'staff', 'jr_staff', 'president'];

const CreateNewGroupModal = ({ onClose }) => {
    const [groupName, setGroupName] = useState('');
    const [selectedClinic, setSelectedClinic] = useState(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [selectAll, setSelectAll] = useState(false);


    // .......................*Fetch Clinics & Users List*......................... //
    const { data: userList, isLoading: userListIsLoading, error: userListError } = useQuery({
        queryKey: ['clinics&userlist', selectedRole],
        queryFn: async () => {
            const res = await axiosApi.get('/api/v1/chat/clinic/members/', {
                params: {
                    role: selectedRole || undefined,
                },
            });
            return res.data;
        },
        keepPreviousData: true,
    });
    console.log("User list data:", userList)


    
    // ........................**Post Request For Create Group**.................. //
    const createGroupByClinic = useMutation({
        mutationFn: async ({ payload }) => {
            console.log("Creating group with payload:", payload);
            const res = await axiosApi.post('/api/v1/rooms/group/create/', payload);
            console.log("Creating group with payload:**********************");

            return res.data; // Always return data
        },
        onSuccess: (data) => {
            console.log("Group created successfully:", data);
            // Important: Refresh the chat list so the new group appears immediately
            // Assuming 'myRooms' is the query key for chat rooms
            queryClient.invalidateQueries({ queryKey: ['myRooms'] });
        },
        onError: (error) => {
            console.error("Error creating group:", error);
        },
    });

    // Filter members by selected clinic and remove already selected
    const filteredMembers = useMemo(() => {
        let members = userList?.results || [];

        // Filter by selected clinic if any
        if (selectedClinic) {
            members = members.filter(m =>
                m.clinics.some(mc => mc.id === selectedClinic.id)
            );
        }

        // Remove already selected members
        return members.filter(m => !selectedMembers.some(sm => sm.id === m.id));
    }, [selectedClinic, selectedMembers, userList?.results]);

    const handleClinicChange = (clinicId) => {
        const clinic = userList?.my_clinics?.find(c => c.id === parseInt(clinicId));
        setSelectedClinic(clinic || null);
        setSelectedMembers([]); // Clear members when clinic changes
        setSelectAll(false); // Reset select all
    };

    const handleRoleChange = (e) => {
        setSelectedRole(e.target.value);
    };

    const handleAddMember = (member) => {
        setSelectedMembers([...selectedMembers, member]);
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectAll(false);
            setSelectedMembers([]);
        } else {
            setSelectAll(true);
            setSelectedMembers([]);
        }
    };

    const handleRemoveMember = (id) => {
        setSelectedMembers(selectedMembers.filter(m => m.id !== id));
    };

    const handleCreateGroup = () => {
        if (!selectedClinic) {
            alert('Please select a clinic');
            return;
        }

        if (!groupName.trim()) {
            alert('Please enter a group name');
            return;
        }

        if (!selectAll && selectedMembers.length === 0) {
            alert('Please select members or check Select All');
            return;
        }

        const payload = selectAll
            ? {
                clinic_id: selectedClinic.id,
                name: groupName,
                group_kind: 'clinic_all',
            }
            : {
                clinic_id: selectedClinic.id,
                name: groupName,
                group_kind: 'clinic_custom',
                user_ids: selectedMembers.map(m => m.id),
            };
        // ...................**Call Mutation Function**................... //
        createGroupByClinic.mutate({ payload });

        onClose();
    };

    return (
        <div className="">
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-gray-300 pb-2">Create New Group</h2>
            <form className="space-y-4">
                {/* Group Name */}
                <div>
                    <label className="text-sm font-medium mb-1 flex items-center gap-2">
                        Group Name
                    </label>
                    <input
                        type="text"
                        className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] border-gray-300 shadow-sm"
                        placeholder="Enter Group Name"
                        value={groupName}
                        onChange={e => setGroupName(e.target.value)}
                    />
                </div>
                {/* Clinic (single select) */}
                <div>
                    <label className="text-sm font-medium mb-1 flex items-center gap-2">
                        Clinic
                    </label>
                    <select
                        className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] border-gray-300 shadow-sm"
                        value={selectedClinic?.id || ""}
                        onChange={(e) => handleClinicChange(e.target.value)}
                    >
                        <option value="">Select a clinic</option>
                        {userList?.my_clinics?.map(clinic => (
                            <option key={clinic.id} value={clinic.id}>
                                {clinic.name}
                            </option>
                        ))}
                    </select>
                </div>
                {/* Role & Add Members */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="text-sm font-medium mb-1 flex items-center gap-2">
                            Role
                        </label>
                        <select
                            className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]  border-gray-300 shadow-sm"
                            value={selectedRole}
                            onChange={handleRoleChange}
                        >
                            <option value="">Select a role</option>
                            {roles.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="text-sm font-medium mb-1 flex items-center gap-2">
                            Add Members
                        </label>
                        <select
                            className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] border-gray-300 shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                            value=""
                            onChange={(e) => {
                                const member = filteredMembers.find(m => m.id === parseInt(e.target.value));
                                if (member) handleAddMember(member);
                            }}
                            disabled={!selectedClinic}
                        >
                            <option value="">{selectedClinic ? 'Select a member' : 'Select a clinic first'}</option>
                            {filteredMembers.map(member => (
                                <option key={member.id} value={member.id}>
                                    {member.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Select All Checkbox */}
                {selectedClinic && (
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="selectAll"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            className="w-4 h-4 rounded border-2 border-teal-500 text-teal-600 focus:ring-2 focus:ring-teal-500 cursor-pointer"
                        />
                        <label htmlFor="selectAll" className="text-sm font-medium cursor-pointer">
                            Select All Members
                        </label>
                    </div>
                )}

                {/* Selected Members List */}
                <div className="mt-6">
                    <label className="text-sm font-medium mb-2 flex items-center gap-2">
                        {selectAll ? 'Select All Members Enabled' : 'Selected Members List'}
                    </label>
                    <div className=" border-t pt-2 border-gray-400">
                        {selectAll ? (
                            <div className="text-teal-600 text-sm py-4 font-medium">All members will be added to this group</div>
                        ) : selectedMembers.length === 0 ? (
                            <div className="text-gray-500 text-sm py-4">No members added yet.</div>
                        ) : (
                            selectedMembers.map(member => (
                                <div key={member.id} className="flex items-center justify-between gap-3 py-2">
                                    <div className="flex items-center gap-2">
                                        {member.image ? (
                                            <img src={`${base_URL}${member.image}`} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold">
                                                {member.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span className="font-medium text-sm">{member.name}</span>
                                    </div>

                                    <span className="bg-pink-100 text-pink-600 rounded-full px-3 py-1 text-xs font-semibold">{member.role}</span>

                                    <button type="button" className="ml-auto text-red-500 hover:text-red-700 text-xl" onClick={() => handleRemoveMember(member.id)}>
                                        &#10005;
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                {/* Action Buttons */}
                <div className="flex justify-end gap-4 mt-8">
                    <button type="button" className="border border-red-400 text-red-500 px-6 py-2 rounded-lg font-semibold bg-white hover:bg-red-50" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        onClick={handleCreateGroup}
                        disabled={!selectedClinic || !groupName.trim() || (!selectAll && selectedMembers.length === 0)}
                    >
                        Create Group
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateNewGroupModal;