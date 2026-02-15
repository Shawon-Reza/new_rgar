import { useEffect, useRef, useState, useMemo, memo } from "react";
import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm';
import { FiThumbsUp, FiThumbsDown, FiDownload, FiFile, FiChevronDown, FiCornerUpRight } from "react-icons/fi";
import { useMutation } from "@tanstack/react-query";
import axiosApi from "../../../service/axiosInstance";
import { useNavigate } from "react-router-dom";

const MessageList = ({
    messages,
    userId,
    onLoadMore,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    roomType,
    isAiTyping,
    anchorMessageId,
    path
}) => {
    const messagesEndRef = useRef(null);
    const containerRef = useRef(null);
    const isLoadingRef = useRef(false);
    const prevScrollHeightRef = useRef(0);
    const [prevMessageCount, setPrevMessageCount] = useState(0);
    const wasAtBottomBeforeFetchRef = useRef(true);
    const isFetchingPreviousRef = useRef(false);
    const lastProgrammaticScrollRef = useRef(0);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const lastScrollButtonStateRef = useRef(false);
    const isSelectingRef = useRef(false);
    const navigate = useNavigate();

    // Deduplicate messages by id to avoid duplicate keys
    const uniqueMessages = useMemo(() => {
        const map = new Map();
        messages.forEach((msg) => {
            if (!map.has(msg.id)) {
                map.set(msg.id, msg);
            }
        });
        return Array.from(map.values());
    }, [messages]);

    // .....................**Group messages by date logic start**......................\\
    const groupedMessages = useMemo(() => {
        const groups = [];
        let currentDate = null;

        uniqueMessages.forEach((msg) => {
            const messageDate = new Date(msg.created_at).toDateString();

            if (messageDate !== currentDate) {
                currentDate = messageDate;
                groups.push({
                    type: 'date',
                    date: messageDate,
                    dateObj: new Date(msg.created_at)
                });
            }

            groups.push({
                type: 'message',
                data: msg
            });
        });

        return groups;
    }, [uniqueMessages]);

    // Format date label
    const formatDateLabel = (dateObj) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const messageDate = new Date(dateObj);

        if (messageDate.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (messageDate.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return messageDate.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        }
    };
    // .....................**Group messages by date logic End**......................\\


    // Auto-scroll to bottom ONLY if user was already viewing the bottom (new real-time messages)
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Never scroll during pagination
        if (isFetchingNextPage || isFetchingPreviousPage) {
            return;
        }

        // Check if new messages arrived
        const messageCountChanged = messages.length !== prevMessageCount;

        if (messageCountChanged && wasAtBottomBeforeFetchRef.current) {
            // Only scroll to bottom if new messages were added AND user was viewing the bottom
            const messageDifference = messages.length - prevMessageCount;

            if (messageDifference > 0) {
                // New messages arrived and user was at bottom - scroll to bottom
                setTimeout(() => {
                    lastProgrammaticScrollRef.current = Date.now();
                    container.scrollTop = container.scrollHeight - container.clientHeight;
                }, 0);
            }

            setPrevMessageCount(messages.length);
        } else if (messageCountChanged) {
            // Message count changed but user wasn't at bottom (pagination) - just update count
            setPrevMessageCount(messages.length);
        }
    }, [messages.length, isFetchingNextPage, isFetchingPreviousPage, prevMessageCount]);

    // Restore scroll position after older messages load
    useEffect(() => {
        const container = containerRef.current;
        if (!container || isFetchingNextPage) return;

        // After fetch completes, restore scroll position
        if (prevScrollHeightRef.current > 0) {
            const newScrollHeight = container.scrollHeight;
            const heightDifference = newScrollHeight - prevScrollHeightRef.current;

            // Scroll down by the height of newly added messages to stay in same visual position
            lastProgrammaticScrollRef.current = Date.now();
            container.scrollTop = heightDifference;
            console.log("📍 Scroll position restored - added", heightDifference, "px");

            prevScrollHeightRef.current = 0;
            wasAtBottomBeforeFetchRef.current = false; // User scrolled to top for pagination, not at bottom
        }
    }, [isFetchingNextPage]);

    // Scroll to anchored message when provided
    useEffect(() => {
        if (!anchorMessageId) return;
        const container = containerRef.current;
        if (!container) return;

        let attempts = 0;
        const maxAttempts = 20; // Try for up to 2 seconds

        const tryScroll = () => {
            const el = container.querySelector(`#message-${anchorMessageId}`);
            if (el) {
                lastProgrammaticScrollRef.current = Date.now();
                el.scrollIntoView({ block: 'center', behavior: 'smooth' });
                console.log('📍 Scrolled to message:', anchorMessageId);
            } else {
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(tryScroll, 100);
                } else {
                    console.warn('⚠️ Could not find message to scroll to:', anchorMessageId);
                }
            }
        };

        // Small delay to ensure DOM is ready
        setTimeout(tryScroll, 50);
    }, [anchorMessageId]);

    // Reset fetch guard when react-query finishes
    useEffect(() => {
        if (!isFetchingPreviousPage) {
            isFetchingPreviousRef.current = false;
        }
    }, [isFetchingPreviousPage]);

    //===================================== Infinite scroll - load older messages when scroll to top=================================
    const handleScroll = (e) => {
        // Ignore scroll events triggered programmatically
        if (Date.now() - lastProgrammaticScrollRef.current < 300) return;

        const hasActiveSelection = (() => {
            if (typeof window === "undefined") return false;
            const selection = window.getSelection();
            return !!(selection && !selection.isCollapsed);
        })();

        if (isSelectingRef.current || hasActiveSelection) {
            return;
        }

        const { scrollTop, scrollHeight, clientHeight } = e.target;

        // Track if user is at the bottom (for auto-scroll later)
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
        wasAtBottomBeforeFetchRef.current = isAtBottom;

        // Show/hide scroll-to-bottom button ONLY if state actually changed (prevent re-renders)
        if (lastScrollButtonStateRef.current !== !isAtBottom) {
            lastScrollButtonStateRef.current = !isAtBottom;
            setShowScrollButton(!isAtBottom);
        }

        // When user scrolls to top - load older messages
        if (scrollTop === 0 && hasNextPage && !isFetchingNextPage && !isLoadingRef.current) {
            isLoadingRef.current = true;
            console.log("📍 Top reached - loading older messages");

            // Store current scroll position before fetch
            prevScrollHeightRef.current = e.target.scrollHeight;

            onLoadMore();

            // Reset flag after a delay
            setTimeout(() => {
                isLoadingRef.current = false;
            }, 500);
        }

        // Disable bottom fetch - we don't need to fetch "newer" messages in a chat
        // (newest messages are always loaded via WebSocket)
    };

    // Scroll to bottom handler
    const handleScrollToBottom = () => {
        const container = containerRef.current;
        if (container) {
            lastProgrammaticScrollRef.current = Date.now();
            container.scrollTop = container.scrollHeight - container.clientHeight;
            setShowScrollButton(false);
        }
    };

    const handleForwardToAiAssistant = (messageText) => {
        navigate("/admin/communication", {
            state: {
                openAiAssistant: true,
                forwardedMessage: messageText
            }
        });
    };

    const MessageBubble = ({ msg }) => {
        const isChartingAI = roomType === "ai_charting" && msg?.is_ai;
        const isAI = msg?.is_ai === true;
        const isMe = roomType === "ai"
            ? !isAI // In AI chats, any non-AI message is from the user
            : (!isAI && Number(msg?.sender?.id) === Number(userId));
        const text = msg?.content || "";
        const isHighlighted = anchorMessageId !== null && msg.id === Number(anchorMessageId);

        // Helper function to determine file type from URL
        const getFileType = (url) => {
            const ext = url.split('.').pop().toLowerCase();
            if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
            if (ext === 'pdf') return 'pdf';
            if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel';
            if (['doc', 'docx'].includes(ext)) return 'document';
            return 'file';
        };

        const getFileIcon = (fileType) => {
            switch (fileType) {
                case 'pdf':
                    return '📄 PDF';
                case 'excel':
                    return '📊 Excel';
                case 'document':
                    return '📝 Document';
                default:
                    return '📎 File';
            }
        };
        //==================================== Like and Dislike reaction state and mutation========================= \\

        const [optimisticReaction, setOptimisticReaction] = useState(msg?.my_reaction || null);
        const [optimisticCounts, setOptimisticCounts] = useState({
            like: msg?.reactions?.like?.count || 0,
            dislike: msg?.reactions?.dislike?.count || 0
        });

        const reactionMutation = useMutation({
            mutationFn: (reaction) =>
                axiosApi.post(`/api/v1/messages/${msg.id}/react/`, { reaction }),
            onSuccess: () => {
                console.log("✅ Reaction sent successfully");
            },
            onError: (err) => {
                console.error("❌ Reaction failed:", err?.response?.data || err?.message);
                setOptimisticReaction(msg?.my_reaction || null);
                setOptimisticCounts({
                    like: msg?.reactions?.like?.count || 0,
                    dislike: msg?.reactions?.dislike?.count || 0
                });
            }
        });

        const handleReaction = (reaction) => {
            setOptimisticReaction(reaction === optimisticReaction ? null : reaction);
            setOptimisticCounts(prev => {
                const updated = { ...prev };

                if (reaction === optimisticReaction) {
                    updated[reaction] = Math.max(0, updated[reaction] - 1);
                } else {
                    if (optimisticReaction) {
                        updated[optimisticReaction] = Math.max(0, updated[optimisticReaction] - 1);
                    }
                    updated[reaction] = updated[reaction] + 1;
                }

                return updated;
            });

            reactionMutation.mutate(reaction);
        };

        return (
            <div id={`message-${msg.id}`} className={`group flex mb-4 ${isMe ? "justify-end" : "justify-start"} ${isHighlighted ? 'animate-pulse' : ''} `}>
                <div
                    className={`px-4 py-2 rounded-lg max-w-md break-words
                ${isAI && "bg-purple-100 border border-purple-300"}
                ${isMe && "bg-teal-100 text-gray-900"}
                ${!isMe && !isAI && "bg-blue-100 text-gray-900"}
                ${isHighlighted && "ring-2 ring-yellow-400 shadow-lg"}
                select-text overflow-hidden relative`} // Added overflow-hidden to prevent leakage
                >
                    {/* ...............AI label................ */}
                    {isAI && (
                        <div className="text-xs font-semibold text-purple-600 mb-1">
                            🤖 AI Assistant
                        </div>
                    )}

                    {path === "charting-ai" && isAI && (
                        <button
                            type="button"
                            onClick={() => handleForwardToAiAssistant(text)}
                            title="Forward to AI Assistant"
                            className="absolute -top-0 -right-0 opacity-0 group-hover:opacity-100 transition bg-white border border-gray-300 rounded-full p-1.5 shadow-sm hover:bg-gray-100 cursor-pointer"
                        >
                            <FiCornerUpRight size={14} className="text-gray-600" />
                        </button>
                    )}

                    {/* ................Convert Markdown to HTML................. */}
                    <div className="text-sm max-w-none break-words">
                        <ReactMarkdown>{text}</ReactMarkdown>
                        {/* {!isAI && (
                            <p className="break-words">
                                <ReactMarkdown>{text}</ReactMarkdown>
                            </p>
                        )} */}
                    </div>


                    {/* ................Display Attachments................. */}
                    {msg?.attachments && msg.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {msg.attachments.map((attachment) => {
                                const fileType = getFileType(attachment.url);
                                return (
                                    <div key={attachment.id}>
                                        {fileType === 'image' ? (
                                            <img
                                                src={attachment.url}
                                                alt="Attachment"
                                                className="max-w-sm rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => window.open(attachment.url, '_blank')}
                                            />
                                        ) : (
                                            <a
                                                href={attachment.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 p-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors max-w-xs"
                                            >
                                                <FiDownload size={16} className="text-gray-700" />
                                                <span className="text-sm font-medium text-gray-800 truncate">
                                                    {getFileIcon(fileType)}
                                                </span>
                                            </a>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* TIME */}
                    <div className="text-xs text-gray-500 mt-1 text-right">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </div>
                    {/* ===================================== Like /Dislike reactions ========================= */}
                    {isAI && msg?.reactions && (
                        <div className="flex gap-3 mt-2 pt-2 border-t" style={{ borderTopColor: '#d8b4fe' }}>
                            <div className="flex items-center gap-1 text-xs">
                                <FiThumbsUp
                                    size={14}
                                    onClick={() => handleReaction('like')}
                                    className={`cursor-pointer transition-colors ${optimisticReaction === 'like' ? 'text-green-600 fill-green-600' : 'text-gray-500'}`}
                                />
                                <span className="text-gray-600 font-medium">{optimisticCounts.like}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                                <FiThumbsDown
                                    size={14}
                                    onClick={() => handleReaction('dislike')}
                                    className={`cursor-pointer transition-colors ${optimisticReaction === 'dislike' ? 'text-red-600 fill-red-600' : 'text-gray-500'}`}
                                />
                                <span className="text-gray-600 font-medium">{optimisticCounts.dislike}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };




    return (
        // This is the parent container where messages are wrapped
        // Parent container
        <div
            ref={containerRef}
            onScroll={handleScroll}
            onMouseDown={() => {
                isSelectingRef.current = true;
            }}
            onMouseUp={() => {
                isSelectingRef.current = false;
            }}
            onMouseLeave={() => {
                isSelectingRef.current = false;
            }}
            className="flex-1 overflow-y-auto p-4 space-y-2 relative select-text"
        >
            {isFetchingNextPage && (
                <div className="text-center text-sm text-gray-500 py-2">
                    Loading older messages...
                </div>
            )}

            {/* Loop through grouped messages and render them */}
            {groupedMessages.map((item, index) => {
                if (item.type === 'date') {
                    return (
                        <div key={`date-${index}`} className="flex items-center justify-center my-4">
                            <div className="bg-gray-200 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
                                {formatDateLabel(item.dateObj)}
                            </div>
                        </div>
                    );
                } else {
                    return <MessageBubble key={item.data.id} msg={item.data} />;
                }
            })}

            {/* AI Typing Indicator */}
            {isAiTyping && (roomType === "ai" || path === "charting-ai") && (
                <div className="flex mb-4 justify-start">
                    <div className="px-4 py-2 rounded-lg bg-purple-100 border border-purple-300">
                        <div className="text-xs font-semibold text-purple-600 mb-1">
                            🤖 AI Assistant
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-600">AI is thinking</span>
                            <div className="flex gap-1 ml-1">
                                <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} />

            {/* Scroll to bottom button */}
            {showScrollButton && (
                <button
                    onClick={handleScrollToBottom}
                    className="fixed bottom-48 right-15 bg-primary text-white rounded-full p-2 shadow-lg transition-all duration-200 flex items-center justify-center cursor-pointer select-none"
                    title="Scroll to latest message"
                >
                    <FiChevronDown size={20} />
                </button>
            )}
        </div>


    );
};

export default memo(MessageList);
