import { useEffect, useRef, useState, useMemo, memo } from "react";
import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm';
import { FiThumbsUp, FiThumbsDown, FiDownload, FiFile, FiChevronDown, FiCornerUpRight } from "react-icons/fi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosApi from "../../../service/axiosInstance";
import { IoIosSend } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { base_URL } from "../../../config/Config";
import aiAvater from "../../../assets/aiAvater.png";

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
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const isChartingAI = roomType === "ai_charting";
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
            } else {
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(tryScroll, 100);
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
        const senderName = isAI ? "AI Assistant" : (msg?.sender?.name || "Unknown User");

        const getSenderImageSrc = () => {
            if (isAI) return "";
            const picture = msg?.sender?.picture;
            if (!picture) return "";
            if (/^https?:\/\//i.test(picture)) return picture;
            return `${base_URL}${picture.startsWith("/") ? "" : "/"}${picture}`;
        };

        const senderImageSrc = getSenderImageSrc();

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
                queryClient.invalidateQueries({ queryKey: ["messages"] });
                queryClient.refetchQueries({ queryKey: ["messages"] });
            },
            onError: (err) => {
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
                {/* ================================== Display Sender icon================================ */}
                {!isMe && (
                    <div
                        className="mr-2 mt-1 h-8 w-8 min-w-8 overflow-hidden rounded-full border border-gray-300 bg-white flex items-center justify-center"
                        title={senderName}
                    >
                        {isAI ? (
                            <img
                                src={aiAvater}
                                alt="AI Assistant"
                                className="h-full w-full object-cover"
                            />
                        ) : senderImageSrc ? (
                            <img
                                src={senderImageSrc}
                                alt={senderName}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-xs font-semibold text-gray-600">
                                {senderName?.charAt(0)?.toUpperCase() || "U"}
                            </span>
                        )}
                    </div>
                )}

                <div
                    className={`px-4 py-2 rounded-lg max-w-md break-words
                ${isAI && "bg-purple-100 border border-purple-300"}
                ${isMe && "bg-teal-100 text-gray-900"}
                ${!isMe && !isAI && "bg-blue-100 text-gray-900"}
                ${isHighlighted && "ring-2 ring-yellow-400 shadow-lg"}
                select-text overflow-visible relative`}
                >
                    {/* ...............AI label................ */}
                    {isAI && (
                        <div className="text-xs font-semibold text-purple-600 mb-1">
                            AI Assistant
                        </div>
                    )}

                    {path === "charting-ai" && isAI && (
                        <button
                            type="button"
                            onClick={() => handleForwardToAiAssistant(text)}
                            title="Forward to AI Assistant For Further Analysis"
                            className="absolute -top-2 -right-12 opacity-0 group-hover:opacity-100 transition rounded-full cursor-pointer text-primary"
                        >
                            <svg width="35" height="35" viewBox="0 0 123 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M42.75 33.4999C43.3467 33.4999 43.919 33.737 44.341 34.159C44.7629 34.5809 45 35.1532 45 35.7499C45 36.3467 44.7629 36.919 44.341 37.3409C43.919 37.7629 43.3467 37.9999 42.75 37.9999H27C24.6131 37.9999 22.3239 38.9482 20.636 40.636C18.9482 42.3238 18 44.613 18 46.9999V82.9999C18 85.3869 18.9482 87.6761 20.636 89.3639C22.3239 91.0517 24.6131 91.9999 27 91.9999H63C65.3869 91.9999 67.6761 91.0517 69.364 89.3639C71.0518 87.6761 72 85.3869 72 82.9999V76.2499C72 75.6532 72.2371 75.0809 72.659 74.659C73.081 74.237 73.6533 73.9999 74.25 73.9999C74.8467 73.9999 75.419 74.237 75.841 74.659C76.2629 75.0809 76.5 75.6532 76.5 76.2499V82.9999C76.5 86.5804 75.0777 90.0141 72.5459 92.5459C70.0142 95.0776 66.5804 96.4999 63 96.4999H27C23.4196 96.4999 19.9858 95.0776 17.4541 92.5459C14.9223 90.0141 13.5 86.5804 13.5 82.9999V46.9999C13.5 43.4195 14.9223 39.9857 17.4541 37.454C19.9858 34.9223 23.4196 33.4999 27 33.4999H42.75ZM59.8365 29.1934C60.2338 29.0163 60.674 28.9582 61.1037 29.0261C61.5333 29.094 61.9341 29.285 62.2575 29.5759L84.7575 49.8259C84.9924 50.037 85.1804 50.2951 85.309 50.5835C85.4376 50.8719 85.5041 51.1841 85.5041 51.4999C85.5041 51.8157 85.4376 52.128 85.309 52.4164C85.1804 52.7048 84.9924 52.9629 84.7575 53.1739L62.2575 73.4239C61.9342 73.7157 61.5331 73.9074 61.103 73.9758C60.6729 74.0441 60.2322 73.9861 59.8344 73.8089C59.4365 73.6317 59.0987 73.3428 58.8618 72.9773C58.625 72.6118 58.4993 72.1855 58.5 71.7499V62.0299C52.2 62.6059 46.5075 65.5399 41.85 69.2659C37.2825 72.9244 33.8625 77.2219 31.9725 80.4439L31.2615 81.7534C31.0347 82.2061 30.6618 82.5689 30.2032 82.7834C29.7446 82.9979 29.2271 83.0514 28.7343 82.9354C28.2415 82.8194 27.8022 82.5405 27.4875 82.1439C27.1728 81.7473 27.001 81.2562 27 80.7499C27 71.5294 28.719 61.4719 33.831 53.6419C38.745 46.1359 46.656 40.8934 58.5 40.3084V31.2499L58.5225 30.9214C58.578 30.546 58.7276 30.1906 58.9573 29.8885C59.1871 29.5864 59.4895 29.3473 59.8365 29.1934ZM63 42.4999C63 43.0967 62.7629 43.669 62.341 44.0909C61.919 44.5129 61.3467 44.7499 60.75 44.7499C49.104 44.7499 41.9535 49.4524 37.602 56.1034C34.5195 60.8239 32.7735 66.6334 31.995 72.6814C33.9435 70.3414 36.315 67.9384 39.0375 65.7514C44.7435 61.1884 52.2 57.4219 60.75 57.4219C61.3467 57.4219 61.919 57.659 62.341 58.081C62.7629 58.5029 63 59.0752 63 59.6719V66.6919L79.875 51.4999L63 36.3034V42.4999Z" fill="currentColor" />
                                <path d="M113.459 32.3099C113.698 32.9709 113.082 32.7128 112.754 32.6567C110.382 32.247 108.265 31.1723 105.682 30.9977C97.8575 30.4664 94.3426 36.1858 89.4345 41.1441C93.5606 32.0981 94.2778 23.0644 85.3073 16.7706C85.6361 16.0261 85.5557 16.3404 86.0178 16.4521C88.0791 16.9495 89.7023 17.7244 91.9241 18.0187C99.8086 19.0644 104.423 13.8715 108.498 7.81912C108.98 8.23434 108.612 8.64617 108.49 9.07691C106.5 16.0915 103.152 20.4646 108.378 27.3846C109.279 28.5794 113.335 31.9749 113.457 32.3083L113.459 32.3099ZM103.185 26.3815C103.172 26.2295 102.055 24.4452 101.867 23.6472C101.621 22.6038 101.668 21.5415 101.725 20.4881C99.5725 21.6914 97.4686 22.1614 95.0391 22.3892C96.5048 24.1806 96.9432 26.7641 96.4591 28.9773C98.4364 27.4206 100.342 27.4496 102.52 26.8707C102.797 26.7963 103.213 26.7765 103.185 26.3815Z" fill="currentColor" />
                                <path d="M82.2398 15.251C80.2916 18.769 80.0901 22.5234 82.6657 25.76C83.3478 26.6155 84.1455 27.1771 84.854 27.9181C85.0989 28.1749 85.6438 28.5183 84.9335 28.6926C84.6592 28.7615 82.5971 27.672 81.9914 27.5279C77.2066 26.3743 74.5028 29.8203 71.5365 32.8587C73.8973 26.3828 73.9152 23.7525 68.587 19.2478C68.1848 18.9073 68.026 19.1511 68.4846 18.4816C72.323 20.2684 76.0404 20.5965 79.3362 17.6185C80.1221 16.9071 80.7063 15.8014 81.4373 15.2351C81.7573 14.9869 82.1761 14.749 82.2382 15.2538L82.2398 15.251ZM77.5235 21.9578C76.1446 21.472 74.2706 24.0118 76.4692 24.9024C78.3861 25.6809 78.9821 22.4681 77.5235 21.9578Z" fill="currentColor" />


                                <path d="M42.75 33.4999C43.3467 33.4999 43.919 33.737 44.341 34.159C44.7629 34.5809 45 35.1532 45 35.7499C45 36.3467 44.7629 36.919 44.341 37.3409C43.919 37.7629 43.3467 37.9999 42.75 37.9999H27C24.6131 37.9999 22.3239 38.9482 20.636 40.636C18.9482 42.3238 18 44.613 18 46.9999V82.9999C18 85.3869 18.9482 87.6761 20.636 89.3639C22.3239 91.0517 24.6131 91.9999 27 91.9999H63C65.3869 91.9999 67.6761 91.0517 69.364 89.3639C71.0518 87.6761 72 85.3869 72 82.9999V76.2499C72 75.6532 72.2371 75.0809 72.659 74.659C73.081 74.237 73.6533 73.9999 74.25 73.9999C74.8467 73.9999 75.419 74.237 75.841 74.659C76.2629 75.0809 76.5 75.6532 76.5 76.2499V82.9999C76.5 86.5804 75.0777 90.0141 72.5459 92.5459C70.0142 95.0776 66.5804 96.4999 63 96.4999H27C23.4196 96.4999 19.9858 95.0776 17.4541 92.5459C14.9223 90.0141 13.5 86.5804 13.5 82.9999V46.9999C13.5 43.4195 14.9223 39.9857 17.4541 37.454C19.9858 34.9223 23.4196 33.4999 27 33.4999H42.75ZM59.8365 29.1934C60.2338 29.0163 60.674 28.9582 61.1037 29.0261C61.5333 29.094 61.9341 29.285 62.2575 29.5759L84.7575 49.8259C84.9924 50.037 85.1804 50.2951 85.309 50.5835C85.4376 50.8719 85.5041 51.1841 85.5041 51.4999C85.5041 51.8157 85.4376 52.128 85.309 52.4164C85.1804 52.7048 84.9924 52.9629 84.7575 53.1739L62.2575 73.4239C61.9342 73.7157 61.5331 73.9074 61.103 73.9758C60.6729 74.0441 60.2322 73.9861 59.8344 73.8089C59.4365 73.6317 59.0987 73.3428 58.8618 72.9773C58.625 72.6118 58.4993 72.1855 58.5 71.7499V62.0299C52.2 62.6059 46.5075 65.5399 41.85 69.2659C37.2825 72.9244 33.8625 77.2219 31.9725 80.4439L31.2615 81.7534C31.0347 82.2061 30.6618 82.5689 30.2032 82.7834C29.7446 82.9979 29.2271 83.0514 28.7343 82.9354C28.2415 82.8194 27.8022 82.5405 27.4875 82.1439C27.1728 81.7473 27.001 81.2562 27 80.7499C27 71.5294 28.719 61.4719 33.831 53.6419C38.745 46.1359 46.656 40.8934 58.5 40.3084V31.2499L58.5225 30.9214C58.578 30.546 58.7276 30.1906 58.9573 29.8885C59.1871 29.5864 59.4895 29.3473 59.8365 29.1934ZM63 42.4999C63 43.0967 62.7629 43.669 62.341 44.0909C61.919 44.5129 61.3467 44.7499 60.75 44.7499C49.104 44.7499 41.9535 49.4524 37.602 56.1034C34.5195 60.8239 32.7735 66.6334 31.995 72.6814C33.9435 70.3414 36.315 67.9384 39.0375 65.7514C44.7435 61.1884 52.2 57.4219 60.75 57.4219C61.3467 57.4219 61.919 57.659 62.341 58.081C62.7629 58.5029 63 59.0752 63 59.6719V66.6919L79.875 51.4999L63 36.3034V42.4999Z" fill="currentColor" />
                            </svg>
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
                    {isAI && !isChartingAI && msg?.reactions && (
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

                {isMe && (
                    <div
                        className="ml-2 mt-1 h-8 w-8 min-w-8 overflow-hidden rounded-full border border-gray-300 bg-white flex items-center justify-center"
                        title={senderName}
                    >
                        {senderImageSrc ? (
                            <img
                                src={senderImageSrc}
                                alt={senderName}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-xs font-semibold text-gray-600">
                                {senderName?.charAt(0)?.toUpperCase() || "U"}
                            </span>
                        )}
                    </div>
                )}
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
            {groupedMessages.length === 0 ? (
                <div className="h-full min-h-[220px] flex items-center justify-center text-center text-gray-500">
                    <p>Start messaging to begin the conversation.</p>
                </div>
            ) : (
                groupedMessages.map((item, index) => {
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
                })
            )}

            {/* AI Typing Indicator */}
            {isAiTyping && (roomType === "ai" || path === "charting-ai") && (
                <div className="flex mb-4 justify-start">
                    <div className="px-4 py-2 rounded-lg bg-purple-100 border border-purple-300">
                        <div className="text-xs font-semibold text-purple-600 mb-1">
                            AI Assistant
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
