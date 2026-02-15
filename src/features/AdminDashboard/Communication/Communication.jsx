import React, { useEffect, useRef, useState } from "react";
import { FiSearch } from "react-icons/fi";
import ChatPanel from "./ChatPanel";
import CreateNewGroupModal from "../Communication/CreateNewGroupModal";
import CreateNewMessageModal from "../Communication/CreateNewMessageModal";
import { connectWebSocketForChatList } from "./ChatService";
import { useMutation, useQuery } from "@tanstack/react-query";
import axiosApi from "../../../service/axiosInstance";
import { queryClient } from "../../../main";
import { useDebouncedCallback } from "use-debounce";
import { base_URL } from "../../../config/Config";
import { useLocation, useParams } from "react-router-dom";
import useGetUserProfile from "../../../hooks/useGetUserProfile";
import useUserPermissionsForOwn from "../../../hooks/useUserPermissionsForOwn";

import ReactMarkdown from 'react-markdown';
import privetPrfileImg from "../../../assets/privetProfile.png";
import groupPrfileImg from "../../../assets/groupProfile.png";
import GroupAvatar from "./GroupAvatar";



const Communication = () => {
    const [activeTab, setActiveTab] = useState("allChat");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRole, setSelectedRole] = useState("All");
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [showCreateMessageModal, setShowCreateMessageModal] = useState(false);
    const [selectedChat, setSelectedChat] = useState(null);
    const [forwardedMessage, setForwardedMessage] = useState("");
    const [pendingForward, setPendingForward] = useState(null);

    const roles = ["All", "private", "group"];
    const socketRef = useRef(null);
    const location = useLocation();
    const { userId } = useParams();
    const path = location.pathname.split('/')[2];

    // console.log("Im From Communication. My Location :---------", location.pathname)
    console.log("Im From Communication. My Location :---------==============================", location)

    // Debounced search handler - prevents input from losing focus
    const handleSearchInput = useDebouncedCallback((value) => {
        setSearchQuery(value);
    }, 900);

    //...................................Get User Profile Data.....................................\\
    const { userProfileData } = useGetUserProfile();
    console.log(userProfileData?.role);

    // .....................................Fetch user permissions..................................\\
    const { data: permissionData, isLoading: isLoadingPermission, isError: isErrorPermission } = useUserPermissionsForOwn();
    console.log("Permission:********************************************", permissionData?.enabledPermissions
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

    console.log(accessControl);


    // ...................Fetch user's chat rooms list with filters.......................\\
    const { data: rooms = { read_only: false, ai_rooms: [], results: [] }, isLoading } = useQuery({
        queryKey: ["myRooms", searchQuery, selectedRole, path, userId],
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
            console.log("%%%%%%%%%%%%%%1", response.data)
            return response.data;
        },
        keepPreviousData: true, // Smooth UX while loading new results
        staleTime: 1000 * 30, // Optional: reduce refetch frequency
    });
    console.log("-----------------=============================================---", rooms)


    // WebSocket for real-time room updates
    useEffect(() => {
        socketRef.current = connectWebSocketForChatList({
            onMessage: (message) => {
                if (message.type !== "room_update") return;

                console.log("Room update received:", message);

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
        onSuccess: (data) => {
            console.log("AI chat room created successfully:", data);
            // Critical: Refresh the room list so the new AI room appears instantly
            queryClient.invalidateQueries({ queryKey: ["myRooms"] });
        },
        onError: (error) => {
            console.error("Failed to create AI chat room:", error);
            // Optional: toast.error("Could not load AI Assistant");
        },
    });

    // ======================================Auto-select chat room if coming from mention notification Click =======================================\\
    useEffect(() => {
        const roomIdFromNotification = location.state?.roomId;
        const messageIdFromNotification = location.state?.messageId;

        console.log("🔔 Notification state detected:", { roomIdFromNotification, messageIdFromNotification });

        if (roomIdFromNotification && rooms?.results && rooms.results.length > 0) {
            const matchingChat = rooms.results.find(
                (chat) => chat.room_id === roomIdFromNotification
            );
            if (matchingChat) {
                console.log("✅ Auto-selecting chat from notification:", matchingChat);
                handleChatSelect(matchingChat);
                setActiveTab("allChat");
            } else {
                console.warn("⚠️ Matching chat not found for roomId:", roomIdFromNotification);
            }
        }
    }, [location, rooms?.results]);

    useEffect(() => {
        const shouldOpenAi = location.state?.openAiAssistant;
        const message = location.state?.forwardedMessage;
        if (shouldOpenAi && message) {
            setPendingForward(message);
        }
    }, [location.state?.openAiAssistant, location.state?.forwardedMessage]);

    useEffect(() => {
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
    }, [pendingForward, rooms?.ai_rooms, selectedChat]);

    useEffect(() => {
        if (
            activeTab === "aiAssistant" &&
            Array.isArray(rooms?.ai_rooms) &&
            rooms.ai_rooms.length === 0 &&
            !createAiRoom.isPending // Prevent duplicate calls
        ) {
            console.log("No AI room found → creating one automatically...");
            createAiRoom.mutate();
        }
    }, [activeTab, rooms?.ai_rooms, createAiRoom.isPending]);



    const handleChatSelect = (chat) => {
        setSelectedChat(chat ?? null);
        console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@", chat)
    };

    const handleRoleFilterChange = (role) => {
        setSelectedRole(role);
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

    const isLoadingAndEmpty = isLoading && (!Array.isArray(rooms?.results) || rooms.results.length === 0);

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
    if (isLoadingAndEmpty) {
        return (
            <div className="container mx-auto">
                <section className="text-secondary mb-8">
                    <h2 className="text-2xl lg:text-3xl font-bold">Communication Hub</h2>
                    <p className="text-lg opacity-80">Chat with your team and AI assistant</p>
                </section>
                <div className="flex justify-center items-center h-[calc(100vh-280px)]">
                    <p className="text-gray-500">Loading chat rooms...</p>
                </div>
            </div>
        );
    }


    return (
        <div className=" mx-auto">
            {/* Header */}
            <section className="text-secondary mb-2">
                <h2 className="text-2xl lg:text-3xl font-bold">Communication Hub</h2>
                <p className="text-lg opacity-80">Chat with your team and AI assistant</p>
            </section>

            {/* Main Layout */}
            <section className="flex gap-6 h-[calc(100vh-190px)]">
                {/* ......................Sidebar.................... */}
                <section className="w-[40%] xl:w-[25%] h-full bg-white/70 rounded-xl shadow-md p-4 space-y-4 border border-gray-300">
                    {/* Tabs */}
                    <div className="flex justify-between gap-3 pb-2">
                        <button
                            onClick={() => setActiveTab("allChat")}
                            className={`pb-1 font-medium ${activeTab === "allChat"
                                ? "text-primary border-b-2 border-primary"
                                : "text-gray-600 hover:text-primary"
                                }`}
                        >
                            All Chat
                        </button>
                        <button
                            onClick={() => setActiveTab("aiAssistant")}
                            className={`pb-1 font-medium ${activeTab === "aiAssistant"
                                ? "text-primary border-b-2 border-primary"
                                : "text-gray-600 hover:text-primary"
                                }`}
                        >
                            AI Assistant
                        </button>
                    </div>

                    {/* New Group / New Message Buttons */}
                    <div className={`${activeTab === "allChat" ? "" : "hidden"} flex justify-between gap-3 pb-2`}>
                        <button
                            onClick={() => setShowCreateGroupModal(true)}
                            className={`pb-1 font-medium text-primary border-2 rounded-lg px-2 border-primary ${path === "user-management" ? "hidden" : ""} ${accessControl?.communicationAccess ? "" : "hidden"}`}
                        >
                            New Group
                        </button>
                        <button
                            onClick={() => setShowCreateMessageModal(true)}
                            className={`pb-1 font-medium text-primary border-2 rounded-lg px-2 border-primary ${path === "user-management" ? "hidden" : ""}`}
                        >
                            New Message
                        </button>
                    </div>

                    {/* Search + Filter */}
                    <div className={`flex items-center gap-2 ${activeTab === "allChat" ? "" : "hidden"}`}>
                        <div className="relative flex-1">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search chat..."
                                defaultValue={searchQuery}
                                onChange={(e) => handleSearchInput(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 rounded-lg text-sm focus:outline-none bg-gray-200"
                            />
                        </div>
                        <select
                            value={selectedRole}
                            onChange={(e) => handleRoleFilterChange(e.target.value)}
                            className="border border-gray-300 rounded-lg px-2 py-2 text-sm"
                        >
                            {roles.map((role) => (
                                <option key={role} value={role}>
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* ........................Chat List.......................... */}
                    <div className={`space-y-2 overflow-auto h-[calc(100vh-440px)] `}>


                        <div className={`text-center text-gray-500 ${activeTab === "aiAssistant" ? "" : "hidden"}`}>
                            <div className={`${activeTab === "aiAssistant" ? "" : "hidden"}`}>
                                {(!Array.isArray(rooms?.ai_rooms) || rooms.ai_rooms.length === 0) ? (
                                    <p className="text-center text-gray-500 py-10">No chats found</p>
                                ) : (
                                    rooms.ai_rooms
                                        .map((chat) => (
                                            <button
                                                key={chat.room_id}
                                                onClick={() => handleChatSelect(chat)}
                                                className={`flex items-center gap-3 w-full p-2 rounded-lg text-left hover:bg-gray-100 transition max-h-[100px] overflow-hidden ${selectedChat?.room_id === chat.room_id ? "bg-gray-200" : ""
                                                    }`}
                                            >
                                                <div className="relative">
                                                    {chat?.type === "group" ? (
                                                        hasValidImage(chat?.image) ? (
                                                            <img
                                                                src={`${base_URL}${chat.image}`}
                                                                alt={chat.name}
                                                                className="w-10 h-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <GroupAvatar
                                                                members={chat?.members}
                                                                baseUrl={base_URL}
                                                                fallbackSrc={groupPrfileImg}
                                                            />
                                                        )
                                                    ) : (
                                                        <img
                                                            src={getPrivateImageSrc(chat)}
                                                            alt={chat.name}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    )}
                                                    {chat?.is_online && (
                                                        <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-green-500"></span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="font-medium text-sm truncate">{chat.name}</h4>
                                                        <span className="text-xs text-gray-400">
                                                            {formatChatTime(chat?.last_message?.created_at)}
                                                        </span>
                                                    </div>
                                                    <p className={`text-xs text-gray-600 truncate ${chat?.unseen_count > 0 ? "font-bold" : ""}`}>

                                                        {/* {chat?.last_message?.text || "No messages yet"} */}
                                                        <ReactMarkdown>
                                                            {chat?.last_message?.text || "No messages yet"}
                                                        </ReactMarkdown>

                                                    </p>

                                                </div>
                                                {chat?.unseen_count > 0 && (
                                                    <span className="relative w-6 h-6 flex items-center justify-center text-xs rounded-full bg-green-500 text-white font-semibold">
                                                        {chat.unseen_count > 99 ? "99+" : chat.unseen_count}
                                                    </span>
                                                )}
                                            </button>
                                        ))
                                )}
                            </div>
                        </div>
                        {/* ......................... */}
                        <div className={`${activeTab === "allChat" ? "" : "hidden"}`}>
                            {(!Array.isArray(rooms?.results) || rooms.results.length === 0) ? (
                                <p className="text-center text-gray-500 py-10">No chats found</p>
                            ) : (
                                rooms.results
                                    .map((chat) => (
                                        <button
                                            key={chat.room_id}
                                            onClick={() => handleChatSelect(chat)}
                                            className={`flex items-center gap-3 w-full p-2 rounded-lg text-left hover:bg-gray-100 transition  ${selectedChat?.room_id === chat.room_id ? "bg-gray-200" : ""
                                                }`}
                                        >
                                            <div className="relative">
                                                {chat?.type === "group" ? (
                                                    hasValidImage(chat?.image) ? (
                                                        <img
                                                            src={`${base_URL}${chat.image}`}
                                                            alt={chat.name}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <GroupAvatar
                                                            members={chat?.members}
                                                            baseUrl={base_URL}
                                                            fallbackSrc={groupPrfileImg}
                                                        />
                                                    )
                                                ) : (
                                                    <img
                                                        src={getPrivateImageSrc(chat)}
                                                        alt={chat.name}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                )}
                                                {chat?.is_online && (
                                                    <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-green-500"></span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="font-medium text-sm truncate">{chat.name}</h4>
                                                    <span className="text-xs text-gray-400">
                                                        {formatChatTime(chat?.last_message?.created_at)}
                                                    </span>
                                                </div>
                                                <p className={`text-xs text-gray-600 truncate max-h-[30px] ${chat?.unseen_count > 0 ? "font-bold" : ""}`}>
                                                    {/* {chat?.last_message?.text || "No messages yet"} */}
                                                    <ReactMarkdown>
                                                        {chat?.last_message?.text || "No messages yet"}
                                                    </ReactMarkdown>
                                                </p>
                                            </div>
                                            {chat?.unseen_count > 0 && (
                                                <span className="relative w-6 h-6 flex items-center justify-center text-xs rounded-full bg-green-500 text-white font-semibold">
                                                    {chat.unseen_count > 99 ? "99+" : chat.unseen_count}
                                                </span>
                                            )}
                                        </button>
                                    ))
                            )}
                        </div>
                    </div>






                </section>

                {/* ............................Chat Panel............................. */}
                <section className="w-[60%] xl:w-[75%] h-full bg-white/70 rounded-lg shadow-md p-4 ">
                    <ChatPanel
                        chatRoom={selectedChat?.room_id ?? null}
                        roomType={selectedChat?.type ?? null}
                        activeTab={activeTab}
                        avatar={selectedChat?.image ?? null}
                        avatarNode={renderChatAvatar(selectedChat)}
                        forwardedMessage={forwardedMessage}
                        onForwardConsumed={() => setForwardedMessage("")}
                    />
                </section>

                {/* Modals */}
                {showCreateGroupModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
                        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-xl relative">
                            <CreateNewGroupModal onClose={() => setShowCreateGroupModal(false)} />
                        </div>
                    </div>
                )}

                {showCreateMessageModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
                        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-xl lg:max-w-3xl xl:max-w-5xl relative mx-5 sm:mx-10">
                            <CreateNewMessageModal onClose={() => setShowCreateMessageModal(false)} />
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};

export default Communication;