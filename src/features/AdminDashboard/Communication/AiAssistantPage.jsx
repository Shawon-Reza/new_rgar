import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import ChatPanel from "./ChatPanel";
import axiosApi from "../../../service/axiosInstance";
import { queryClient } from "../../../main";
import { getAuthData } from "../../../config/Config";

const AiAssistantPage = () => {
    const [selectedChat, setSelectedChat] = useState(null);
    const requestRoomRef = useRef(false);
    const location = useLocation();
    const { userId: authUserId } = getAuthData();

    const { data: rooms = { ai_rooms: [] }, isLoading } = useQuery({
        queryKey: ["myRooms", authUserId, "ai-assistant"],
        queryFn: async () => {
            const response = await axiosApi.get("/api/v1/rooms/?q=&type=");
            return response.data;
        },
        keepPreviousData: true,
        staleTime: 1000 * 30,
    });

    const createAiRoom = useMutation({
        mutationFn: async () => {
            const response = await axiosApi.post("/api/v1/rooms/ai/me/");
            return response.data;
        },
        onSuccess: (room) => {
            requestRoomRef.current = false;
            if (room?.room_id) {
                setSelectedChat(room);
            }
            queryClient.invalidateQueries({ queryKey: ["myRooms"] });
        },
        onError: () => {
            requestRoomRef.current = false;
        },
    });

    useEffect(() => {
        if (Array.isArray(rooms?.ai_rooms) && rooms.ai_rooms.length > 0) {
            const firstAiRoom = rooms.ai_rooms[0];
            if (selectedChat?.room_id !== firstAiRoom.room_id) {
                setSelectedChat(firstAiRoom);
            }
            requestRoomRef.current = false;
            return;
        }

        if (!isLoading && !createAiRoom.isPending && !requestRoomRef.current) {
            requestRoomRef.current = true;
            createAiRoom.mutate();
        }
    }, [rooms?.ai_rooms, isLoading, createAiRoom.isPending, selectedChat?.room_id]);

    useEffect(() => {
        const shouldOpenAi = location.state?.openAiAssistant;
        if (!shouldOpenAi) return;

        if (Array.isArray(rooms?.ai_rooms) && rooms.ai_rooms.length > 0) {
            setSelectedChat(rooms.ai_rooms[0]);
        }
    }, [location.state?.openAiAssistant, rooms?.ai_rooms]);

    if (createAiRoom.isPending && !selectedChat) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-140px)]">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-600" />
                    <p className="text-gray-600">Preparing AI assistant room...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto">
            <section className="text-secondary mb-2">
                <h2 className="text-2xl lg:text-3xl font-bold">AI Assistant</h2>
                <p className="text-lg opacity-80">Dedicated message history</p>
            </section>

            <section className="h-[calc(100vh-190px)] bg-white/70 rounded-lg shadow-md p-2 sm:p-4">
                <ChatPanel
                    chatRoom={selectedChat?.room_id ?? null}
                    roomType={selectedChat?.type ?? "ai"}
                    activeTab="aiAssistant"
                    avatar={selectedChat?.image ?? null}
                    forwardedMessage={location.state?.forwardedMessage ?? ""}
                    onForwardConsumed={() => window.history.replaceState({}, document.title, window.location.pathname)}
                />
            </section>
        </div>
    );
};

export default AiAssistantPage;