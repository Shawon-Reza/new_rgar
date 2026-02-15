"use client"

import { useState, useEffect } from "react"
import { FiBell } from "react-icons/fi"
import axiosApi from "../../service/axiosInstance"
import { toast } from "react-toastify"

const NotificationsToggle = () => {
    const [notifications, setNotifications] = useState({
        notify_assessments: false,
        notify_tagged_messages: false
    })
    const [loading, setLoading] = useState(true)

    // Fetch notifications data
    useEffect(() => {
        console.log("[v0] Notifications component mounted")
        fetchNotifications()
    }, [])

    const fetchNotifications = async () => {
        try {
            console.log("[v0] Fetching notifications data...")
            setLoading(true)

            const response = await axiosApi.get('/api/v1/users/notifications/')
            const data = response.data
            console.log("[v0] Notifications API response:", data)
            
            setNotifications({
                notify_assessments: data.notify_assessments ?? false,
                notify_tagged_messages: data.notify_tagged_messages ?? false
            })
            console.log("[v0] Notifications data loaded:", data)
            setLoading(false)
        } catch (error) {
            console.error("[v0] Error fetching notifications:", error)
            toast.error("Failed to load notification preferences")
            setLoading(false)
        }
    }

    const handleToggle = async (key) => {
        const currentState = notifications[key]
        console.log(`[v0] Toggling notification: ${key}, Current state: ${currentState}`)

        // Optimistically update UI
        const updatedNotifications = {
            ...notifications,
            [key]: !currentState
        }
        setNotifications(updatedNotifications)

        // Call backend API to save the change
        try {
            const response = await axiosApi.patch('/api/v1/users/notifications/', updatedNotifications)
            console.log('[v0] Notification preference updated successfully:', response.data)
            toast.success('Notification preference updated')
        } catch (error) {
            console.error('[v0] Error updating notification preference:', error)
            toast.error('Failed to update notification preference')
            // Revert on error
            setNotifications(notifications)
        }
    }

    if (loading) {
        return <div className="p-6 text-center">Loading notifications...</div>
    }

    return (
        <div className="">
            <div
                className=" border rounded-lg p-6 md:p-8 "
                style={{ borderColor: "var(--bg-primary)" }}
            >
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Notifications</h1>

                <hr className="border border-gray-300" />

                <div className="space-y-4">
                    {/* Assessments Reminder */}
                    <div>
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center gap-4">
                                <FiBell size={24} style={{ color: "#00A4A6" }} />
                                <div>
                                    <p className="text-lg font-medium text-gray-900">Assessments Reminder</p>
                                    <p className="text-sm text-gray-500">Get reminded about upcoming assessments</p>
                                </div>
                            </div>

                            {/* Toggle Switch */}
                            <button
                                onClick={() => handleToggle('notify_assessments')}
                                className="relative inline-flex h-6 w-14 items-center rounded-full transition-colors"
                                style={{
                                    backgroundColor: notifications.notify_assessments ? "var(--bg-primary)" : "#d1d5db",
                                }}
                                aria-label="Toggle Assessments Reminder"
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                        notifications.notify_assessments ? "translate-x-7" : "translate-x-1"
                                    }`}
                                />
                            </button>
                        </div>
                        <div className="border-b border-gray-200"></div>
                    </div>

                    {/* Tagged Message Reminder */}
                    <div>
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center gap-4">
                                <FiBell size={24} style={{ color: "#00A4A6" }} />
                                <div>
                                    <p className="text-lg font-medium text-gray-900">Tagged Message Reminder</p>
                                    <p className="text-sm text-gray-500">Get notified when you are tagged in messages</p>
                                </div>
                            </div>

                            {/* Toggle Switch */}
                            <button
                                onClick={() => handleToggle('notify_tagged_messages')}
                                className="relative inline-flex h-6 w-14 items-center rounded-full transition-colors"
                                style={{
                                    backgroundColor: notifications.notify_tagged_messages ? "var(--bg-primary)" : "#d1d5db",
                                }}
                                aria-label="Toggle Tagged Message Reminder"
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                        notifications.notify_tagged_messages ? "translate-x-7" : "translate-x-1"
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NotificationsToggle
