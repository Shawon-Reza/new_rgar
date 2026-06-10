"use client"

import { useEffect, useRef, useState } from "react"
import { FiEdit3, FiKey, FiMoreVertical, FiShield, FiUser, FiUsers } from "react-icons/fi"
import { useNavigate } from "react-router-dom"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify"
import axiosApi from "../../service/axiosInstance"

const roleStyles = {
  owner: "bg-pink-50 text-pink-700 border-pink-100",
  admin: "bg-pink-50 text-pink-700 border-pink-100",
  president: "bg-blue-50 text-blue-700 border-blue-100",
  doctor: "bg-sky-50 text-sky-700 border-sky-100",
  manager: "bg-violet-50 text-violet-700 border-violet-100",
  staff: "bg-amber-50 text-amber-700 border-amber-100",
  jr_staff: "bg-orange-50 text-orange-700 border-orange-100",
}

const formatRole = (role) => String(role || "User").replace(/_/g, " ")

const formatList = (value) => {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "N/A"
  return value || "N/A"
}

const getInitials = (user) => {
  const name = user?.full_name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.email || "U"
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export default function UserDetailsTable({ users = [], onEditUser, onChangePassword, isLoading = false, error = null }) {
  const navigate = useNavigate()
  const [openMenuId, setOpenMenuId] = useState(null)
  const menuRef = useRef(null)
  const queryClient = useQueryClient()
  const [statusUpdatingId, setStatusUpdatingId] = useState(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleViewDetails = (userId) => {
    navigate(`/admin/user-management/user/${userId}`)
  }

  const handleAction = (userId, e) => {
    e.stopPropagation()
    setOpenMenuId(openMenuId === userId ? null : userId)
  }

  const handleChangePassword = (userId, e) => {
    e.stopPropagation()
    setOpenMenuId(null)
    const user = users.find(u => u.id === userId)
    const userName = user?.full_name || user?.email || ""
    onChangePassword && onChangePassword(userId, userName)
  }

  const handleUpdateUser = (userId, e) => {
    e.stopPropagation()
    setOpenMenuId(null)
    onEditUser && onEditUser(userId)
  }

  const statusMutation = useMutation({
    mutationFn: async ({ userId, nextStatus }) => {
      const response = await axiosApi.patch(`/api/v1/users/status/${userId}/`, {
        is_active: !!nextStatus,
      })
      return response.data
    },
    onSuccess: (_, variables) => {
      toast.success(`User ${variables.nextStatus ? "activated" : "deactivated"} successfully`)
      queryClient.invalidateQueries({ queryKey: ["userList"] })
    },
    onError: (error) => {
      const message = error?.response?.data?.message || "Failed to update status"
      toast.error(error?.response?.data?.detail || message)
    },
    onSettled: () => {
      setStatusUpdatingId(null)
    }
  })

  const handleToggleStatus = (userId, currentStatus, e) => {
    e.stopPropagation()
    setStatusUpdatingId(userId)
    statusMutation.mutate({ userId, nextStatus: !currentStatus })
  }

  if (isLoading) {
    return (
      <section className="overflow-hidden rounded-2xl border border-[#dfe5ee] bg-white shadow-[0_20px_55px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-3 border-b border-[#edf1f7] px-6 py-5">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#eef4ff] text-[#2B76F4]">
            <FiUsers className="h-5 w-5" />
          </span>
          <div>
            <div className="h-5 w-36 animate-pulse rounded bg-[#e8edf5]" />
            <div className="mt-2 h-4 w-48 animate-pulse rounded bg-[#f0f3f8]" />
          </div>
        </div>
        <div className="grid gap-3 p-6">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-16 animate-pulse rounded-xl bg-[#f3f6fb]" />
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-100 bg-white px-6 py-8 text-center shadow-[0_20px_55px_rgba(15,23,42,0.06)]">
        <h2 className="text-lg font-semibold text-[#111827]">Users could not be loaded</h2>
        <p className="mt-2 text-sm font-medium text-[#6b7890]">
          {error?.response?.data?.message || error?.message || "Please try again later."}
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-[#dfe5ee] bg-white shadow-[0_20px_55px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-1 border-b border-[#edf1f7] px-5 py-5 md:px-6">
        <h2 className="text-xl font-semibold text-[#111827]">Users</h2>
        <p className="text-sm font-medium text-[#6b7890]">Open a profile, update access, or change account status.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1020px]">
          <thead>
            <tr className="border-b border-[#edf1f7] bg-[#f8fafc]">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[#77849a]">ID</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[#77849a]">User</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[#77849a]">Email</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[#77849a]">Role</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[#77849a]">Sub Role</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[#77849a]">Clinic</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[#77849a]">Status</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-[#77849a]">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => {
                const roleKey = String(user.role || "").toLowerCase()
                const roleClass = roleStyles[roleKey] || "bg-slate-50 text-slate-700 border-slate-100"
                const isUpdating = statusMutation.isPending && statusUpdatingId === user.id

                return (
                  <tr key={user.id} className="border-b border-[#edf1f7] transition last:border-b-0 hover:bg-[#f8fafc]">
                    <td className="px-5 py-4 text-sm font-semibold text-[#6b7890]">{user.employee_id || user.id}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleViewDetails(user.id)}
                        className="flex items-center gap-3 text-left"
                      >
                        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#eef4ff] text-sm font-semibold text-[#2B76F4]">
                          {getInitials(user) || <FiUser className="h-4 w-4" />}
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-[#111827]">{user.full_name || "Unnamed user"}</span>
                          <span className="mt-0.5 block text-xs font-medium text-[#8b98ad]">View profile</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-[#41506a]">{user.email || "N/A"}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${roleClass}`}>
                        {formatRole(user.role)}
                      </span>
                    </td>
                    <td className="max-w-48 px-5 py-4 text-sm font-medium text-[#41506a]">
                      <span className="line-clamp-2">{formatList(user.subroles)}</span>
                    </td>
                    <td className="max-w-56 px-5 py-4 text-sm font-medium text-[#41506a]">
                      <span className="line-clamp-2">{formatList(user.clinics)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="group relative inline-flex">
                        <button
                          onDoubleClick={(e) => handleToggleStatus(user.id, user.is_active, e)}
                          disabled={isUpdating}
                          className={`inline-flex h-9 min-w-24 items-center justify-center rounded-full border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${user.is_active
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-700"
                            }`}
                        >
                          {isUpdating ? "Updating..." : user.is_active ? "Active" : "Inactive"}
                        </button>
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#111827] px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                          Double-click to toggle
                        </div>
                      </div>
                    </td>
                    <td className="relative px-5 py-4 text-right">
                      <button
                        onClick={(e) => handleAction(user.id, e)}
                        className="inline-grid h-9 w-9 place-items-center rounded-xl border border-[#d9e1ec] bg-white text-[#6b7890] transition hover:border-[#2B76F4] hover:text-[#2B76F4]"
                        aria-label="Open user actions"
                      >
                        <FiMoreVertical className="h-4 w-4" />
                      </button>

                      {openMenuId === user.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-5 top-14 z-30 w-52 overflow-hidden rounded-xl border border-[#dfe5ee] bg-white p-1 text-left shadow-[0_18px_45px_rgba(15,23,42,0.14)]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => handleUpdateUser(user.id, e)}
                            className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-[#41506a] transition hover:bg-[#f8fafc] hover:text-[#2B76F4]"
                          >
                            <FiEdit3 className="h-4 w-4" />
                            Update User
                          </button>
                          <button
                            onClick={(e) => handleChangePassword(user.id, e)}
                            className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-[#41506a] transition hover:bg-[#f8fafc] hover:text-[#2B76F4]"
                          >
                            <FiKey className="h-4 w-4" />
                            Change Password
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan="8" className="px-5 py-14 text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#f3f6fb] text-[#8b98ad]">
                    <FiShield className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-[#172033]">No users found</h3>
                  <p className="mt-1 text-sm font-medium text-[#6b7890]">Try adjusting the search or filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
