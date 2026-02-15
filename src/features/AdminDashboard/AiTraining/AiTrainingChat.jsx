import { useState, useRef, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { FiPaperclip, FiMic, FiSend, FiThumbsUp, FiThumbsDown } from "react-icons/fi"
import { connectWebSocketForChat } from "../Communication/ChatService";
import axiosApi from "../../../service/axiosInstance"
import ReactMarkdown from 'react-markdown'
// import remarkGfm from 'remark-gfm';

const AiTrainingChat = () => {
    const socketRef = useRef(null);
    const queryClient = useQueryClient();
    const [chatMessages, setChatMessages] = useState([])
    const [messageInput, setMessageInput] = useState("")
    const chatEndRef = useRef(null)
    const chatContainerRef = useRef(null)
    const fileInputRef = useRef(null)
    const [isAiTyping, setIsAiTyping] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [reactions, setReactions] = useState({}) // Track reactions: { messageId: 'like' | 'dislike' | null }

    // .......................Get Room ID for AI Training Chat.........................\\
    const { data: roomData, isLoading: isLoadingRoom, error: roomError } = useQuery({
        queryKey: ['aiTrainingRoom'],
        queryFn: async () => {
            const response = await axiosApi.post('/api/v1/mytrainingrooms/')
            console.log('[AiTrainingChat] Room data:', response.data)
            return response.data
        },
        onError: (err) => {
            console.error('[AiTrainingChat] Error fetching room:', err)
        },
    })

    const chatRoom = roomData?.data?.room_id
    console.log(chatRoom)

    // .......................Socket Connection.........................\\
    useEffect(() => {
        if (!chatRoom) return;

        const socket = connectWebSocketForChat({
            roomId: chatRoom,

            onMessage: (payload) => {
                console.log("[AiTrainingChat] WebSocket payload received:", payload)

                // Handle different message structures from backend
                const newMessage = payload.message || payload.data || payload;

                // Skip if not a valid message object
                if (!newMessage || !newMessage.id) return;

                console.log("[AiTrainingChat] New message processed:", newMessage)
                
                // If AI message received, stop typing indicator
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
                    avatar: newMessage.is_ai ? "🤖" : "👩‍⚕️",
                }]);
            },
        });

        socketRef.current = socket;
        return () => socket.close();
    }, [chatRoom]);

    // Console logging for component initialization
    useEffect(() => {
        console.log("[AiTrainingChat] Component Initialized")
        console.log("[AiTrainingChat] Chat Room ID:", chatRoom)
    }, [])


    // Handle send message
    const handleSendMessage = async () => {
        if (messageInput.trim() === "" || !chatRoom) {
            console.log("[AiTrainingChat] Empty message or no room, not sending")
            return
        }

        const messageText = messageInput;
        setMessageInput("")
        setIsSending(true);
        setIsAiTyping(true);

        try {
            const formData = new FormData();
            formData.append("prompt", messageText);
            // {{baseurl}}/api/v1/mytrainingrooms/11/ask/

            console.log("formData:", formData)
            await axiosApi.post(`/api/v1/mytrainingrooms/${chatRoom}/ask/`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            console.log("[AiTrainingChat] Message sent successfully")

            // Scroll to bottom after sending message
            requestAnimationFrame(() => {
                if (chatContainerRef.current) {
                    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                }
            });
        } catch (err) {
            console.error("[AiTrainingChat] Send message failed:", err);
            setIsAiTyping(false)
            // Optionally restore message on error
            setMessageInput(messageText);
        } finally {
            setIsSending(false);
        }
    }

    // Handle message reactions
    const handleReaction = async (messageId, reaction) => {
        console.groupCollapsed(`👍 Reacting to message ${messageId}`)
        console.log("Message ID:", messageId)
        console.log("Reaction:", reaction)
        console.log("Endpoint:", `/api/v1/messages/${messageId}/react/`)
        console.log("Payload:", { reaction })
        console.groupEnd()

        // Update local state immediately for better UX
        setReactions(prev => {
            const currentReaction = prev[messageId]
            // If clicking the same reaction, remove it; otherwise set new reaction
            const newReaction = currentReaction === reaction ? null : reaction
            return {
                ...prev,
                [messageId]: newReaction
            }
        })

        try {
            const response = await axiosApi.post(`/api/v1/messages/${messageId}/react/`, {
                reaction: reaction // "like" or "dislike"
            })
            
            console.log("✅ Reaction successful:", response?.status, response?.data)
            
        } catch (err) {
            console.error("❌ Reaction failed:", err?.response?.status, err?.response?.data || err?.message)
            // Revert state on error
            setReactions(prev => ({
                ...prev,
                [messageId]: null
            }))
        }
    }

    // Handle attachment click
    const handleAttachment = () => {
        console.log("[AiTrainingChat] Attachment button clicked")
        fileInputRef.current?.click()
    }

    // Handle microphone click
    const handleMicrophone = () => {
        console.log("[AiTrainingChat] Microphone button clicked")
        console.log("[AiTrainingChat] Starting voice recording...")
    }

    // Loading state
    if (isLoadingRoom) {
        return (
            <div className="border border-teal-500 rounded-lg p-6 flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading AI Training Chat...</p>
                </div>
            </div>
        )
    }

    // Error state
    if (roomError || !chatRoom) {
        return (
            <div className="border border-red-500 rounded-lg p-6 flex items-center justify-center h-96">
                <div className="text-center">
                    <p className="text-red-600 font-semibold mb-2">Failed to load chat room</p>
                    <p className="text-gray-600 text-sm">Please try refreshing the page</p>
                </div>
            </div>
        )
    }

    return (
        <div className="border border-teal-500 rounded-lg p-6 flex flex-col max-h-[calc(100vh-200px)] md:max-h-[calc(100vh-250px)] lg:max-h-[calc(100vh-300px)]">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white font-semibold">
                    🤖
                </div>
                <h2 className="text-xl font-semibold text-gray-900">AI Assistant</h2>
            </div>

            {/* Chat Messages */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto mb-4 space-y-4">
                {chatMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500 text-center">
                        <p>No messages yet.Please first uploade documents then Start a conversation!</p>
                    </div>
                ) : (
                    <>
                        {chatMessages.map((msg) => (

                            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`flex gap-3 max-w-xs ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0">
                                        {msg.avatar}
                                    </div>
                                    <div className="text-left">
                                        {msg.sender === "user" && <p className="text-xs text-gray-600 mb-1">{msg.userName}</p>}
                                        <div
                                            className={`rounded-lg text-sm px-4 py-2 ${msg.sender === "user" ? "bg-teal-100 text-gray-900" : "bg-gray-100 text-gray-900"
                                                }`}
                                        >
                                            {/* Message text */}
                                            {/* <p className="text-sm">{msg.message}</p> */}
                                            <ReactMarkdown>
                                                {msg.message}
                                            </ReactMarkdown>

                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{msg.timestamp}</p>
                                        {msg.sender === "ai" && (
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    onClick={() => handleReaction(msg.id, "like")}
                                                    className={`transition-colors ${
                                                        reactions[msg.id] === "like" 
                                                            ? "text-teal-500" 
                                                            : "text-gray-400 hover:text-teal-500"
                                                    }`}
                                                    title={reactions[msg.id] === "like" ? "Remove like" : "Like"}
                                                >
                                                    <FiThumbsUp size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleReaction(msg.id, "dislike")}
                                                    className={`transition-colors ${
                                                        reactions[msg.id] === "dislike" 
                                                            ? "text-red-500" 
                                                            : "text-gray-400 hover:text-red-500"
                                                    }`}
                                                    title={reactions[msg.id] === "dislike" ? "Remove dislike" : "Dislike"}
                                                >
                                                    <FiThumbsDown size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {/* AI Typing Indicator */}
                        {isAiTyping && (
                            <div className="flex justify-start">
                                <div className="flex gap-3 max-w-xs">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0">
                                        🤖
                                    </div>
                                    <div>
                                        <div className="rounded-lg px-4 py-3 bg-gray-100">
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm text-gray-600">AI is thinking</span>
                                                <div className="flex gap-1">
                                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div ref={chatEndRef} />
                    </>
                )}
            </div>

            {/* Message Input */}
            <div className="flex items-center gap-2 bg-white/50 rounded-lg p-3">
                <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !isAiTyping && !isSending && handleSendMessage()}
                    placeholder={isAiTyping ? "Please wait, AI is responding..." : isSending ? "Sending..." : "Type a message..."}
                    disabled={isAiTyping || isSending}
                    className={`flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500 ${isAiTyping || isSending ? 'cursor-not-allowed opacity-60' : ''}`}
                />

                <button 
                    onClick={handleSendMessage} 
                    disabled={isAiTyping || isSending || !messageInput.trim()}
                    className={`text-teal-500 hover:text-teal-600 transition-colors ${(isAiTyping || isSending || !messageInput.trim()) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <FiSend size={20} />
                </button>
            </div>

            {/* Hidden file input for attachments */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                className="hidden"
            />
        </div>
    )
}

export default AiTrainingChat