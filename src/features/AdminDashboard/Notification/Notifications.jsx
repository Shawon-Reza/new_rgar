import { useEffect } from 'react'
import { FiBell, FiTrash2, FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import Swal from 'sweetalert2'

import { queryClient } from '../../../main'
import axiosApi from '../../../service/axiosInstance'

const Notifications = () => {
  const navigate = useNavigate()

  const { mutate: markNotificationsAsRead } = useMutation({
    mutationFn: async () => {
      const response = await axiosApi.post('/api/v1/notifications/read/')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] })
    },
  })

  const {
    data: notificationsData,
    isLoading,
    error,
    isSuccess,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await axiosApi.get('/api/v1/notifications/all/')
      return response.data
    },
  })

  const { mutate: deleteNotification } = useMutation({
    mutationFn: async ({ source, id }) => {
      const response = await axiosApi.delete(`/api/v1/notifications/${source}/${id}/`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] })
    },
  })

  const { mutate: markNotificationAsSeen } = useMutation({
    mutationFn: async ({ id, source }) => {
      const body = { type: source === 'notification' ? 'notification' : 'ai_ticket' }
      const response = await axiosApi.post(`/api/v1/notifications/web/${id}/seen/`, body)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] })
    },
  })

  const { mutate: deleteAllNotifications } = useMutation({
    mutationFn: async () => {
      const response = await axiosApi.delete('/api/v1/notifications/delete-all/')
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unreadNotificationCount'] })
      Swal.fire({
        title: "Deleted",
        text: "All notifications have been cleared.",
        icon: "success",
      })
    },
    onError: (deleteError) => {
      Swal.fire({
        title: "Error",
        text: deleteError?.response?.data?.message || "Failed to delete all notifications.",
        icon: "error",
      })
    },
  })

  const notifications = notificationsData?.results ?? []
  const unreadCount = notifications.filter((notification) => !notification.is_seen).length

  useEffect(() => {
    if (isSuccess && notifications.length > 0) {
      markNotificationsAsRead()
    }
  }, [isSuccess, notifications.length, markNotificationsAsRead])

  const handleNotificationClick = (notification) => {
    const type = notification?.type

    if (type === 'mention') {
      const roomId = notification?.payload?.room_id
      const messageId = notification?.payload?.message_id
      navigate('/admin/communication', { state: { roomId, messageId }, replace: true })
      return
    }

    if (type === 'assesments' || type === 'ai_training') {
      navigate('/admin/dashboard')
    }
  }

  const handleClearAll = () => {
    if (notifications.length === 0) return

    Swal.fire({
      title: "Clear notifications?",
      text: "This will remove all notifications from your list.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2B76F4",
      cancelButtonColor: "#dc2626",
      confirmButtonText: "Clear all",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteAllNotifications()
      }
    })
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-1 py-5 text-[#172033] sm:px-0 md:py-8">
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2B76F4]">Notification Center</span>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal text-[#111827] md:text-3xl">Notifications</h1>
        </div>

        <button
          type="button"
          onClick={handleClearAll}
          disabled={notifications.length === 0}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#dbe3ee] bg-white px-4 text-sm font-semibold text-[#526174] shadow-sm transition-colors hover:bg-[#f7f9fc] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiTrash2 size={16} />
          Clear All
        </button>
      </section>

      <section className="overflow-hidden rounded-lg border border-[#dfe6f0] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.07)]">
        <div className="flex items-center justify-between border-b border-[#edf1f6] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eef4ff] text-[#2B76F4]">
              <FiBell size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#111827]">Recent Activity</h2>
              <p className="text-sm font-medium text-[#6b778c]">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[260px] items-center justify-center text-sm font-medium text-[#6b778c]">
            Loading notifications...
          </div>
        ) : error ? (
          <div className="flex min-h-[260px] items-center justify-center px-6 text-center text-sm font-medium text-red-600">
            Failed to load notifications.
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-[#edf1f6]">
            {notifications.map((notification) => (
              <article
                key={`${notification.source}-${notification.id}`}
                onClick={() => {
                  markNotificationAsSeen({ id: notification.id, source: notification.source })
                  handleNotificationClick(notification)
                }}
                className={`group flex cursor-pointer gap-4 px-5 py-4 transition-colors hover:bg-[#f8fbff] ${!notification.is_seen ? 'bg-[#f7fbff]' : 'bg-white'
                  }`}
              >
                <div className="pt-1">
                  <span className={`block h-2.5 w-2.5 rounded-full ${!notification.is_seen ? 'bg-[#2B76F4]' : 'bg-[#d4dce8]'}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className={`text-sm leading-6 text-[#253044] ${!notification.is_seen ? 'font-semibold' : 'font-medium'}`}>
                    {notification?.title || notification?.message || 'New notification'}
                  </p>
                  {notification?.created_at && (
                    <p className="mt-1 text-xs font-medium text-[#8a97aa]">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    deleteNotification({ source: notification.source, id: notification.id })
                  }}
                  className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#9aa6b8] opacity-100 transition-colors hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                  aria-label="Delete notification"
                >
                  <FiX size={17} />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-[#eef4ff] text-[#2B76F4]">
              <FiBell size={24} />
            </div>
            <h3 className="text-lg font-semibold text-[#111827]">No notifications yet</h3>
            <p className="mt-1 max-w-sm text-sm font-medium text-[#6b778c]">
              New mentions, assessments, and system updates will appear here.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

export default Notifications
