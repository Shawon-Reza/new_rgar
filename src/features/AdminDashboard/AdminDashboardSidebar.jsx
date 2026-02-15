import { useEffect } from "react"
import { FiGrid, FiMessageSquare, FiLock, FiUsers, FiSettings, FiPlus } from "react-icons/fi"
import { NavLink, useNavigate } from "react-router-dom"
import logo from "../../assets/python2.png"
import { TbLayoutSidebarFilled } from 'react-icons/tb'
import { BsLayoutSidebarInset } from 'react-icons/bs'
import { PiFilesThin, PiHospitalLight } from "react-icons/pi";
import { LuBrainCircuit } from "react-icons/lu";
import { GiGiftOfKnowledge } from "react-icons/gi";
import useUserPermissions from "../../hooks/useUserPermissions"
import useUserPermissionsForOwn from "../../hooks/useUserPermissionsForOwn"
import useGetUserProfile from "../../hooks/useGetUserProfile"
import { GoHistory } from "react-icons/go"
import { RiChatVoiceAiLine } from "react-icons/ri";
import useIsBelowMd from "../../Components/hooks/useIsBelowMd"

const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: FiGrid },
    { id: "communication", label: "Communication", icon: FiMessageSquare },
    { id: "manage-clinic", label: "Manage Clinic", icon: PiHospitalLight },
    { id: "subject-matters", label: "Subject Matters", icon: GiGiftOfKnowledge },
    { id: "user-management", label: "User Management", icon: FiUsers },
    { id: "ai-training", label: "AI Training", icon: LuBrainCircuit },
    { id: "assessments", label: "Assessments", icon: PiFilesThin },
    { id: "settings", label: "Settings", icon: FiSettings },
]

export default function AdminDashboardSidebar({ onClick, isCollapsed, onToggleCollapse }) {
    const navigate = useNavigate();
    const isMobile = useIsBelowMd();

    useEffect(() => {
        console.log("Is below :)))))))))))))))))))))))))))))))000000000000000000000000000: ", isMobile)
    }, [isMobile]);

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
    console.log(userProfileData?.role);
    // console.log("User Profile dataaaaaaaaa=====================================================", userProfileData)


    // .................................Fetch user permissions..................................\\
    const { data: permissionData, isLoading: isLoadingPermission, isError: isErrorPermission } = useUserPermissionsForOwn();
    console.log("Permission:", permissionData?.enabledPermissions
    );

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

    console.log(accessControl);








    // .......................................................................\\

    return (
        <aside className="w-full  bg-primary text-white flex flex-col h-screen">
            {/* Logo */}
            <div
                onClick={() => {
                    navigate('/admin')
                }}
                className="p-6 border-b border-primary-600 cursor-pointer">
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <div className=" p-2 rounded-lg">
                        <figure>
                            <img src={logo} alt="AI.Desk Logo  "
                                className={isCollapsed ? 'w-8' : ''}
                            />
                        </figure>
                    </div>
                    {!isCollapsed && (
                        <h1
                            className="text-2xl font-bold">AI.Desk</h1>
                    )}
                </div>
            </div>

            {/* =============================================== Navigation Menu ==============================================*/}
            <nav className="flex-1 p-4 space-y-2.5 overflow-y-auto">
                <NavLink
                    to="/admin/dashboard"
                    onClick={onClick}
                    title={isCollapsed ? 'Dashboard' : ''}
                    className={({ isActive }) =>
                        `w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-2xl text-gray-600 text-default opacity-90 transform transition-all duration-200 ease-in-out ${isActive ? " bg-white/35" : "hover:border hover:border-[#E2E2E2] "
                        }`
                    }
                >
                    <FiGrid size={21} />
                    {!isCollapsed && (
                        <span className="font-semibold text-sm sm:text-xl xl:text-2xl">Dashboard</span>
                    )}
                </NavLink>

                <NavLink
                    to="/admin/communication"
                    onClick={onClick}
                    title={isCollapsed ? 'Communication' : ''}
                    className={({ isActive }) =>
                        `w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-2xl text-gray-600 text-default opacity-90 transform transition-all duration-200 ease-in-out ${isActive ? " bg-white/35" : "hover:border hover:border-[#E2E2E2] "
                        }`
                    }
                >
                    <FiMessageSquare size={21} />
                    {!isCollapsed && (
                        <span className="font-semibold text-sm sm:text-xl xl:text-2xl">Communication</span>
                    )}
                </NavLink>
                {/* //====================================== Charting Ai For Doctor ======================================\\ */}
                {
                    userProfileData?.role === "doctor" &&
                    <NavLink
                        to="/admin/charting-ai"
                        onClick={onClick}
                        title={isCollapsed ? 'Charting Ai' : ''}
                        className={({ isActive }) =>
                            `w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-2xl text-gray-600 text-default opacity-90 transform transition-all duration-200 ease-in-out ${isActive ? " bg-white/35" : "hover:border hover:border-[#E2E2E2] "
                            }`
                        }
                    >
                        <RiChatVoiceAiLine size={21} />
                        {!isCollapsed && (
                            <span className="font-semibold text-sm sm:text-xl xl:text-2xl">Charting Ai</span>
                        )}
                    </NavLink>
                }

                {/*  userProfileData?.role === "owner" */}
                {
                    userProfileData?.role === "owner" &&
                    (
                        <NavLink
                            to="/admin/clinicwise-chat-history"
                            onClick={onClick}
                            title={isCollapsed ? 'Clinicwise Chat History' : ''}
                            className={({ isActive }) =>
                                `w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-2xl text-gray-600 text-default opacity-90 transform transition-all duration-200 ease-in-out ${isActive ? " bg-white/35" : "hover:border hover:border-[#E2E2E2] "
                                }`
                            }
                        >
                            <GoHistory size={21} />
                            {!isCollapsed && (
                                <span className="font-semibold text-sm sm:text-xl xl:text-2xl">Clinicwise Chat History</span>
                            )}
                        </NavLink>
                    )
                }


                <NavLink
                    to="/admin/manage-clinic"
                    onClick={onClick}
                    title={isCollapsed ? 'Manage Clinic' : ''}
                    className={({ isActive }) =>
                        `w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-2xl text-gray-600 text-default opacity-90 transform transition-all duration-200 ease-in-out ${isActive ? " bg-white/35" : "hover:border hover:border-[#E2E2E2] "
                        } ${accessControl.clinicAccess ? '' : 'hidden'}`
                    }
                >
                    <PiHospitalLight size={21} />
                    {!isCollapsed && (
                        <span className="font-semibold text-sm sm:text-xl xl:text-2xl">Manage Clinic</span>
                    )}
                </NavLink>

                <NavLink
                    to="/admin/assigned-clinic"
                    onClick={onClick}
                    title={isCollapsed ? 'Assigned Clinic' : ''}
                    className={({ isActive }) =>
                        `w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-2xl text-gray-600 text-default opacity-90 transform transition-all duration-200 ease-in-out ${isActive ? " bg-white/35" : "hover:border hover:border-[#E2E2E2] "
                        } ${!accessControl?.assignedClinicsAccess ? '' : 'hidden'}`
                    }
                >
                    <PiHospitalLight size={21} />
                    {!isCollapsed && (
                        <span className="font-semibold text-sm sm:text-xl xl:text-2xl">Assigned Clinic</span>
                    )}
                </NavLink>

                <NavLink
                    to="/admin/subject-matters"
                    onClick={onClick}
                    title={isCollapsed ? 'Subject Matters' : ''}
                    className={({ isActive }) =>
                        `hidden w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-2xl text-gray-600 text-default opacity-90 transform transition-all duration-200 ease-in-out ${isActive ? " bg-white/35" : "hover:border hover:border-[#E2E2E2] "
                        } ${accessControl.subjectsMattersAccess ? '' : 'hidden'}`
                    }
                >
                    <GiGiftOfKnowledge size={21} />
                    {!isCollapsed && (
                        <span className="font-semibold text-sm sm:text-xl xl:text-2xl">Subject Matters</span>
                    )}
                </NavLink>

                <NavLink
                    to="/admin/user-management"
                    onClick={onClick}
                    title={isCollapsed ? 'User Management' : ''}
                    className={({ isActive }) =>
                        `w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-2xl text-gray-600 text-default opacity-90 transform transition-all duration-200 ease-in-out ${isActive ? " bg-white/35" : "hover:border hover:border-[#E2E2E2] "
                        } ${accessControl.userManagementAccess ? '' : 'hidden'}`
                    }
                >
                    <FiUsers size={21} />
                    {!isCollapsed && (
                        <span className="font-semibold text-sm sm:text-xl xl:text-2xl">User Management</span>
                    )}
                </NavLink>

                <NavLink
                    to="/admin/ai-training"
                    onClick={onClick}
                    title={isCollapsed ? 'AI Training' : ''}
                    className={({ isActive }) =>
                        `w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-2xl text-gray-600 text-default opacity-90 transform transition-all duration-200 ease-in-out ${isActive ? " bg-white/35" : "hover:border hover:border-[#E2E2E2] "
                        } ${accessControl.aiTrainingAccess ? '' : 'hidden'}`
                    }
                >
                    <LuBrainCircuit size={21} />
                    {!isCollapsed && (
                        <span className="font-semibold text-sm sm:text-xl xl:text-2xl">AI Training</span>
                    )}
                </NavLink>

                <NavLink
                    to="/admin/assessments"
                    onClick={onClick}
                    title={isCollapsed ? 'Assessments' : ''}
                    className={({ isActive }) =>
                        `w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-2xl text-gray-600 text-default opacity-90 transform transition-all duration-200 ease-in-out ${isActive ? " bg-white/35" : "hover:border hover:border-[#E2E2E2] "
                        } ${accessControl.assessmentAccess ? '' : 'hidden'}`
                    }
                >
                    <PiFilesThin size={21} />
                    {!isCollapsed && (
                        <span className="font-semibold text-sm sm:text-xl xl:text-2xl">Assessments</span>
                    )}
                </NavLink>

                <NavLink
                    to="/admin/settings"
                    onClick={onClick}
                    title={isCollapsed ? 'Settings' : ''}
                    className={({ isActive }) =>
                        `w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-2xl text-gray-600 text-default opacity-90 transform transition-all duration-200 ease-in-out ${isActive ? " bg-white/35" : "hover:border hover:border-[#E2E2E2] "
                        }`
                    }
                >
                    <FiSettings size={21} />
                    {!isCollapsed && (
                        <span className="font-semibold text-sm sm:text-xl xl:text-2xl">Settings</span>
                    )}
                </NavLink>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-teal-600">
                {onToggleCollapse && (
                    <button
                        onClick={onToggleCollapse}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-all"
                        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {isCollapsed ? (
                            <BsLayoutSidebarInset size={21} />
                        ) : (
                            <>
                                <TbLayoutSidebarFilled size={21} />
                                <span className="text-sm">Collapse</span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </aside>
    )
}
