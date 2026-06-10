import { useEffect, useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import AdminDashboardSidebar from './AdminDashboardSidebar'
import useIsBelowMd from '../../Components/hooks/useIsBelowMd'
import { TbClipboardCheck, TbFilePencil } from 'react-icons/tb'
import { FiBell, FiCpu, FiLogOut, FiMessageCircle, FiSettings, FiUsers } from 'react-icons/fi'
import { HiOutlineSparkles } from 'react-icons/hi2'
import { PiHospitalLight } from 'react-icons/pi'
import { connectWebSocketForNotifications } from './Communication/ChatService'
import axiosApi from '../../service/axiosInstance'
import { lightenHex } from './themfunction'
import useGetUserProfile from '../../hooks/useGetUserProfile'
import { queryClient } from '../../main'


const AdminDashboard = () => {
    const isMobile = useIsBelowMd()
    const location = useLocation()
    const navigate = useNavigate()
    const isChartlyRoute = location.pathname.startsWith('/admin/charting-ai')
    const isAssistanceRoute = location.pathname.startsWith('/admin/assistance')
    const isCommunicationRoute = location.pathname.startsWith('/admin/communication')
    const isWorkspaceRoute = isChartlyRoute || isAssistanceRoute || isCommunicationRoute
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [notificationCount, setNotificationCount] = useState(0)
    const [primaryColor, setPrimaryColor] = useState('')
    const notificationSocketRef = useRef(null)
    const { userProfileData } = useGetUserProfile()
    const mobileNavItems = [
        { label: 'Team Chat', to: '/admin/communication', icon: FiMessageCircle },
        { label: 'Assistance', to: '/admin/assistance', icon: HiOutlineSparkles },
        { label: 'Alerts', to: '/admin/notifications', icon: FiBell },
        { label: 'AI Training', to: '/admin/ai-training', icon: FiCpu },
        { label: 'Chartly', to: '/admin/charting-ai', icon: TbFilePencil },
        { label: 'Clinics', to: userProfileData?.role === 'owner' ? '/admin/manage-clinic' : '/admin/assigned-clinic', icon: PiHospitalLight },
        { label: 'Users', to: '/admin/user-management', icon: FiUsers },
        { label: 'Assessments', to: '/admin/assessments', icon: TbClipboardCheck },
        { label: 'Settings', to: '/admin/settings', icon: FiSettings },
    ]


    // Keep sidebar open on larger screens, closed by default on small screens
    useEffect(() => {
        setIsSidebarOpen(!isMobile)
    }, [isMobile])

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

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev)

    const handleMobileSignOut = () => {
        queryClient.clear()
        localStorage.removeItem('auth')
        navigate('/login', { replace: true })
    }

    //================================ Get Unread notifications Count ======================================\\
    const { data: unreadCountData } = useQuery({
        queryKey: ['unreadNotificationCount'],
        queryFn: async () => {
            const response = await axiosApi.get('/api/v1/notifications/unread-count/')
            return response.data
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    // Update notificationCount when API data arrives
    useEffect(() => {
        setNotificationCount(unreadCountData?.unread_counts?.total ?? 0)
    }, [unreadCountData])







    //================================ Connect the WebSocket For Notifications ======================================\\
    useEffect(() => {
        const socketHandler = connectWebSocketForNotifications({
            onMessage: (data) => {
                setNotificationCount(data?.data?.total)

            },

            onSeen: (messageIds, seenBy) => {
            }
        })

        if (socketHandler) {
            notificationSocketRef.current = socketHandler
        }

        return () => {
            if (notificationSocketRef.current?.close) {
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
            }
        }, 30000) // Check every 30 seconds

        return () => clearInterval(checkInterval)
    }, [])









    return (
        <div className="flex h-[100dvh] overflow-hidden">
            {/* Sidebar: desktop only. Mobile uses the bottom nav. */}
            {!isMobile && (
                <section className="w-[72px] shrink-0">
                    <div className=' relative'>
                        <AdminDashboardSidebar
                            onClick={toggleSidebar}
                            notificationCount={notificationCount}
                        />
                    </div>
                </section>
            )}

            {/* Main column: banner sits above the content only, not over the sidebar */}
            <div className="flex min-w-0 flex-1 flex-col">
            <div
                className="h-7 w-full shrink-0 bg-[linear-gradient(90deg,#8b3f0e_0%,#8b3f0e_24%,#d97706_50%,#8b3f0e_76%,#8b3f0e_100%)]"
                aria-hidden="true"
            />
            {/* Main content area stays visible beside the compact mobile rail. */}
            <section className={`${isWorkspaceRoute ? 'min-h-0 flex-1 overflow-hidden' : 'overflow-auto'} ${isMobile ? 'w-full' : 'min-w-0 flex-1'}`}>
                    <section
                        className={isWorkspaceRoute
                            ? `${isMobile ? 'h-[calc(100dvh-1.75rem-64px)]' : 'h-[calc(100dvh-1.75rem)]'} bg-[#eef2f8]`
                            : `min-h-[calc(100vh-1.75rem)] mx-auto px-2 sm:px-6 py-4 ${isMobile ? 'pb-24' : ''}`
                        }
                        style={isWorkspaceRoute ? undefined : { backgroundColor: lightenHex(primaryColor || '#00A4A6', 90) }}
                    >
                        <Outlet />
                    </section>
            </section>
            {isMobile && (
                <nav className="no-scrollbar fixed inset-x-0 bottom-0 z-40 flex h-16 overflow-x-auto border-t border-[#24324a] bg-[#0d1729] px-1 text-[#71809c] shadow-[0_-10px_24px_rgba(15,23,42,0.25)]">
                    {mobileNavItems.map((item) => {
                        const Icon = item.icon

                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex w-[76px] shrink-0 flex-col items-center justify-center gap-1 text-center transition-colors ${isActive
                                        ? 'text-[#49a1ff]'
                                        : 'text-[#74839f] hover:text-[#b4c4dd]'
                                    }`
                                }
                            >
                                <Icon size={20} strokeWidth={1.8} />
                                <span className="block max-w-full truncate text-[10px] font-medium leading-none">
                                    {item.label}
                                </span>
                            </NavLink>
                        )
                    })}
                    <button
                        type="button"
                        onClick={handleMobileSignOut}
                        className="flex w-[76px] shrink-0 flex-col items-center justify-center gap-1 text-center text-[#74839f] transition-colors hover:text-red-300"
                        title="Sign out"
                        aria-label="Sign out"
                    >
                        <FiLogOut size={20} strokeWidth={1.8} />
                        <span className="block max-w-full truncate text-[10px] font-medium leading-none">
                            Sign out
                        </span>
                    </button>
                </nav>
            )}
            </div>
        </div>
    )
}

export default AdminDashboard
