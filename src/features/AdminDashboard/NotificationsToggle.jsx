"use client"

import { useEffect, useState } from "react"
import { FiBell, FiMessageCircle } from "react-icons/fi"
import axiosApi from "../../service/axiosInstance"
import { toast } from "react-toastify"

const PREFERENCES = [
    {
        key: "notify_assessments",
        title: "Assessment Reminders",
        description: "Receive updates when assessments need your attention.",
        icon: FiBell,
    },
    {
        key: "notify_tagged_messages",
        title: "Tagged Messages",
        description: "Get notified when someone mentions you in a conversation.",
        icon: FiMessageCircle,
    },
]

const NotificationsToggle = () => {
    const [notifications, setNotifications] = useState({
        notify_assessments: false,
        notify_tagged_messages: false,
    })
    const [loading, setLoading] = useState(true)
    const [savingKey, setSavingKey] = useState(null)

    useEffect(() => {
        fetchNotifications()
    }, [])

    const fetchNotifications = async () => {
        try {
            setLoading(true)
            const response = await axiosApi.get('/api/v1/users/notifications/')
            const data = response.data

            setNotifications({
                notify_assessments: data.notify_assessments ?? false,
                notify_tagged_messages: data.notify_tagged_messages ?? false,
            })
        } catch (error) {
            console.error("[NotificationsToggle] Error fetching notifications:", error)
            toast.error("Failed to load notification preferences")
        } finally {
            setLoading(false)
        }
    }

    const handleToggle = async (key) => {
        const previousNotifications = notifications
        const updatedNotifications = {
            ...notifications,
            [key]: !notifications[key],
        }

        setNotifications(updatedNotifications)
        setSavingKey(key)

        try {
            await axiosApi.patch('/api/v1/users/notifications/', updatedNotifications)
            toast.success('Notification preference updated')
        } catch (error) {
            console.error('[NotificationsToggle] Error updating notification preference:', error)
            toast.error('Failed to update notification preference')
            setNotifications(previousNotifications)
        } finally {
            setSavingKey(null)
        }
    }

    if (loading) {
        return (
            <section className="mx-auto max-w-3xl rounded-lg border border-[#dfe6f0] bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.07)]">
                <div className="h-5 w-44 animate-pulse rounded bg-[#eef2f7]" />
                <div className="mt-2 h-4 w-72 animate-pulse rounded bg-[#eef2f7]" />
                <div className="mt-7 space-y-3">
                    <div className="h-20 animate-pulse rounded-lg bg-[#f7f9fc]" />
                    <div className="h-20 animate-pulse rounded-lg bg-[#f7f9fc]" />
                </div>
            </section>
        )
    }

    return (
        <section className="mx-auto max-w-3xl">
            <div className="overflow-hidden rounded-lg border border-[#dfe6f0] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.07)]">
                <div className="border-b border-[#edf1f6] px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-extrabold tracking-normal text-[#111827]">Notification Preferences</h2>
                            <p className="mt-1 text-sm font-medium text-[#6b778c]">
                                Choose the alerts that should appear in your workspace.
                            </p>
                        </div>
                        <span className="hidden rounded-lg bg-[#eef4ff] px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-[#2f6ff3] sm:inline-flex">
                            Live
                        </span>
                    </div>
                </div>

                <div className="divide-y divide-[#edf1f6]">
                    {PREFERENCES.map(({ key, title, description, icon: Icon }) => {
                        const enabled = notifications[key]
                        const saving = savingKey === key

                        return (
                            <div key={key} className="flex items-center justify-between gap-5 px-6 py-5 transition-colors hover:bg-[#f8fbff]">
                                <div className="flex min-w-0 items-center gap-4">
                                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${enabled ? "bg-[#eef4ff] text-[#2f6ff3]" : "bg-[#f3f6fa] text-[#7b8798]"}`}>
                                        <Icon size={19} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-extrabold text-[#172033]">{title}</h3>
                                        <p className="mt-1 text-sm font-medium leading-5 text-[#6b778c]">{description}</p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleToggle(key)}
                                    disabled={saving}
                                    className={`relative h-7 w-12 shrink-0 rounded-full p-0.5 transition-colors duration-200 ${enabled ? "bg-[#2f6ff3]" : "bg-[#cbd3df]"} ${saving ? "cursor-wait opacity-70" : "cursor-pointer"}`}
                                    aria-label={`Toggle ${title}`}
                                    aria-pressed={enabled}
                                >
                                    <span
                                        className={`block h-6 w-6 rounded-full bg-white shadow-[0_2px_6px_rgba(15,23,42,0.2)] transition-transform duration-200 ${enabled ? "translate-x-5" : "translate-x-0"}`}
                                    />
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

export default NotificationsToggle
