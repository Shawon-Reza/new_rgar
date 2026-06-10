import { createElement, useEffect } from "react"
import { FiBell, FiCpu, FiLogOut, FiMessageCircle, FiSettings, FiUsers } from "react-icons/fi"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { PiHospitalLight } from "react-icons/pi";
import { HiOutlineSparkles } from "react-icons/hi2";
import useUserPermissionsForOwn from "../../hooks/useUserPermissionsForOwn"
import useGetUserProfile from "../../hooks/useGetUserProfile"
import { GoHistory } from "react-icons/go"
import { TbClipboardCheck, TbFilePencil } from "react-icons/tb";
import { queryClient } from "../../main";

export default function AdminDashboardSidebar({ onClick, notificationCount = 0 }) {
    const navigate = useNavigate();
    const location = useLocation();

    // =================================== Theme Color From Localstorage ==================================\\
    useEffect(() => {
        const savedColor = localStorage.getItem('themeColor')
        if (savedColor) {
            document.documentElement.style.setProperty('--color-primary', savedColor)
            document.documentElement.style.setProperty('--bg-primary', savedColor)
        }
    }, [])

    //...................................Get User Profile Data...................................\\

    const { userProfileData } = useGetUserProfile();
    const profileInitial = (userProfileData?.full_name?.trim()?.charAt(0) || "K").toUpperCase();


    // .................................Fetch user permissions..................................\\
    const { data: permissionData } = useUserPermissionsForOwn();

    // ......................................................................\\
    // ...................Access Control Logic For Sidebar display/Hidden........................\\
    const accessControl = {
        assessmentAccess:
            userProfileData?.role === "owner" ||
            userProfileData?.role === "president" ||
            permissionData?.enabledPermissions?.includes("assessment"),

        aiTrainingAccess:
            userProfileData?.role === "owner" ||
            userProfileData?.role === "president" ||
            permissionData?.enabledPermissions?.includes("ai_training"),

        userManagementAccess:
            userProfileData?.role === "owner" ||
            userProfileData?.role === "president" ||
            permissionData?.enabledPermissions?.includes("user_management"),

        communicationAccess:
            userProfileData?.role === "owner" ||
            userProfileData?.role === "president" ||
            permissionData?.enabledPermissions?.includes("chat"),

        blockAccess:
            userProfileData?.role === "owner" ||
            userProfileData?.role === "president" ||
            permissionData?.enabledPermissions?.includes("block_user"),
        clinicAccess:
            userProfileData?.role === "owner"
        // || userProfileData?.role === "president",
        ,

        subjectsMattersAccess:
            userProfileData?.role === "owner" ||
            userProfileData?.role === "president",
        assignedClinicsAccess:
            userProfileData?.role === "owner"
        // || userProfileData?.role === "president"
    };

    const sidebarItems = [
        {
            label: "Team",
            title: "Team",
            to: "/admin/communication",
            icon: FiMessageCircle,
            visible: true,
        },
        {
            label: "Assistance",
            title: "Assistance",
            to: "/admin/assistance",
            icon: HiOutlineSparkles,
            visible: true,
        },
        {
            label: "Alerts",
            title: "Notifications",
            to: "/admin/notifications",
            icon: FiBell,
            visible: true,
            alertCount: notificationCount,
        },
        {
            label: "AI Training",
            title: "AI Training",
            to: "/admin/ai-training",
            icon: FiCpu,
            visible: accessControl.aiTrainingAccess,
        },
        {
            label: "Chartly",
            title: "Chartly AI",
            to: "/admin/charting-ai",
            icon: TbFilePencil,
            visible: userProfileData?.role === "doctor" || userProfileData?.role === "president",
        },
        {
            label: userProfileData?.role === "owner" ? "Clinics" : "Clinic",
            title: userProfileData?.role === "owner" ? "Manage Clinic" : "Assigned Clinic",
            to: userProfileData?.role === "owner" ? "/admin/manage-clinic" : "/admin/assigned-clinic",
            icon: PiHospitalLight,
            visible: accessControl.clinicAccess || (userProfileData?.role && userProfileData.role !== "owner"),
        },
        {
            label: "Users",
            title: "User Management",
            to: "/admin/user-management",
            icon: FiUsers,
            visible: accessControl.userManagementAccess,
        },
        {
            label: "History",
            title: "Clinicwise Chat History",
            to: "/admin/clinicwise-chat-history",
            icon: GoHistory,
            visible: userProfileData?.role === "owner",
        },
        {
            label: "Assessments",
            title: "Assessments",
            to: "/admin/assessments",
            icon: TbClipboardCheck,
            visible: accessControl.assessmentAccess,
        },
        {
            label: "Settings",
            title: "Settings",
            to: "/admin/settings",
            icon: FiSettings,
            visible: true,
        },
    ].filter((item) => item.visible);
    const activeIndex = sidebarItems.findIndex((item) =>
        location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
    );

    const handleSignOut = () => {
        queryClient.clear()
        localStorage.removeItem('auth')
        if (typeof onClick === 'function') {
            onClick()
        }
        navigate('/login', { replace: true })
    }

    // .......................................................................\\
    return (
        <aside className="flex h-screen w-[72px] shrink-0 flex-col overflow-hidden bg-[#0d1729] text-[#71809c] shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)]">
            {/* Logo */}
            <div className="flex h-[86px] shrink-0 items-start justify-center pt-5">
                <button
                    type="button"
                    onClick={() => navigate('/admin/communication')}
                    aria-label="Go to team chat"
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-[#4c8cff] to-[#1c58dc] text-[15px] font-semibold text-white shadow-[0_14px_28px_rgba(31,98,225,0.42)] transition-transform duration-200 hover:scale-105"
                >
                    {profileInitial}
                </button>
            </div>

            {/* =============================================== Navigation Menu ==============================================*/}
            <nav className="no-scrollbar relative flex min-h-0 flex-1 flex-col items-center gap-[18px] overflow-y-auto px-2 pb-5">
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-2 top-0 h-[56px] w-[56px] rounded-lg border border-[#2e6ff7] bg-[#102b52] shadow-[0_0_0_1px_rgba(57,125,255,0.25),0_10px_24px_rgba(36,108,255,0.26)] transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{
                        opacity: activeIndex >= 0 ? 1 : 0,
                        transform: `translateY(${Math.max(activeIndex, 0) * 74}px)`,
                    }}
                />
                {sidebarItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onClick}
                        title={item.title}
                        aria-label={item.title}
                        className={({ isActive }) =>
                            `group relative z-10 flex h-[56px] w-[56px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-transparent text-center transition-colors duration-300 ease-out ${isActive
                                ? "text-[#43a4ff]"
                                : "text-[#74839f] hover:text-[#a9b8d2]"
                            }`
                        }
                    >
                        <span className="relative flex h-5 w-5 items-center justify-center">
                            {createElement(item.icon, { size: 20, strokeWidth: 1.8 })}
                            {item.alertCount > 0 && (
                                <span className="absolute -right-2.5 -top-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[9px] font-semibold leading-none text-white shadow-[0_0_0_2px_#0d1729]">
                                    {item.alertCount > 9 ? "9+" : item.alertCount}
                                </span>
                            )}
                        </span>
                        <span className="block max-w-[52px] text-[10px] font-medium leading-[10px] tracking-normal [overflow-wrap:anywhere]">
                            {item.label}
                        </span>
                    </NavLink>
                ))}
            </nav>

            <div className="shrink-0 border-t border-white/5 px-2 py-3">
                <button
                    type="button"
                    onClick={handleSignOut}
                    title="Sign out"
                    aria-label="Sign out"
                    className="group flex h-[56px] w-[56px] flex-col items-center justify-center gap-1 rounded-lg border border-transparent text-center text-[#74839f] transition-colors duration-200 hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-300"
                >
                    <FiLogOut size={20} strokeWidth={1.8} />
                    <span className="block max-w-[52px] text-[10px] font-medium leading-[10px] tracking-normal">
                        Sign out
                    </span>
                </button>
            </div>
        </aside>
    )
}
