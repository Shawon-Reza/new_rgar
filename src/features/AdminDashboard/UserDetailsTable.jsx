"use client"
import { useState, useRef, useEffect } from "react"
import { FiUser, FiMoreVertical } from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify"
import axiosApi from "../../service/axiosInstance"

export default function UserDetailsTable({ users = [], onEditUser, onChangePassword, isLoading = false, error = null }) {
  const navigate = useNavigate();
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);
  const queryClient = useQueryClient();
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  console.log("User:", users)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleViewDetails = (userId) => {
    console.log("[v0] View details clicked for user ID:", userId)
    navigate(`/admin/user-management/user/${userId}`);
  }

  const handleAction = (userId, action, e) => {
    e.stopPropagation();
    console.log("[v0] Action menu clicked for user ID:", userId, "Action:", action)
    setOpenMenuId(openMenuId === userId ? null : userId);
  }
  //...............Handle Change Password..............\\
  const handleChangePassword = (userId, e) => {
    e.stopPropagation();
    console.log("[v0] Change password for user ID:", userId);
    setOpenMenuId(null);
    const user = users.find(u => u.id === userId);
    const userName = user?.full_name || user?.email || '';
    onChangePassword && onChangePassword(userId, userName);
  }
  //..............Handle Delete/Archive User..............\\
  const handleDeleteArchive = (userId, e) => {
    e.stopPropagation();
    console.log("[v0] Delete/Archive user ID:", userId);
    setOpenMenuId(null);
    // Add your delete/archive logic here
  }
  //..............Handle Update User..............\\
  const handleUpdateUser = (userId, e) => {
    e.stopPropagation();
    console.log("[v0] Update user ID:", userId);
    setOpenMenuId(null);
    onEditUser && onEditUser(userId);
  }

  const statusMutation = useMutation({
    mutationFn: async ({ userId, nextStatus }) => {
      const payload = { is_active: !!nextStatus };
      console.log(payload)
      const response = await axiosApi.patch(`/api/v1/users/status/${userId}/`, payload);
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success(`User ${variables.nextStatus ? "activated" : "deactivated"} successfully`);
      queryClient.invalidateQueries({ queryKey: ["userList"] });
    },
    onError: (error) => {
      const message = error?.response?.data?.message || "Failed to update status";
      toast.error(message);
    },
    onSettled: () => {
      setStatusUpdatingId(null);
    }
  });

  const handleToggleStatus = (userId, currentStatus, e) => {
    e.stopPropagation();
    setStatusUpdatingId(userId);
    statusMutation.mutate({ userId, nextStatus: !currentStatus });
  };

  if (isLoading) {
    return (
      <div className="border border-gray-300 rounded-lg p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Users Details</h2>
        <div className="px-4 py-8 text-center text-gray-500">Loading users...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border border-gray-300 rounded-lg p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Users Details</h2>
        <div className="px-4 py-8 text-center text-red-500">Error loading users</div>
      </div>
    )
  }

  return (
    <div className="border border-gray-300 rounded-lg px-4 py-2 min-h-[500px] overflow-x-auto ">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Users Details</h2>

      {/* Table Container */}
      <div className="max-h-[calc(100vh-450px)] ">
        <table className="w-full">
          <thead className="sticky -top-1.5 z-10 ">
            <tr className="border-b border-gray-300 bg-gray-100">
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">ID NO</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">User Name</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">User email</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Role</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Sub Role</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Clinic</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Account Status</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user, index) => (
                <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"

                >
                  <td className="px-4 py-3 text-sm text-gray-900">{user.employee_id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="flex items-center gap-2"
                      onClick={() => handleViewDetails(user.id)}
                    >
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                        <FiUser size={16} className="text-primary" />
                      </div>
                      {user.full_name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                  
                  <td className="px-4 py-3 text-sm flex items-center justify-center"> 
                    <span className={`px-4 py-2  rounded-full text-xs font-semibold ${user.roleColor}`}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{user.subroles.join(", ")}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {
                      user.clinics.join(", ")
                    }
                  </td>


                  <td className="px-4 py-3 text-sm">
                    <div className="relative group">
                      <button
                        onDoubleClick={(e) => handleToggleStatus(user.id, user.is_active, e)}
                        disabled={statusMutation.isPending && statusUpdatingId === user.id}
                        className={`px-3 py-2 w-full h-full flex items-center justify-center text-xs font-semibold rounded-md transition-colors ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          } ${statusMutation.isPending && statusUpdatingId === user.id ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'}`}
                      >
                        {statusMutation.isPending && statusUpdatingId === user.id
                          ? 'Updating...'
                          : user.is_active ? 'Active' : 'Inactive'}
                      </button>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                        Double click for Active/Inactive
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm relative">
                    <button
                      onClick={(e) => handleAction(user.id, "menu", e)}
                      className="p-2 h-full w-full hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <FiMoreVertical size={18} className="text-gray-600 z-0" />
                    </button>

                    {/*.............**Action Menu Popup**.................. */}
                    {openMenuId === user.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 top-12 z-20 bg-white border border-gray-300 rounded-lg shadow-lg w-48 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-4 py-3 border-b border-gray-200">
                          <h3 className="text-sm font-semibold text-gray-700">Actions</h3>
                        </div>
                        <div className="p-2 space-y-2">
                          <button
                            onClick={(e) => handleUpdateUser(user.id, e)}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                          >
                            Update User
                          </button>

                          <button onClick={(e) => handleChangePassword(user.id, e)}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors"
                          >
                            Change Password
                          </button>

                          {/* <button
                            onClick={(e) => handleDeleteArchive(user.id, e)}
                            className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Delete / Archived
                          </button> */}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
