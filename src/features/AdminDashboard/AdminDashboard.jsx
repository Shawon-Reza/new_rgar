import React, { useEffect, useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { IoNotificationsOutline } from 'react-icons/io5'
import { Outlet } from 'react-router-dom'
import AdminDashboardSidebar from './AdminDashboardSidebar'
import ProfileDropdown from './ProfileDropdown'
import useIsBelowMd from '../../Components/hooks/useIsBelowMd'
import { TbLayoutSidebarFilled } from 'react-icons/tb'
import { BsLayoutSidebarInset } from 'react-icons/bs'
import useGetUserProfile from '../../hooks/useGetUserProfile'
import Notifications from './Notification/Notifications'
import { connectWebSocketForNotifications } from './Communication/ChatService'
import axiosApi from '../../service/axiosInstance'
import { lightenHex } from './themfunction'


const AdminDashboard = () => {
    const isMobile = useIsBelowMd()
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('sidebarCollapsed')
        return saved ? JSON.parse(saved) : false
    })
    const [isNotificationOpen, setIsNotificationOpen] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [notificationCount, setNotificationCount] = useState(null)
    const [primaryColor, setPrimaryColor] = useState('')
    const notificationRef = useRef(null)
    const notificationSocketRef = useRef(null)


    const { userProfileData } = useGetUserProfile();


    // Keep sidebar open on larger screens, closed by default on small screens
    useEffect(() => {
        setIsSidebarOpen(!isMobile)
    }, [isMobile])

    // Save collapse state to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed))
    }, [isCollapsed])
    // ================================ Set Primary Color Theme ======================================\\
    useEffect(() => {
        const savedColor = localStorage.getItem('themeColor')
        const currentColor = savedColor || getComputedStyle(document.documentElement)
            .getPropertyValue("--bg-primary")
            .trim() || '#00A4A6'

        if (savedColor) {
            document.documentElement.style.setProperty('--color-primary', savedColor)
            document.documentElement.style.setProperty('--bg-primary', savedColor)
        }
        setPrimaryColor(currentColor)

        const handleStorage = (event) => {
            if (event.key === 'themeColor') {
                const nextColor = event.newValue || '#00A4A6'
                document.documentElement.style.setProperty('--color-primary', nextColor)
                document.documentElement.style.setProperty('--bg-primary', nextColor)
                setPrimaryColor(nextColor)
            }
        }

        window.addEventListener('storage', handleStorage)
        return () => window.removeEventListener('storage', handleStorage)
    }, [])

    //================================ Handle click outside notification modal======================================\\
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationOpen(false)
            }
        }

        if (isNotificationOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isNotificationOpen])

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev)
    const toggleCollapse = () => setIsCollapsed(prev => !prev)

    //================================ Get Unread notifications Count ======================================\\
    const { data: unreadCountData, isLoading: isUnreadCountLoading } = useQuery({
        queryKey: ['unreadNotificationCount'],
        queryFn: async () => {
            const response = await axiosApi.get('/api/v1/notifications/unread-count/')
            return response.data
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    // Update notificationCount when API data arrives
    useEffect(() => {
        if (unreadCountData?.unread_counts?.total) {
            setNotificationCount(unreadCountData.unread_counts.total)
            console.log('📊 Unread notifications count updated:', unreadCountData.unread_counts.total)
        }
    }, [unreadCountData])







    //================================ Connect the WebSocket For Notifications ======================================\\
    useEffect(() => {
        console.log('🔗 Attempting to connect WebSocket for Notifications...')

        const socketHandler = connectWebSocketForNotifications({
            onMessage: (data) => {
                console.log('Message Recieve from Component============================##', data?.data?.total);
                setNotificationCount(data?.data?.total)

            },

            onSeen: (messageIds, seenBy) => {
                console.log('✅ Messages marked as seen:', messageIds, 'by', seenBy)
            }
        })

        if (socketHandler) {
            console.log('✅ WebSocket handler created for Notifications')
            notificationSocketRef.current = socketHandler
        } else {
            console.error('❌ Failed to create WebSocket handler for Notifications')
        }

        return () => {
            if (notificationSocketRef.current?.close) {
                console.log('🔌 Closing WebSocket connection for Notifications')
                notificationSocketRef.current.close()
            }
        }
    }, [])

    // Monitor WebSocket connection status
    useEffect(() => {
        const checkInterval = setInterval(() => {
            if (notificationSocketRef.current?.getReadyState) {
                const readyState = notificationSocketRef.current.getReadyState()
                const stateNames = { 0: 'CONNECTING', 1: 'OPEN', 2: 'CLOSING', 3: 'CLOSED' }
                console.log(`🔍 WebSocket status check: ${stateNames[readyState]} (${readyState})`)

                if (readyState === 3) {
                    console.warn('⚠️ WebSocket is CLOSED - connection lost or server unavailable')
                    console.warn('Make sure server at 10.10.13.2:8000 is running and accessible')
                }
            }
        }, 30000) // Check every 30 seconds

        return () => clearInterval(checkInterval)
    }, [])









    return (
        <div className="max-h-screen min-h-screen flex ">
            {/* Sidebar: visible on desktop; on mobile it's a full-screen panel when open */}
            {(!isMobile || isSidebarOpen) && (
                <section
                    className={
                        isMobile
                            ? 'fixed inset-0 z-50 bg-white w-full h-full shadow-lg' // mobile full-screen sidebar
                            : isCollapsed
                                ? 'w-[100px]' // collapsed width
                                : 'w-[30%] lg:w-[30%] xl:w-[20%] 2xl:w-[18%]' // desktop sidebar width
                    }
                >
                    <div className=' relative'>
                        <AdminDashboardSidebar onClick={toggleSidebar} isCollapsed={isCollapsed} onToggleCollapse={toggleCollapse} />

                        {/* Sidebar toggle icon only on small screens */}
                        {isMobile && (
                            <button
                                onClick={toggleSidebar}
                                aria-label="Toggle sidebar"
                                className="p-2 rounded-md bg-transparent cursor-pointer absolute top-10 right-4"
                            >
                                {isSidebarOpen ? (
                                    <TbLayoutSidebarFilled size={26} />
                                ) : (
                                    <BsLayoutSidebarInset size={26} />
                                )}
                            </button>
                        )}
                    </div>


                </section>
            )}

            {/* Main content area: hide on mobile when sidebar is open */}
            {(!isMobile || !isSidebarOpen) && (
                <section className={`overflow-auto fle
                 ${isMobile ? 'w-full' : isCollapsed ? 'w-[calc(100%-80px)]' : 'w-[70%] lg:w-[70%] xl:w-[80%] 2xl:w-[82%]'} `}>

                    <section className="w-full ">

                        {/* Navbar */}
                        <nav className="w-full flex justify-between items-center px-6 py-4 shadow-2xl">

                            {!isMobile && (
                                <div className=" flex gap-2">
                                    <button
                                        onClick={toggleCollapse}
                                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                                        className="p-2 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                                    >
                                        {isCollapsed ? (
                                            <BsLayoutSidebarInset size={30} />
                                        ) : (
                                            <TbLayoutSidebarFilled size={35} />
                                        )}
                                    </button>
                                    <div className="text-primary">
                                        <h3 className="font-semibold text-xl">{`Welcome, ${userProfileData?.full_name || 'User Name'}`}</h3>
                                        <h5>let's make your work easy</h5>
                                    </div>
                                </div>
                            )}




                            <div className="flex items-center gap-5">



                                {/* ============================== Profile Dropdown =================================== */}
                                <ProfileDropdown userProfileData={userProfileData} />

                                {/* Sidebar toggle icon only on small screens */}
                                {isMobile && (
                                    <button
                                        onClick={toggleSidebar}
                                        aria-label="Toggle sidebar"
                                        className="p-2 rounded-md bg-transparent cursor-pointer"
                                    >
                                        {isSidebarOpen ? (
                                            <TbLayoutSidebarFilled size={26} />
                                        ) : (
                                            <BsLayoutSidebarInset size={26} />
                                        )}
                                    </button>
                                )}



                                {/* ======================Notifications Icons============================== */}
                                <div
                                    ref={notificationRef}
                                    className="relative p-3 rounded-full bg-[#00A4A61A] cursor-pointer"
                                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                >

                                    <IoNotificationsOutline size={21} />
                                    {notificationCount > 0 && (
                                        <div className="absolute -top-1 -right-1 rounded-full bg-red-500 h-5 w-5 flex items-center justify-center text-white text-xs font-bold">
                                            {notificationCount > 99 ? '99+' : notificationCount}
                                        </div>
                                    )}

                                    {/* Notification Modal */}
                                    {isNotificationOpen && (
                                        <div className={`absolute right-0 top-12 w-96 bg-white rounded-lg shadow-2xl z-50 max-h-[calc(100vh-200px)] overflow-hidden ${isMobile ? '-left-36' : ''}`}>
                                            <Notifications
                                                // notifications={notifications}
                                                notificationCount={notificationCount}
                                            // onNotificationRead={() => setNotificationCount(0)}
                                            />
                                        </div>
                                    )}
                                </div>




                            </div>
                        </nav>
                    </section>

                    <section className="min-h-[calc(100vh-85px)] mx-auto px-6 py-2"
                        style={{ backgroundColor: lightenHex(primaryColor || '#00A4A6', 90) }}>
                        <Outlet />
                    </section>
                </section>
            )}
        </div>
    )
}

export default AdminDashboard