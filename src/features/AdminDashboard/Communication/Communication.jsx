import React, { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiChevronRight, FiHash, FiMessageCircle, FiMessageSquare, FiPlus, FiSearch, FiUsers, FiX } from "react-icons/fi";
import ChatPanel from "./ChatPanel";
import CreateNewGroupModal from "../Communication/CreateNewGroupModal";
import CreateNewMessageModal from "../Communication/CreateNewMessageModal";
import { connectWebSocketForChatList } from "./ChatService";
import { useMutation, useQuery } from "@tanstack/react-query";
import axiosApi from "../../../service/axiosInstance";
import { queryClient } from "../../../main";
import { useDebouncedCallback } from "use-debounce";
import { base_URL } from "../../../config/Config";
import { getAuthData } from "../../../config/Config";
import { useLocation, useParams } from "react-router-dom";
import useGetUserProfile from "../../../hooks/useGetUserProfile";
import useUserPermissionsForOwn from "../../../hooks/useUserPermissionsForOwn";

import ReactMarkdown from 'react-markdown';
import privetPrfileImg from "../../../assets/privetProfile.png";
import groupPrfileImg from "../../../assets/groupProfile.png";
import GroupAvatar from "./GroupAvatar";
import { LuSparkles } from "react-icons/lu";
import useIsBelowMd from "../../../Components/hooks/useIsBelowMd";

const ASSISTANCE_TOPICS = [
    {
        name: "Front Desk",
        count: 5,
        tone: "amber",
        questions: [
            "Patient arrived 20 min late. What do I do?",
            "Patient missed their appointment. No-show protocol?",
            "How do I reschedule same-day?",
            "When do I collect the copay?",
            "How do I verify insurance for a walk-in?",
        ],
    },
    {
        name: "Clinical / Nursing",
        count: 3,
        tone: "violet",
        questions: [
            "How should I document a vitals concern?",
            "What should be escalated to the provider?",
            "How do I prepare a patient for triage?",
        ],
    },
    {
        name: "Compliance & Privacy",
        count: 3,
        tone: "sky",
        questions: [
            "Can I discuss PHI over voicemail?",
            "What do I do with a records request?",
            "How should I handle a privacy concern?",
        ],
    },
    {
        name: "Billing & Insurance",
        count: 3,
        tone: "emerald",
        questions: [
            "Medicare mismatch - how do I escalate?",
            "Patient has an outstanding balance. Can I refuse service?",
            "When should I NOT collect a copay?",
        ],
    },
];

const topicToneClasses = {
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    sky: "bg-sky-50 text-sky-600",
    emerald: "bg-emerald-50 text-emerald-600",
};

// Deterministic accent color per chat (used for initial-avatars, unread previews and badges)
const SIDEBAR_AVATAR_PALETTE = [
    { bg: "bg-[#e8552e]", text: "text-[#e8552e]" },
    { bg: "bg-[#f59e0b]", text: "text-[#f59e0b]" },
    { bg: "bg-[#8b5cf6]", text: "text-[#8b5cf6]" },
    { bg: "bg-[#64748b]", text: "text-[#64748b]" },
    { bg: "bg-[#a855f7]", text: "text-[#a855f7]" },
    { bg: "bg-[#3b9ae1]", text: "text-[#3b9ae1]" },
    { bg: "bg-[#10b981]", text: "text-[#10b981]" },
    { bg: "bg-[#ec4899]", text: "text-[#ec4899]" },
];

const getChatAvatarColor = (name) => {
    const key = name || "?";
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) {
        hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }
    return SIDEBAR_AVATAR_PALETTE[hash % SIDEBAR_AVATAR_PALETTE.length];
};

const getChatInitials = (name) => {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};



const Communication = ({ assistantOnly = false }) => {
    const isMobile = useIsBelowMd();
    const [activeTab, setActiveTab] = useState(assistantOnly ? "aiAssistant" : "allChat");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRole, setSelectedRole] = useState("All");
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [showCreateMessageModal, setShowCreateMessageModal] = useState(false);
    const [selectedChat, setSelectedChat] = useState(null);
    const [forwardedMessage, setForwardedMessage] = useState("");
    const [pendingForward, setPendingForward] = useState(null);
    const [templateSearch, setTemplateSearch] = useState("");
    const [assistantDraft, setAssistantDraft] = useState("");
    const [expandedTopic, setExpandedTopic] = useState("Front Desk");
    const [selectedTemplateQuestion, setSelectedTemplateQuestion] = useState("Patient arrived 20 min late. What do I do?");
    const [showNewConversationMenu, setShowNewConversationMenu] = useState(false);
    const [showRoleFilterMenu, setShowRoleFilterMenu] = useState(false);
    const [showMobileConversationList, setShowMobileConversationList] = useState(false);
    const [showMobileTopicSheet, setShowMobileTopicSheet] = useState(false);
    const [isMobileTopicSheetOpen, setIsMobileTopicSheetOpen] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState({});

    const roles = ["All", "private", "group"];
    const socketRef = useRef(null);
    const openedAiAssistantLocationRef = useRef("");
    const mobileTopicSheetCloseTimerRef = useRef(null);
    const location = useLocation();
    const { userId } = useParams();
    const { userId: authUserId } = getAuthData();
    const path = location.pathname.split('/')[2];
    const isAssistancePage = assistantOnly || path === "assistance";

    // Debounced search handler - prevents input from losing focus
    const handleSearchInput = useDebouncedCallback((value) => {
        setSearchQuery(value);
    }, 900);

    useEffect(() => () => {
        if (mobileTopicSheetCloseTimerRef.current) {
            clearTimeout(mobileTopicSheetCloseTimerRef.current);
        }
    }, []);

    useEffect(() => {
        setActiveTab(isAssistancePage ? "aiAssistant" : "allChat");
    }, [isAssistancePage]);

    //...................................Get User Profile Data.....................................\\
    const { userProfileData } = useGetUserProfile();

    // .....................................Fetch user permissions..................................\\
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
            (userProfileData?.role === "manager" && permissionData?.enabledPermissions?.includes("chat"))
        // ||
        // permissionData?.enabledPermissions?.includes("chat"), 
        ,

        blockAccess:
            userProfileData?.role === "owner" ||
            userProfileData?.role === "president" ||
            permissionData?.enabledPermissions?.includes("block_user"),
        clinicAccess:
            userProfileData?.role === "owner" ||
            userProfileData?.role === "president",

        subjectsMattersAccess:
            userProfileData?.role === "owner" ||
            userProfileData?.role === "president",
        assignedClinicsAccess:
            userProfileData?.role === "owner" ||
            userProfileData?.role === "president"
    };

    // ...................Fetch user's chat rooms list with filters.......................\\
    const { data: rooms = { read_only: false, ai_rooms: [], results: [] }, isLoading } = useQuery({
        queryKey: ["myRooms", authUserId, searchQuery, selectedRole, path, userId],
        queryFn: async () => {
            let url;

            if (path === "user-management") {
                // For user management, fetch rooms for user ID 15
                url = `/api/v1/users/${userId}/rooms/?q=${searchQuery}&type=${selectedRole === "All" ? "" : selectedRole}`;
            } else {
                // For other pages, fetch with search and filter
                url = `/api/v1/rooms/?q=${searchQuery}&type=${selectedRole === "All" ? "" : selectedRole}`;
            }

            const response = await axiosApi.get(url);
            return response.data;
        },
        keepPreviousData: true, // Smooth UX while loading new results
        staleTime: 1000 * 30, // Optional: reduce refetch frequency
    });


    // WebSocket for real-time room updates
    useEffect(() => {
        socketRef.current = connectWebSocketForChatList({
            onMessage: (message) => {
                if (message.type !== "room_update") return;

                // Invalidate all myRooms queries (including filtered ones)
                // This triggers a refetch with current searchQuery & selectedRole
                queryClient.invalidateQueries({
                    queryKey: ["myRooms"],
                    refetchType: "active", // Only refetch if query is active
                });
            },
        });

        return () => socketRef.current?.close();
    }, [queryClient]);

    // ............................................Ai Assistant Related Code...............................................\\
    // Here Create Rooms if not exists.......
    // Mutation to create AI room
    const createAiRoom = useMutation({
        mutationFn: async () => {
            const res = await axiosApi.post('/api/v1/rooms/ai/me/');
            return res.data;
        },
        onSuccess: () => {
            // Critical: Refresh the room list so the new AI room appears instantly
            queryClient.invalidateQueries({ queryKey: ["myRooms"] });
        },
    });

    // ======================================Auto-select chat room if coming from mention notification Click =======================================\\
    useEffect(() => {
        const roomIdFromNotification = location.state?.roomId;

        if (!isAssistancePage && roomIdFromNotification && rooms?.results && rooms.results.length > 0) {
            const matchingChat = rooms.results.find(
                (chat) => chat.room_id === roomIdFromNotification
            );
            if (matchingChat) {
                handleChatSelect(matchingChat);
                setActiveTab("allChat");
            }
        }
    }, [isAssistancePage, location, rooms?.results]);

    useEffect(() => {
        if (!isAssistancePage) return;
        const shouldOpenAi = location.state?.openAiAssistant;
        if (!shouldOpenAi || openedAiAssistantLocationRef.current === location.key) {
            return;
        }

        openedAiAssistantLocationRef.current = location.key;
        setActiveTab("aiAssistant");

        if (Array.isArray(rooms?.ai_rooms) && rooms.ai_rooms.length > 0) {
            setSelectedChat(rooms.ai_rooms[0]);
        }
    }, [isAssistancePage, location.key, location.state?.openAiAssistant, rooms?.ai_rooms]);

    useEffect(() => {
        if (!isAssistancePage) return;
        const shouldOpenAi = location.state?.openAiAssistant;
        const message = location.state?.forwardedMessage;

        if (shouldOpenAi && message) {
            setPendingForward(message);
        }
    }, [isAssistancePage, location.state?.openAiAssistant, location.state?.forwardedMessage]);

    useEffect(() => {
        if (!isAssistancePage) return;
        if (!pendingForward) return;
        setActiveTab("aiAssistant");

        if (Array.isArray(rooms?.ai_rooms) && rooms.ai_rooms.length > 0) {
            const aiChat = rooms.ai_rooms[0];
            if (!selectedChat || selectedChat.room_id !== aiChat.room_id) {
                setSelectedChat(aiChat);
            }
            setForwardedMessage(pendingForward);
            setPendingForward(null);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [isAssistancePage, pendingForward, rooms?.ai_rooms, selectedChat]);

    useEffect(() => {
        if (
            isAssistancePage &&
            activeTab === "aiAssistant" &&
            Array.isArray(rooms?.ai_rooms) &&
            rooms.ai_rooms.length === 0 &&
            !createAiRoom.isPending // Prevent duplicate calls
        ) {
            createAiRoom.mutate();
        }
    }, [isAssistancePage, activeTab, rooms?.ai_rooms, createAiRoom.isPending]);
    // ============================== Automatically select the AI room when switch All chat to Ai Assistance ============================\\
    useEffect(() => {
        if (!isAssistancePage) return;
        if (activeTab !== "aiAssistant") return;
        if (!Array.isArray(rooms?.ai_rooms) || rooms.ai_rooms.length === 0) return;

        const firstAiRoom = rooms.ai_rooms[0];
        if (selectedChat?.room_id !== firstAiRoom.room_id) {
            setSelectedChat(firstAiRoom);
        }
    }, [isAssistancePage, activeTab, rooms?.ai_rooms, selectedChat?.room_id]);

    useEffect(() => {
        if (isAssistancePage) return;
        if (isMobile) return;
        if (activeTab !== "allChat") return;
        if (!Array.isArray(rooms?.results) || rooms.results.length === 0) return;

        const currentRoomExists = rooms.results.some(
            (chat) => chat.room_id === selectedChat?.room_id
        );

        if (!selectedChat || !currentRoomExists) {
            setSelectedChat(rooms.results[0]);
        }
    }, [isAssistancePage, isMobile, activeTab, rooms?.results, selectedChat?.room_id]);



    const handleChatSelect = (chat) => {
        setSelectedChat(chat ?? null);
    };

    const handleRoleFilterChange = (role) => {
        setSelectedRole(role);
    };

    const getRoleLabel = (role) => {
        if (role === "All") return "All";
        return role.charAt(0).toUpperCase() + role.slice(1);
    };

    const handleDirectRoomCreated = (roomId) => {
        if (!roomId) return;

        setActiveTab("allChat");

        const existingRoom = Array.isArray(rooms?.results)
            ? rooms.results.find((chat) => chat.room_id === roomId)
            : null;

        if (existingRoom) {
            setSelectedChat(existingRoom);
            return;
        }

        setSelectedChat({ room_id: roomId, type: "private" });
    };

    // Format last message time
    const formatChatTime = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        const time = date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
        const day = date.toLocaleDateString("en-GB");
        return `${time} · ${day}`;
    };

    const formatChatListTime = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        const diffMs = Date.now() - date.getTime();
        const diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));

        if (diffMinutes < 1) return "now";
        if (diffMinutes < 60) return `${diffMinutes}m`;

        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours}h`;

        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d`;

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    const teamRooms = Array.isArray(rooms?.results) ? rooms.results : [];
    const channelRooms = teamRooms.filter((chat) => chat?.type !== "private");
    const directRooms = teamRooms.filter((chat) => chat?.type === "private");
    const isLoadingAndEmpty = isAssistancePage && isLoading && (!Array.isArray(rooms?.results) || rooms.results.length === 0);

    const filteredTopics = ASSISTANCE_TOPICS.map((topic) => ({
        ...topic,
        questions: topic.questions.filter((question) =>
            question.toLowerCase().includes(templateSearch.toLowerCase()) ||
            topic.name.toLowerCase().includes(templateSearch.toLowerCase())
        ),
    })).filter((topic) => !templateSearch || topic.questions.length > 0);

    const openMobileTopicSheet = () => {
        if (mobileTopicSheetCloseTimerRef.current) {
            clearTimeout(mobileTopicSheetCloseTimerRef.current);
        }
        setTemplateSearch("");
        setExpandedTopic("");
        setShowMobileTopicSheet(true);
        requestAnimationFrame(() => setIsMobileTopicSheetOpen(true));
    };

    const closeMobileTopicSheet = () => {
        setIsMobileTopicSheetOpen(false);
        if (mobileTopicSheetCloseTimerRef.current) {
            clearTimeout(mobileTopicSheetCloseTimerRef.current);
        }
        mobileTopicSheetCloseTimerRef.current = setTimeout(() => {
            setShowMobileTopicSheet(false);
            mobileTopicSheetCloseTimerRef.current = null;
        }, 280);
    };

    const handleTemplateQuestionSelect = (question) => {
        setSelectedTemplateQuestion(question);
        setAssistantDraft(question);
        closeMobileTopicSheet();
    };

    const hasValidImage = (value) =>
        typeof value === "string" && value.trim().length > 0;

    const getPrivateImageSrc = (chat) => {
        if (hasValidImage(chat?.image)) return `${base_URL}${chat.image}`;
        return privetPrfileImg;
    };

    const renderChatAvatar = (chat) => {
        if (!chat) return null;

        if (chat?.type === "group") {
            if (hasValidImage(chat?.image)) {
                return (
                    <img
                        src={`${base_URL}${chat.image}`}
                        alt={chat.name}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                );
            }

            return (
                <GroupAvatar
                    members={chat?.members}
                    baseUrl={base_URL}
                    fallbackSrc={groupPrfileImg}
                />
            );
        }

        return (
            <img
                src={getPrivateImageSrc(chat)}
                alt={chat.name}
                className="w-10 h-10 rounded-full object-cover"
            />
        );
    };

    const renderConversationRow = (chat) => {
        const isSelected = selectedChat?.room_id === chat.room_id;
        const preview = chat?.last_message?.text || "No messages yet";
        const unread = chat?.unseen_count || 0;
        const color = getChatAvatarColor(chat?.name);
        const imgSrc = hasValidImage(chat?.image) ? `${base_URL}${chat.image}` : null;

        return (
            <button
                key={chat.room_id}
                type="button"
                onClick={() => {
                    handleChatSelect(chat);
                    setShowMobileConversationList(false);
                }}
                className={`group flex w-full items-center gap-3 rounded-xl px-0 py-3 text-left transition md:px-2.5 md:py-2.5 ${isSelected
                    ? "md:bg-[#eef1f6]"
                    : "hover:bg-[#f5f7fa]"
                }`}
            >
                <div className="relative shrink-0">
                    {imgSrc ? (
                        <img src={imgSrc} alt={chat.name} className="h-10 w-10 rounded-full object-cover md:h-11 md:w-11" />
                    ) : (
                        <span className={`grid h-10 w-10 place-items-center rounded-full text-[13px] font-semibold text-white md:h-11 md:w-11 md:text-sm ${color.bg}`}>
                            {getChatInitials(chat?.name)}
                        </span>
                    )}
                    {chat?.is_online && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#22c55e]" />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <h4 className="truncate text-[14px] font-semibold text-[#1f2430] md:text-[15px]">{chat.name}</h4>
                        <span className="shrink-0 text-[10px] font-medium text-[#9aa4b2] md:text-[11px]">
                            {formatChatListTime(chat?.last_message?.created_at)}
                        </span>
                    </div>
                    <div className={`mt-0.5 min-w-0 truncate text-[12.5px] leading-5 md:text-[13px] ${unread > 0 ? `font-semibold ${color.text}` : "font-medium text-[#94a0b0]"}`}>
                        <ReactMarkdown components={{ p: ({ children }) => <span>{children}</span> }}>
                            {preview}
                        </ReactMarkdown>
                    </div>
                </div>

                {unread > 0 && (
                    <span className={`grid h-[18px] min-w-[18px] shrink-0 place-items-center rounded-full px-1.5 text-[10px] font-semibold text-white md:h-5 md:min-w-5 ${color.bg}`}>
                        {unread > 99 ? "99+" : unread}
                    </span>
                )}
            </button>
        );
    };

    const renderRoomSection = (title, count, roomsForSection) => {
        const meta = title === "Channels"
            ? { icon: <FiHash size={13} />, text: "text-[#3b6fd6]", pill: "bg-[#e9f0ff] text-[#3b6fd6]" }
            : { icon: <FiMessageCircle size={13} />, text: "text-[#7c3aed]", pill: "bg-[#f1ebfe] text-[#7c3aed]" };
        const collapsed = Boolean(collapsedSections[title]);

        return (
            <section className="border-t border-[#eef1f5] pt-4 first:pt-4 md:pt-3 md:first:border-t-0 md:first:pt-1">
                <button
                    type="button"
                    onClick={() => setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }))}
                    className="flex w-full items-center justify-between rounded-lg px-0 py-1 transition hover:bg-[#f7f8fa] md:px-1"
                >
                    <span className="flex items-center gap-1.5">
                        <span className={meta.text}>{meta.icon}</span>
                        <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${meta.text}`}>{title}</span>
                    </span>
                    <span className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.pill}`}>{count}</span>
                        <FiChevronDown size={16} className={`text-[#9aa4b2] transition-transform ${collapsed ? "" : "rotate-180"}`} />
                    </span>
                </button>
                {!collapsed && (
                    <div className="mt-1 space-y-0 md:space-y-0.5">
                        {roomsForSection.map(renderConversationRow)}
                    </div>
                )}
            </section>
        );
    };

    if (isLoadingAndEmpty) {
        return (
            <div className="container mx-auto">
                <section className="text-secondary mb-8">
                    <h2 className="text-2xl font-semibold lg:text-3xl">{isAssistancePage ? "Assistance" : "Communication Hub"}</h2>
                    <p className="text-lg opacity-80">{isAssistancePage ? "Chat with your AI assistant" : "Chat with your team"}</p>
                </section>
                <div className="flex justify-center items-center h-[calc(100vh-280px)]">
                    <p className="text-gray-500">{isAssistancePage ? "Loading assistant..." : "Loading chat rooms..."}</p>
                </div>
            </div>
        );
    }


    return (
        <div className={isAssistancePage ? "h-full min-h-0 w-full" : "h-full min-h-0"}>

            {isAssistancePage && (
                <section className="flex h-full min-h-0 bg-[#eef2f8] md:h-[calc(100dvh-1.75rem)]">
                    <aside className="hidden h-full w-[286px] shrink-0 flex-col border-r border-[#dfe3ea] bg-white md:flex">
                        <div className="border-b border-[#edf1f7] px-4 py-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#2B76F4]">Browse Topics</p>
                            <h2 className="mt-1 text-base font-semibold text-[#111827]">Question Templates</h2>
                        </div>

                        <div className="px-4 py-4">
                            <div className="relative">
                                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#91a0b8]" />
                                <input
                                    value={templateSearch}
                                    onChange={(event) => setTemplateSearch(event.target.value)}
                                    placeholder="Search questions..."
                                    className="h-11 w-full rounded-xl border border-transparent bg-[#f1f3f6] pl-10 pr-3 text-sm font-medium text-[#172033] outline-none transition placeholder:text-[#9aa8bd] focus:border-[#d9e1ec] focus:bg-white"
                                />
                            </div>
                        </div>

                        <div className="thin-scroll flex-1 overflow-y-auto px-4 pb-4">
                            {filteredTopics.map((topic) => {
                                const isExpanded = expandedTopic === topic.name;

                                return (
                                <div key={topic.name} className="mb-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setExpandedTopic((currentTopic) => {
                                                const nextTopic = currentTopic === topic.name ? "" : topic.name;
                                                if (nextTopic) {
                                                    setSelectedTemplateQuestion(topic.questions[0] || "");
                                                }
                                                return nextTopic;
                                            });
                                        }}
                                        className="mb-1 flex w-full items-center justify-between gap-3 rounded-lg px-0 py-1.5 text-left transition hover:text-[#2B76F4]"
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            <span className={`grid h-5 w-5 place-items-center rounded-md text-[11px] font-semibold ${topicToneClasses[topic.tone]}`}>
                                                #
                                            </span>
                                            <h3 className="truncate text-sm font-semibold text-[#33404f]">{topic.name}</h3>
                                        </div>
                                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${topicToneClasses[topic.tone]}`}>
                                            {topic.count}
                                        </span>
                                    </button>

                                    {isExpanded && (
                                    <div className="space-y-0">
                                        {topic.questions.map((question) => (
                                            <button
                                                key={question}
                                                type="button"
                                                onClick={() => handleTemplateQuestionSelect(question)}
                                                className={`group flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] font-normal leading-5 transition hover:text-[#5b6675] ${selectedTemplateQuestion === question
                                                    ? "text-[#5b6675]"
                                                    : "text-[#9aa4b2]"
                                                }`}
                                            >
                                                <span className="mt-0.5 text-[#c6cdd8] transition group-hover:text-[#8b97a8]">&gt;</span>
                                                <span>{question}</span>
                                            </button>
                                        ))}
                                    </div>
                                    )}
                                </div>
                                );
                            })}
                        </div>

                        <div className="border-t border-[#edf1f7] p-4">
                            <div className="flex h-9 items-center gap-2 rounded-xl border border-[#bad0ff] bg-[#eef4ff] px-3 text-xs font-semibold text-[#2B76F4]">
                                <LuSparkles className="h-4 w-4" />
                                AI-powered clinic assistant
                            </div>
                        </div>
                    </aside>

                    <main className="h-full min-h-0 min-w-0 flex-1">
                        <ChatPanel
                            chatRoom={selectedChat?.room_id ?? rooms?.ai_rooms?.[0]?.room_id ?? null}
                            roomType={selectedChat?.type ?? rooms?.ai_rooms?.[0]?.type ?? "ai"}
                            activeTab="aiAssistant"
                            avatar={selectedChat?.image ?? rooms?.ai_rooms?.[0]?.image ?? null}
                            avatarNode={renderChatAvatar(selectedChat ?? rooms?.ai_rooms?.[0])}
                            forwardedMessage={forwardedMessage}
                            onForwardConsumed={() => setForwardedMessage("")}
                            draftMessage={assistantDraft}
                            onDraftConsumed={() => setAssistantDraft("")}
                            onOpenTopics={openMobileTopicSheet}
                        />
                    </main>

                    {showMobileTopicSheet && (
                        <div className="fixed inset-x-0 top-0 bottom-[72px] z-40 md:hidden">
                            <button
                                type="button"
                                className={`absolute inset-0 bg-slate-950/28 backdrop-blur-sm transition-opacity duration-300 ease-out ${isMobileTopicSheetOpen ? "opacity-100" : "opacity-0"}`}
                                onClick={closeMobileTopicSheet}
                                aria-label="Close topics"
                            />
                            <div className={`absolute inset-x-0 bottom-0 max-h-[72dvh] overflow-hidden rounded-t-[28px] bg-white shadow-[0_-24px_64px_rgba(15,23,42,0.22)] transition-transform duration-300 ease-out will-change-transform ${isMobileTopicSheetOpen ? "translate-y-0" : "translate-y-full"}`}>
                                <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[#d8e1ec]" />
                                <div className="flex items-start justify-between gap-4 border-b border-[#edf1f7] px-7 pb-4 pt-4">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#2B76F4]">Browse Topics</p>
                                        <h2 className="mt-1 text-base font-semibold leading-5 text-[#111827]">Question Templates</h2>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeMobileTopicSheet}
                                        className="grid h-8 w-8 place-items-center rounded-full text-[#8da0ba] transition hover:bg-[#f3f6fb] hover:text-[#172033]"
                                        aria-label="Close question templates"
                                    >
                                        <FiX size={18} />
                                    </button>
                                </div>

                                <div className="px-7 py-3">
                                    <div className="relative">
                                        <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#91a0b8]" />
                                        <input
                                            value={templateSearch}
                                            onChange={(event) => setTemplateSearch(event.target.value)}
                                            placeholder="Search questions..."
                                            className="h-10 w-full rounded-xl border border-[#dfe4eb] bg-[#f6f7f9] pl-10 pr-3 text-sm font-medium text-[#172033] outline-none transition placeholder:text-[#9aa8bd] focus:border-[#cfe0ff] focus:bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="thin-scroll max-h-[calc(72dvh-156px)] overflow-y-auto px-7 pb-5">
                                    {filteredTopics.map((topic) => {
                                        const isExpanded = expandedTopic === topic.name || Boolean(templateSearch);

                                        return (
                                            <div key={topic.name} className="border-b border-transparent">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setExpandedTopic((currentTopic) => currentTopic === topic.name ? "" : topic.name);
                                                    }}
                                                    className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-0 text-left transition hover:text-[#2B76F4]"
                                                >
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <span className={`grid h-5 w-5 place-items-center rounded-md text-[11px] font-semibold ${topicToneClasses[topic.tone]}`}>
                                                            #
                                                        </span>
                                                        <h3 className="truncate text-sm font-semibold text-[#33404f]">{topic.name}</h3>
                                                    </div>
                                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${topicToneClasses[topic.tone]}`}>
                                                        {topic.count}
                                                    </span>
                                                </button>

                                                {isExpanded && topic.questions.length > 0 && (
                                                    <div className="pb-2 pl-8">
                                                        {topic.questions.map((question) => (
                                                            <button
                                                                key={question}
                                                                type="button"
                                                                onClick={() => handleTemplateQuestionSelect(question)}
                                                                className={`block w-full rounded-lg px-2 py-2 text-left text-[13px] font-medium leading-5 transition hover:bg-[#f6f8fb] hover:text-[#2B76F4] ${selectedTemplateQuestion === question
                                                                    ? "text-[#2B76F4]"
                                                                    : "text-[#6b7890]"
                                                                }`}
                                                            >
                                                                {question}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            )}

            {!isAssistancePage && (
            <section className="flex h-full min-h-0 flex-col bg-[#eef2f8] md:h-[calc(100dvh-1.75rem)] md:flex-row">
                <aside className={`${showMobileConversationList || !selectedChat ? "flex" : "hidden"} h-full w-full shrink-0 flex-col border-r border-[#dfe3ea] bg-white md:flex md:w-[340px]`}>
                    <div className="border-b-0 border-[#edf1f7] px-5 pb-3 pt-5 md:border-b md:py-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-[22px] font-semibold leading-tight text-[#1b2030]">Team Chat</h2>
                                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8da0ba] md:hidden">
                                    All Channels
                                </p>
                                <p className="mt-1.5 hidden items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8da0ba] md:flex">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
                                    Live communication
                                </p>
                            </div>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowNewConversationMenu((value) => !value)}
                                    className="grid h-9 w-9 place-items-center rounded-full bg-[#f1f3f6] text-[#5b6473] transition hover:bg-[#e6e9ef]"
                                    title="New conversation"
                                >
                                    <FiPlus size={18} />
                                </button>
                                {showNewConversationMenu && (
                                    <div className="absolute right-0 top-12 z-30 w-56 overflow-hidden rounded-2xl border border-[#e3e9f2] bg-white py-2 shadow-[0_18px_44px_rgba(15,23,42,0.16)]">
                                        <p className="px-4 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9aa8bd]">New conversation</p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCreateMessageModal(true);
                                                setShowNewConversationMenu(false);
                                            }}
                                            className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[#172033] transition hover:bg-[#f6f8fb] ${path === "user-management" ? "hidden" : ""}`}
                                        >
                                            <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-600">
                                                <FiMessageSquare size={17} />
                                            </span>
                                            Direct Message
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCreateGroupModal(true);
                                                setShowNewConversationMenu(false);
                                            }}
                                            className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[#172033] transition hover:bg-[#f6f8fb] ${path === "user-management" || !accessControl?.communicationAccess ? "hidden" : ""}`}
                                        >
                                            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                                                <FiUsers size={17} />
                                            </span>
                                            New Group
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 border-b border-[#edf1f7] px-4 pb-4 pt-2 md:py-4">
                        <div className="relative">
                            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#91a0b8]" />
                            <input
                                type="text"
                                placeholder="Search chats..."
                                defaultValue={searchQuery}
                                onChange={(e) => handleSearchInput(e.target.value)}
                                className="h-9 w-full rounded-xl border border-[#e1e4e8] bg-[#f7f7f8] pl-10 pr-3 text-sm font-medium text-[#172033] outline-none transition placeholder:text-[#8da0ba] focus:border-[#d9e1ec] focus:bg-white md:h-11 md:border-transparent md:bg-[#f1f3f6]"
                            />
                        </div>
                        <div className="relative hidden md:block">
                            <button
                                type="button"
                                onClick={() => setShowRoleFilterMenu((value) => !value)}
                                className="flex h-10 w-full items-center justify-between rounded-xl border border-[#dbe3ef] bg-white px-3 text-left shadow-sm transition hover:border-[#c8d4e4] focus:border-[#2B76F4] focus:outline-none focus:ring-4 focus:ring-blue-100"
                            >
                                <span className="flex min-w-0 items-center gap-2">
                                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8da0ba]">View</span>
                                    <span className="truncate text-sm font-semibold text-[#172033]">{getRoleLabel(selectedRole)}</span>
                                </span>
                                <FiChevronDown
                                    className={`shrink-0 text-[#74839f] transition-transform ${showRoleFilterMenu ? "rotate-180" : ""}`}
                                    size={17}
                                />
                            </button>

                            {showRoleFilterMenu && (
                                <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-2xl border border-[#dfe7f2] bg-white p-1.5 shadow-[0_18px_42px_rgba(15,23,42,0.14)]">
                                    {roles.map((role) => {
                                        const isActive = selectedRole === role;

                                        return (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => {
                                                    handleRoleFilterChange(role);
                                                    setShowRoleFilterMenu(false);
                                                }}
                                                className={`flex h-9 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-semibold transition ${isActive
                                                    ? "bg-[#eef4ff] text-[#2B76F4]"
                                                    : "text-[#526174] hover:bg-[#f6f8fb] hover:text-[#172033]"
                                                }`}
                                            >
                                                <span>{getRoleLabel(role)}</span>
                                                {isActive && <span className="h-2 w-2 rounded-full bg-[#2B76F4]" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="thin-scroll flex-1 space-y-0 overflow-y-auto px-4 pb-5 pt-0 md:space-y-1 md:px-3 md:py-3">
                        {isLoading ? (
                            <div className="rounded-2xl border border-[#e3e9f2] bg-[#f8fafc] px-4 py-8 text-center text-sm font-semibold text-[#73829a]">
                                Loading conversations...
                            </div>
                        ) : teamRooms.length === 0 ? (
                            <div className="rounded-2xl border border-[#e3e9f2] bg-[#f8fafc] px-4 py-8 text-center">
                                <p className="text-sm font-semibold text-[#172033]">No conversations found</p>
                                <p className="mt-1 text-xs font-medium text-[#73829a]">Start a direct message or create a group.</p>
                            </div>
                        ) : (
                            <>
                                {channelRooms.length > 0 && renderRoomSection("Channels", channelRooms.length, channelRooms)}
                                {directRooms.length > 0 && renderRoomSection("Direct Messages", directRooms.length, directRooms)}
                            </>
                        )}
                    </div>
                </aside>

                <main className={`${showMobileConversationList || !selectedChat ? "hidden md:block" : "block"} h-full min-h-0 min-w-0 flex-1`}>
                    <ChatPanel
                        chatRoom={selectedChat?.room_id ?? null}
                        roomType={selectedChat?.type ?? null}
                        activeTab={activeTab}
                        avatar={selectedChat?.image ?? null}
                        avatarNode={renderChatAvatar(selectedChat)}
                        forwardedMessage={forwardedMessage}
                        onForwardConsumed={() => setForwardedMessage("")}
                        onBackToList={() => setShowMobileConversationList(true)}
                    />
                </main>

                {/* Modals */}
                {showCreateGroupModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
                        <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.24)]">
                            <CreateNewGroupModal onClose={() => setShowCreateGroupModal(false)} />
                        </div>
                    </div>
                )}

                {showCreateMessageModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
                        <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.24)] lg:max-w-3xl xl:max-w-5xl">
                            <CreateNewMessageModal
                                onClose={() => setShowCreateMessageModal(false)}
                                onChatCreated={handleDirectRoomCreated}
                            />
                        </div>
                    </div>
                )}
            </section>
            )}
        </div>
    );
};

export default Communication;
