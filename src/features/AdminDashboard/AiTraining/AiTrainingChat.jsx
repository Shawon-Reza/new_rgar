import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { FiCpu, FiMessageCircle, FiSend } from "react-icons/fi"
import { HiOutlineSparkles } from "react-icons/hi2"
import { connectWebSocketForChat } from "../Communication/ChatService"
import axiosApi from "../../../service/axiosInstance"
import ReactMarkdown from 'react-markdown'

const AiTrainingChat = () => {
    const socketRef = useRef(null)
    const [chatMessages, setChatMessages] = useState([])
    const [messageInput, setMessageInput] = useState("")
    const chatEndRef = useRef(null)
    const chatContainerRef = useRef(null)
    const [isAiTyping, setIsAiTyping] = useState(false)
    const [isSending, setIsSending] = useState(false)

    const { data: roomData, isLoading: isLoadingRoom, error: roomError } = useQuery({
        queryKey: ['aiTrainingRoom'],
        queryFn: async () => {
            const response = await axiosApi.post('/api/v1/mytrainingrooms/')
            return response.data
        },
    })

    const chatRoom = roomData?.data?.room_id

    useEffect(() => {
        if (!chatRoom) return

        const socket = connectWebSocketForChat({
            roomId: chatRoom,
            onMessage: (payload) => {
                const newMessage = payload.message || payload.data || payload
                if (!newMessage || !newMessage.id) return

                if (newMessage.is_ai) {
                    setIsAiTyping(false)
                }

                setChatMessages((prev) => [...prev, {
                    id: newMessage.id,
                    sender: newMessage.is_ai ? "ai" : "user",
                    message: newMessage.text || newMessage.message || newMessage.content,
                    timestamp: new Date(newMessage.timestamp || newMessage.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                    }),
                    userName: newMessage.sender_name || newMessage.user?.name || "User",
                }])
            },
        })

        socketRef.current = socket
        return () => socket.close()
    }, [chatRoom])

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    }, [chatMessages, isAiTyping])

    const handleSendMessage = async () => {
        if (messageInput.trim() === "" || !chatRoom) return

        const messageText = messageInput
        setMessageInput("")
        setIsSending(true)
        setIsAiTyping(true)

        try {
            const formData = new FormData()
            formData.append("prompt", messageText)
            await axiosApi.post(`/api/v1/mytrainingrooms/${chatRoom}/ask/`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })
        } catch (err) {
            setIsAiTyping(false)
            setMessageInput(messageText)
        } finally {
            setIsSending(false)
        }
    }

    if (isLoadingRoom) {
        return (
            <div className="flex min-h-[560px] items-center justify-center rounded-lg border border-[#dfe5ee] bg-white p-6">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#d9e1ec] border-t-[#2B76F4]" />
                    <p className="text-sm font-medium text-[#6b7890]">Loading AI Training Chat...</p>
                </div>
            </div>
        )
    }

    if (roomError || !chatRoom) {
        return (
            <div className="flex min-h-[560px] items-center justify-center rounded-lg border border-red-100 bg-white p-6">
                <div className="text-center">
                    <h3 className="text-base font-semibold text-[#111827]">Chat room unavailable</h3>
                    <p className="mt-2 text-sm font-medium text-[#6b7890]">Please refresh the page and try again.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-[560px] flex-col overflow-hidden rounded-lg border border-[#dfe5ee] bg-white">
            <div className="flex items-center gap-3 border-b border-[#edf1f7] px-5 py-4">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#eef4ff] text-[#2B76F4]">
                    <HiOutlineSparkles className="h-5 w-5" />
                </span>
                <div>
                    <h3 className="text-lg font-semibold text-[#111827]">Training Assistant</h3>
                    <p className="text-sm font-medium text-[#6b7890]">Ask questions against uploaded training data.</p>
                </div>
            </div>

            <div ref={chatContainerRef} className="thin-scroll flex-1 overflow-y-auto bg-[#f8fafc] px-5 py-5">
                {chatMessages.length === 0 ? (
                    <div className="flex h-full min-h-[360px] items-center justify-center text-center">
                        <div>
                            <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-white text-[#2B76F4] shadow-sm">
                                <FiMessageCircle className="h-6 w-6" />
                            </span>
                            <h4 className="mt-4 text-base font-semibold text-[#172033]">No messages yet</h4>
                            <p className="mx-auto mt-2 max-w-xs text-sm font-medium leading-6 text-[#6b7890]">
                                Upload training materials, then ask the assistant to test the knowledge base.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {chatMessages.map((msg) => {
                            const isUser = msg.sender === "user"

                            return (
                                <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                                    <div className={`flex max-w-[86%] gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
                                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-semibold ${isUser
                                            ? "bg-[#2B76F4] text-white"
                                            : "bg-white text-[#2B76F4] shadow-sm"
                                            }`}>
                                            {isUser ? (msg.userName?.charAt(0) || "U").toUpperCase() : <FiCpu className="h-4 w-4" />}
                                        </span>
                                        <div className={`${isUser ? "text-right" : "text-left"}`}>
                                            <div
                                                className={`rounded-lg px-4 py-3 text-sm font-medium leading-6 shadow-sm ${isUser
                                                    ? "bg-[#2B76F4] text-white"
                                                    : "border border-[#e3e9f2] bg-white text-[#172033]"
                                                    }`}
                                            >
                                                <div className="[&_ol]:ml-4 [&_p]:my-0 [&_ul]:ml-4">
                                                    <ReactMarkdown>{msg.message}</ReactMarkdown>
                                                </div>
                                            </div>
                                            <p className="mt-1 text-xs font-medium text-[#8b98ad]">{msg.timestamp}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {isAiTyping && (
                            <div className="flex justify-start">
                                <div className="flex gap-3">
                                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-[#2B76F4] shadow-sm">
                                        <FiCpu className="h-4 w-4" />
                                    </span>
                                    <div className="rounded-lg border border-[#e3e9f2] bg-white px-4 py-3 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-[#6b7890]">Thinking</span>
                                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8b98ad]" />
                                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8b98ad] [animation-delay:150ms]" />
                                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8b98ad] [animation-delay:300ms]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>
                )}
            </div>

            <div className="border-t border-[#edf1f7] bg-white p-4">
                <div className="flex items-center gap-2 rounded-lg border border-[#d9e1ec] bg-white px-3 py-2 transition focus-within:border-[#2B76F4] focus-within:ring-4 focus-within:ring-blue-100">
                    <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !isAiTyping && !isSending) {
                                handleSendMessage()
                            }
                        }}
                        placeholder={isAiTyping ? "Please wait, AI is responding..." : isSending ? "Sending..." : "Ask about the training material"}
                        disabled={isAiTyping || isSending}
                        className="h-9 flex-1 bg-transparent text-sm font-medium text-[#172033] outline-none placeholder:text-[#97a4b8] disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={isAiTyping || isSending || !messageInput.trim()}
                        className="grid h-9 w-9 place-items-center rounded-lg bg-[#2B76F4] text-white transition hover:bg-[#1f68e8] disabled:cursor-not-allowed disabled:bg-[#9aa8bd]"
                        aria-label="Send message"
                    >
                        <FiSend className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AiTrainingChat
