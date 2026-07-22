import { useEffect, useRef, useState, useMemo, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FiThumbsUp,
  FiThumbsDown,
  FiDownload,
  FiFile,
  FiChevronDown,
  FiChevronRight,
  FiCornerUpRight,
  FiMessageCircle,
} from "react-icons/fi";
import { LuSparkles } from "react-icons/lu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosApi from "../../../service/axiosInstance";
import { IoIosSend } from "react-icons/io";
import { base_URL } from "../../../config/Config";
import aiAvater from "../../../assets/aiAvater.png";

const isNewCaseSeparator = (message) =>
  message?.type === "newcase_separator" ||
  message?.is_separator === true ||
  String(message?.content || "").trim() === "--- New Case Separator ---";

const getMessageDate = (message) => {
  const value = message?.created_at || message?.timestamp;
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const getMessageKey = (message, index) =>
  message?.id ||
  `${message?.type || "message"}-${message?.room_id || "room"}-${message?.created_at || index}`;

const NewCaseSeparator = memo(({ item, isChartingAI }) => {
  const time = getMessageDate(item).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isChartingAI) {
    return (
      <div className="flex items-center w-full my-3">
        {/* Left Line */}
        <div className="flex-1 border-b h-px border-gray-600"></div>

        {/* Text */}
        <div className="px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2B76F4] whitespace-nowrap">
          New Case - {time}
        </div>

        {/* Right Line */}
        <div className="flex-1 border-b h-px border-gray-600"></div>
      </div>
    );
  }

  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-200 to-cyan-200" />
      <div className="rounded-full border border-cyan-100 bg-cyan-50 px-4 py-1.5 text-xs font-semibold text-cyan-700 shadow-sm">
        New case started - {time}
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-cyan-200 via-cyan-200 to-transparent" />
    </div>
  );
});

const MessageBubble = memo(
  ({ msg, userId, roomType, anchorMessageId, path }) => {
    const queryClient = useQueryClient();

    const isChartingResponse = roomType === "ai_charting" && msg?.is_ai;
    const isChartingMessage =
      path === "charting-ai" || roomType === "ai_charting";
    const isAssistanceMessage = path === "assistance";
    const isTeamMessage = path === "communication";
    const isAI = msg?.is_ai === true;
    const isAiChatRoom =
      roomType === "ai" ||
      roomType === "ai_charting" ||
      path === "charting-ai" ||
      path === "assistance";
    const isMe = isAiChatRoom
      ? !isAI
      : !isAI && Number(msg?.sender?.id) === Number(userId);
    const text = msg?.content || "";
    const isHighlighted =
      anchorMessageId !== null && msg.id === Number(anchorMessageId);
    const aiDisplayName =
      path === "charting-ai"
        ? "Chartly AI"
        : path === "assistance"
          ? "KyroAI"
          : "AI Assistant";
    const senderName = isAI
      ? aiDisplayName
      : msg?.sender?.name || "Unknown User";
    const senderLabel = isAI ? aiDisplayName : isMe ? "You" : senderName;
    const senderRole = msg?.sender?.display_role || msg?.sender?.role || "";
    const messageTime = new Date(msg.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const bubbleClassName = isChartingResponse
      ? `relative w-auto max-w-[340px] md:max-w-[70rem] overflow-hidden break-words rounded-2xl border border-[#d8e3f3] bg-white px-4 py-3 text-[#253044] shadow-[0_3px_9px_rgba(15,23,42,0.12)] ring-1 ring-white/80 md:w-full  md:px-5 md:py-4 ${isHighlighted ? "ring-2 ring-yellow-400 shadow-lg" : ""}`
      : isChartingMessage
        ? `px-4 py-3 rounded-2xl max-w-[340px] md:max-w-4xl break-words shadow-[0_3px_9px_rgba(15,23,42,0.12)] ${
            isAI
              ? "border border-[#e3e9f2] bg-white text-[#172033]"
              : isMe
                ? "bg-[#d9ffe8] text-[#06151f]"
                : "bg-white text-[#172033]"
          } ${isHighlighted ? "ring-2 ring-yellow-400 shadow-lg" : ""} select-text overflow-visible relative`
        : isAssistanceMessage
          ? `px-4 py-3 rounded-2xl max-w-[340px] md:max-w-4xl break-words shadow-[0_3px_9px_rgba(15,23,42,0.12)] ${
              isAI
                ? "border border-[#e3e9f2] bg-white text-[#172033]"
                : isMe
                  ? "bg-[#d9ffe8] text-[#06151f]"
                  : "bg-white text-[#172033]"
            } ${isHighlighted ? "ring-2 ring-yellow-400 shadow-lg" : ""} select-text overflow-visible relative`
          : isTeamMessage
            ? `max-w-[275px] break-words rounded-2xl px-4 py-3 text-[14px] shadow-[0_2px_7px_rgba(15,23,42,0.12)] md:max-w-md ${
                isMe
                  ? "bg-[#d9ffe8] text-[#0f2f22]"
                  : isAI
                    ? "border border-[#e3e9f2] bg-white text-[#172033]"
                    : "border border-[#e8edf4] bg-white text-[#050b18]"
              } ${isHighlighted ? "ring-2 ring-yellow-400 shadow-lg" : ""} select-text overflow-visible relative`
            : `px-2 sm:px-4 py-2 rounded-lg max-w-xs md:max-w-md break-words
            ${isAI && "bg-purple-100 border border-purple-300"}
            ${isMe && "bg-teal-100 text-gray-900"}
            ${!isMe && !isAI && "bg-blue-100 text-gray-900"}
            ${isHighlighted && "ring-2 ring-yellow-400 shadow-lg"}
            select-text overflow-visible relative`;

    const markdownClassName = isChartingResponse
      ? "max-w-full whitespace-normal break-words text-[14px] leading-6 text-[#263247] [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_strong]:text-[#0f172a] [&_hr]:my-4 [&_hr]:border-[#e4ebf5] [&_h1]:mb-3 [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-[#0f172a] [&_h2]:mb-3 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-[#0f172a] [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-[#0f172a] [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1.5"
      : isAssistanceMessage || isChartingMessage
        ? `${isAI ? "text-[13px]" : "text-sm"} max-w-[300px] sm:max-w-4xl xl:max-w-none break-words whitespace-normal overflow-x-auto leading-6 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_table]:w-full [&_table]:border-collapse [&_th]:text-left [&_th]:pr-4 [&_td]:pr-4 [&_td]:align-top [&_strong]:font-semibold [&_strong]:text-[#111827]`
        : isTeamMessage
          ? "max-w-[245px] overflow-x-auto whitespace-normal break-words text-[14px] leading-6 sm:max-w-md xl:max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:font-semibold"
          : "text-sm max-w-[220px] sm:max-w-xs xl:max-w-none break-words whitespace-normal overflow-x-auto [&_h3]:mt-3 [&_h3]:mb-2 [&_h3]:font-semibold [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 [&_table]:w-full [&_table]:min-w-[360px] [&_table]:border-collapse [&_table]:table-auto [&_th]:border [&_th]:border-gray-300 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:whitespace-normal [&_td]:border [&_td]:border-gray-300 [&_td]:px-2 [&_td]:py-1 [&_td]:whitespace-normal [&_td]:break-words [&_table]:text-xs sm:[&_table]:text-sm";

    const markdownComponents = isChartingResponse
      ? {
          table: ({ ...props }) => (
            <div className="my-3 block w-full max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-[#dfe7f2] bg-white [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
              <table
                {...props}
                className="w-max min-w-[540px] border-separate border-spacing-0 text-sm"
              />
            </div>
          ),
          th: ({ ...props }) => (
            <th
              {...props}
              className="border-b border-[#dfe7f2] bg-[#f7faff] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#526174]"
            />
          ),
          td: ({ ...props }) => (
            <td
              {...props}
              className="border-b border-[#edf2f8] px-4 py-3 align-top text-[#263247]"
            />
          ),
        }
      : undefined;

    const getSenderImageSrc = () => {
      if (isAI) return "";
      const picture = msg?.sender?.picture;
      if (!picture) return "";
      if (/^https?:\/\//i.test(picture)) return picture;
      return `${base_URL}${picture.startsWith("/") ? "" : "/"}${picture}`;
    };

    const senderImageSrc = getSenderImageSrc();

    const getAttachmentUrl = (url) => {
      if (!url) return "";
      if (/^https?:\/\//i.test(url) || url.startsWith("blob:")) return url;
      return `${base_URL}${url.startsWith("/") ? "" : "/"}${url}`;
    };

    const getFileType = (url) => {
      if (!url) return "file";
      const cleanUrl = url.split("?")[0];
      const ext = cleanUrl.split(".").pop().toLowerCase();
      if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext))
        return "image";
      if (ext === "pdf") return "pdf";
      if (["xls", "xlsx", "csv"].includes(ext)) return "excel";
      if (["doc", "docx"].includes(ext)) return "document";
      return "file";
    };

    const getFileIcon = (fileType) => {
      switch (fileType) {
        case "pdf":
          return "📄 PDF";
        case "excel":
          return "📊 Excel";
        case "document":
          return "📝 Document";
        default:
          return "📎 File";
      }
    };

    const [optimisticReaction, setOptimisticReaction] = useState(
      msg?.my_reaction || null,
    );
    const [optimisticCounts, setOptimisticCounts] = useState({
      like: msg?.reactions?.like?.count || 0,
      dislike: msg?.reactions?.dislike?.count || 0,
    });

    const reactionMutation = useMutation({
      mutationFn: (reaction) =>
        axiosApi.post(`/api/v1/messages/${msg.id}/react/`, { reaction }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["messages"] });
        queryClient.refetchQueries({ queryKey: ["messages"] });
      },
      onError: () => {
        setOptimisticReaction(msg?.my_reaction || null);
        setOptimisticCounts({
          like: msg?.reactions?.like?.count || 0,
          dislike: msg?.reactions?.dislike?.count || 0,
        });
      },
    });

    const handleReaction = (reaction) => {
      setOptimisticReaction(reaction === optimisticReaction ? null : reaction);
      setOptimisticCounts((prev) => {
        const updated = { ...prev };
        if (reaction === optimisticReaction) {
          updated[reaction] = Math.max(0, updated[reaction] - 1);
        } else {
          if (optimisticReaction) {
            updated[optimisticReaction] = Math.max(
              0,
              updated[optimisticReaction] - 1,
            );
          }
          updated[reaction] = updated[reaction] + 1;
        }
        return updated;
      });

      reactionMutation.mutate(reaction);
    };

    return (
      <div
        id={`message-${msg.id}`}
        className={`group flex ${isChartingResponse ? "mb-6" : isTeamMessage ? "mb-7" : "mb-4"} ${isMe ? "justify-end" : "justify-start"} ${isHighlighted ? "animate-pulse" : ""} `}
      >
        {!isMe && (
          <div
            className={
              isChartingResponse
                ? "mr-3 mt-1 flex h-9 w-9 min-w-9 items-center justify-center overflow-hidden rounded-full border border-[#dbe6f6] bg-white shadow-[0_8px_18px_rgba(15,23,42,0.08)]"
                : isAssistanceMessage
                  ? "mr-2 mt-1 flex h-8 w-8 min-w-8 items-center justify-center overflow-hidden rounded-xl border border-[#dbe6f6] bg-white shadow-[0_8px_18px_rgba(15,23,42,0.08)]"
                  : isTeamMessage
                    ? "mr-3 mt-9 flex h-8 w-8 min-w-8 items-center justify-center overflow-hidden rounded-full bg-[#20aee8] text-[11px] font-semibold text-white md:mt-1 md:h-9 md:w-9 md:min-w-9 md:border md:border-[#dbe6f6] md:bg-white md:text-[#57708f] md:shadow-[0_8px_18px_rgba(15,23,42,0.08)]"
                    : "mr-2 mt-1 h-8 w-8 min-w-8 overflow-hidden rounded-full border border-gray-300 bg-white flex items-center justify-center"
            }
            title={senderName}
          >
            {isAI ? (
              <img
                src={aiAvater}
                alt="AI Assistant"
                className="h-full w-full object-cover"
              />
            ) : senderImageSrc && !isTeamMessage ? (
              <img
                src={senderImageSrc}
                alt={senderName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span
                className={`text-xs font-semibold ${isTeamMessage ? "text-white md:text-gray-600" : "text-gray-600"}`}
              >
                {senderName?.charAt(0)?.toUpperCase() || "U"}
              </span>
            )}
          </div>
        )}

        <div
          className={`flex flex-col ${isChartingResponse ? "min-w-0 flex-1" : ""} ${isMe ? "items-end" : "items-start"}`}
        >
          {(!isTeamMessage || !isMe) && !(isAssistanceMessage && isMe) && (
            <div
              className={
                isChartingResponse
                  ? "mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2B76F4]"
                  : isAssistanceMessage
                    ? `mb-1 px-1 text-xs font-semibold ${isAI ? "text-[#2B76F4]" : isMe ? "text-[#2B76F4] text-right" : "text-[#41506a]"}`
                    : isTeamMessage
                      ? "mb-1 flex items-center gap-1.5 px-1 text-[11px] font-semibold text-[#0d1b34]"
                      : `text-xs font-semibold mb-1 px-1 ${isAI ? "text-purple-600" : isMe ? "text-teal-700 text-right" : "text-primary"}`
              }
            >
              <span>{senderLabel}</span>
              {isTeamMessage && !isMe && senderRole && (
                <span className="rounded-full bg-[#e8eef5] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#6f7f94]">
                  {senderRole}
                </span>
              )}
            </div>
          )}

          <div className={bubbleClassName}>
            <div className={markdownClassName}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {text}
              </ReactMarkdown>
            </div>

            {msg?.attachments && msg.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {msg.attachments.map((attachment, idx) => {
                  const fullUrl = getAttachmentUrl(attachment.url);
                  const fileType = getFileType(attachment.url);
                  const fileName =
                    attachment.name || attachment.file_name || "Attachment";
                  return (
                    <div key={attachment.id || idx}>
                      {fileType === "image" ? (
                        <img
                          src={fullUrl}
                          alt={fileName}
                          className="max-w-xs rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(fullUrl, "_blank")}
                        />
                      ) : (
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors max-w-xs"
                        >
                          <FiDownload size={16} className="text-gray-700 shrink-0" />
                          <span className="text-sm font-medium text-gray-800 truncate">
                            {getFileIcon(fileType)} {fileName}
                          </span>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!isTeamMessage && !(isAssistanceMessage && isMe) && (
              <div
                className={
                  isChartingResponse
                    ? "mt-4 border-t border-[#edf2f8] pt-3 text-right text-[11px] font-medium text-[#94a3b8]"
                    : "text-xs text-gray-500 mt-1 text-right"
                }
              >
                {messageTime}
              </div>
            )}
            {isAI && !isChartingResponse && msg?.reactions && (
              <div
                className="flex gap-3 mt-2 pt-2 border-t"
                style={{ borderTopColor: "#d8b4fe" }}
              >
                <div className="flex items-center gap-1 text-xs">
                  <FiThumbsUp
                    size={14}
                    onClick={() => handleReaction("like")}
                    className={`cursor-pointer transition-colors ${optimisticReaction === "like" ? "text-green-600 fill-green-600" : "text-gray-500"}`}
                  />
                  <span className="text-gray-600 font-medium">
                    {optimisticCounts.like}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <FiThumbsDown
                    size={14}
                    onClick={() => handleReaction("dislike")}
                    className={`cursor-pointer transition-colors ${optimisticReaction === "dislike" ? "text-red-600 fill-red-600" : "text-gray-500"}`}
                  />
                  <span className="text-gray-600 font-medium">
                    {optimisticCounts.dislike}
                  </span>
                </div>
              </div>
            )}
          </div>
          {(isTeamMessage || (isAssistanceMessage && isMe)) && (
            <div
              className={`mt-1 px-1 text-[10px] font-medium ${isAssistanceMessage && isMe ? "text-[#9c8db5]" : "text-[#8da0ba]"} ${isMe ? "self-end text-right" : "self-start text-left"}`}
            >
              {messageTime}
            </div>
          )}
        </div>

        {isMe && !isTeamMessage && (
          <div
            className={
              isTeamMessage
                ? "ml-3 mt-1 flex h-9 w-9 min-w-9 items-center justify-center overflow-hidden rounded-full border border-[#dbe6f6] bg-white text-xs font-semibold text-[#57708f] shadow-[0_8px_18px_rgba(15,23,42,0.08)]"
                : "ml-2 mt-1 h-8 w-8 min-w-8 overflow-hidden rounded-full border border-gray-300 bg-white flex items-center justify-center"
            }
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
  },
);

const MessageList = ({
  messages,
  userId,
  onLoadMore,
  hasNextPage,
  isFetchingNextPage,
  isFetchingPreviousPage,
  roomType,
  isAiTyping,
  anchorMessageId,
  path,
  starterQuestions = [],
  onStarterQuestionClick,
}) => {
  const containerRef = useRef(null);
  const isLoadingRef = useRef(false);
  const prevScrollHeightRef = useRef(0);
  const [prevMessageCount, setPrevMessageCount] = useState(0);
  const wasAtBottomBeforeFetchRef = useRef(true);
  const lastProgrammaticScrollRef = useRef(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const lastScrollButtonStateRef = useRef(false);
  const isSelectingRef = useRef(false);
  const isChartingAI = roomType === "ai_charting" || path === "charting-ai";
  const isAssistanceAI = path === "assistance" && (roomType === "ai" || !roomType);
  const isTeamChat = path === "communication";

  const uniqueMessages = useMemo(() => {
    const map = new Map();
    messages.forEach((msg, index) => {
      const key = getMessageKey(msg, index);
      if (!map.has(key)) {
        map.set(key, msg);
      }
    });
    return Array.from(map.values());
  }, [messages]);

  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDate = null;

    uniqueMessages.forEach((msg) => {
      const messageDate = getMessageDate(msg).toDateString();

      if (messageDate !== currentDate) {
        currentDate = messageDate;
        groups.push({
          type: "date",
          date: messageDate,
          dateObj: getMessageDate(msg),
        });
      }

      groups.push({
        type: "message",
        data: msg,
      });
    });

    return groups;
  }, [uniqueMessages]);

  const formatDateLabel = (dateObj) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const messageDate = new Date(dateObj);

    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const lastMessageContentRef = useRef("");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (isFetchingNextPage || isFetchingPreviousPage) {
      return;
    }

    const messageCountChanged = messages.length !== prevMessageCount;
    const lastMessage = messages[messages.length - 1];
    const lastMessageContent = lastMessage?.content || "";
    const contentChanged = lastMessageContent !== lastMessageContentRef.current;

    if (
      (messageCountChanged || contentChanged) &&
      wasAtBottomBeforeFetchRef.current
    ) {
      const messageDifference = messages.length - prevMessageCount;

      if (messageDifference > 0 || contentChanged) {
        setTimeout(() => {
          lastProgrammaticScrollRef.current = Date.now();
          container.scrollTop = container.scrollHeight - container.clientHeight;
        }, 0);
      }

      setPrevMessageCount(messages.length);
      lastMessageContentRef.current = lastMessageContent;
    } else if (messageCountChanged || contentChanged) {
      setPrevMessageCount(messages.length);
      lastMessageContentRef.current = lastMessageContent;
    }
  }, [messages, isFetchingNextPage, isFetchingPreviousPage, prevMessageCount]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isFetchingNextPage) return;

    if (prevScrollHeightRef.current > 0) {
      const newScrollHeight = container.scrollHeight;
      const heightDifference = newScrollHeight - prevScrollHeightRef.current;

      lastProgrammaticScrollRef.current = Date.now();
      container.scrollTop = heightDifference;

      prevScrollHeightRef.current = 0;
      wasAtBottomBeforeFetchRef.current = false;
    }
  }, [isFetchingNextPage]);

  useEffect(() => {
    if (!anchorMessageId) return;
    const container = containerRef.current;
    if (!container) return;

    let attempts = 0;
    const maxAttempts = 20;

    const tryScroll = () => {
      const el = container.querySelector(`#message-${anchorMessageId}`);
      if (el) {
        lastProgrammaticScrollRef.current = Date.now();
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      } else {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(tryScroll, 100);
        }
      }
    };

    setTimeout(tryScroll, 50);
  }, [anchorMessageId]);

  const handleScroll = (e) => {
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

    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    wasAtBottomBeforeFetchRef.current = isAtBottom;

    if (lastScrollButtonStateRef.current !== !isAtBottom) {
      lastScrollButtonStateRef.current = !isAtBottom;
      setShowScrollButton(!isAtBottom);
    }

    if (
      scrollTop === 0 &&
      hasNextPage &&
      !isFetchingNextPage &&
      !isLoadingRef.current
    ) {
      isLoadingRef.current = true;
      prevScrollHeightRef.current = e.target.scrollHeight;
      onLoadMore();
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 500);
    }
  };

  const handleScrollToBottom = () => {
    const container = containerRef.current;
    if (container) {
      lastProgrammaticScrollRef.current = Date.now();
      container.scrollTop = container.scrollHeight - container.clientHeight;
      setShowScrollButton(false);
    }
  };

  return (
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
      className={
        isTeamChat
          ? "relative flex-1 overflow-y-auto bg-[#edf3f8] px-4 py-8 select-text sm:px-8"
          : isChartingAI
            ? "relative flex-1 overflow-y-auto bg-[#eef2f8] px-3 py-6 select-text sm:px-8"
            : isAssistanceAI
              ? "relative flex-1 overflow-y-auto bg-[#eef2f8] px-3 py-5 select-text sm:px-8"
              : "flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 relative select-text ml-1 pl-1"
      }
      style={
        isTeamChat
          ? {
              backgroundImage: "radial-gradient(#d7dee9 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }
          : undefined
      }
    >
      {isFetchingNextPage && (
        <div className="text-center text-sm text-gray-500 py-2">
          Loading older messages...
        </div>
      )}

      {groupedMessages.length === 0 ? (
        isAssistanceAI ? (
          <div className="flex h-full min-h-[520px] flex-col items-center justify-center">
            <div className="mx-auto mb-6 max-w-[360px] text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4c8cff] to-[#1f5de3] text-white shadow-[0_18px_42px_rgba(47,111,243,0.32)]">
                <LuSparkles size={28} />
              </div>
              <h2 className="text-base font-semibold text-[#111827]">
                Ask KyroAI any questions
              </h2>
              <p className="mt-2 text-sm font-medium leading-6 text-[#8b98ad]">
                Type your question, or tap{" "}
                <span className="font-semibold text-[#2B76F4]">Topics</span> to
                browse by department.
              </p>
            </div>
            <div className="w-full max-w-[390px] space-y-2">
              {starterQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => onStarterQuestionClick?.(question)}
                  disabled={isAiTyping}
                  className="group flex min-h-[44px] w-full items-center justify-between rounded-xl bg-white px-4 text-left text-sm font-medium leading-5 text-[#172033] shadow-[0_8px_22px_rgba(15,23,42,0.08)] ring-1 ring-[#e3e9f2] transition hover:-translate-y-0.5 hover:text-[#2B76F4] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="pr-3">{question}</span>
                  <FiChevronRight
                    className="shrink-0 text-[#b9c6d6] transition group-hover:text-[#2B76F4]"
                    size={18}
                  />
                </button>
              ))}
            </div>
          </div>
        ) : isChartingAI ? (
          <div className="flex h-full min-h-[520px] flex-col items-center pt-6 md:justify-center md:pt-0">
            <div className="mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2B76F4] md:hidden">
              New Case -{" "}
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className="mx-auto mb-5 hidden max-w-[300px] text-center md:block">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#cfe0ff] bg-[#eef5ff] text-[#2B76F4]">
                <LuSparkles size={25} />
              </div>
              <h2 className="text-base font-semibold text-[#284058]">
                Charting Assistant
              </h2>
              <p className="mt-2 text-sm leading-5 text-[#8d9ab3]">
                Ask me questions or use the action buttons above to generate
                charts and manage cases
              </p>
            </div>
            <div className="w-full space-y-2">
              {starterQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => onStarterQuestionClick?.(question)}
                  disabled={isAiTyping}
                  className="group flex min-h-[38px] w-full items-center justify-between rounded-xl bg-white px-4 text-left text-sm font-medium text-[#183452] shadow-sm ring-1 ring-[#dfe5ee] transition-colors hover:bg-[#f8fbff] hover:text-[#2B76F4] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="truncate pr-3">{question}</span>
                  <FiChevronRight
                    className="shrink-0 text-[#b9c6d6] transition-colors group-hover:text-[#2B76F4]"
                    size={18}
                  />
                </button>
              ))}
            </div>
          </div>
        ) : isTeamChat ? (
          <div className="flex h-full min-h-[360px] items-center justify-center px-4 text-center">
            <div className="max-w-[320px]">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-white text-[#2B76F4] shadow-[0_12px_28px_rgba(15,23,42,0.08)] ring-1 ring-[#dfe6f0]">
                <FiMessageCircle size={22} />
              </div>
              <h3 className="text-base font-semibold text-[#172033]">
                No messages yet
              </h3>
              <p className="mt-2 text-sm font-medium leading-6 text-[#8da0ba]">
                Send a message to start this conversation.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[220px] items-end justify-center px-2 pb-8 pt-6 sm:px-6 sm:pb-12">
            {starterQuestions.length > 0 ? (
              <div className="w-full max-w-4xl">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primarytransparent text-primary">
                    <FiMessageCircle size={19} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-semibold text-gray-900">
                      Start with AI Assistant
                    </h3>
                    <p className="text-sm text-gray-500">
                      Choose a question or type your own message below.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {starterQuestions.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => onStarterQuestionClick?.(question)}
                      disabled={isAiTyping}
                      className="group min-h-[62px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm leading-5 text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:bg-primarytransparent hover:text-primary hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="line-clamp-2">{question}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">
                Start messaging to begin the conversation.
              </p>
            )}
          </div>
        )
      ) : (
        groupedMessages.map((item, index) => {
          if (item.type === "date") {
            if (isTeamChat) return null;

            return (
              <div
                key={`date-${index}`}
                className="flex items-center justify-center my-4"
              >
                <div className="bg-gray-200 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
                  {formatDateLabel(item.dateObj)}
                </div>
              </div>
            );
          } else {
            if (isNewCaseSeparator(item.data)) {
              return (
                <NewCaseSeparator
                  key={getMessageKey(item.data, index)}
                  item={item.data}
                  isChartingAI={isChartingAI}
                />
              );
            }

            return (
              <MessageBubble
                key={getMessageKey(item.data, index)}
                msg={item.data}
                userId={userId}
                roomType={roomType}
                anchorMessageId={anchorMessageId}
                path={path}
              />
            );
          }
        })
      )}

      {isAiTyping &&
        (roomType === "ai" ||
          roomType === "ai_charting" ||
          path === "charting-ai") && (
        <div className="flex mb-4 items-start gap-2">
          <figure>
            <img
              src={aiAvater}
              alt=""
              className={`h-8 w-8 min-w-8 border ${isAssistanceAI || isChartingAI ? "rounded-xl border-[#dbe6f6]" : "rounded-full border-purple-200"}`}
            />
          </figure>
          <div
            className={`max-w-xs rounded-lg border px-4 py-2 ${isAssistanceAI || isChartingAI ? "border-[#e3e9f2] bg-white shadow-sm" : "border-purple-300 bg-purple-100"}`}
          >
            <div
              className={`mb-1 text-xs font-semibold ${isAssistanceAI || isChartingAI ? "text-[#2B76F4]" : "text-purple-600"}`}
            >
              {path === "charting-ai"
                ? "Chartly AI"
                : path === "assistance"
                  ? "KyroAI"
                  : "AI Assistant"}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">AI is thinking</span>
              <div className="flex gap-1 ml-1">
                <span
                  className={`h-1.5 w-1.5 animate-bounce rounded-full ${isAssistanceAI || isChartingAI ? "bg-[#2B76F4]" : "bg-purple-600"}`}
                  style={{ animationDelay: "0ms" }}
                ></span>
                <span
                  className={`h-1.5 w-1.5 animate-bounce rounded-full ${isAssistanceAI || isChartingAI ? "bg-[#2B76F4]" : "bg-purple-600"}`}
                  style={{ animationDelay: "150ms" }}
                ></span>
                <span
                  className={`h-1.5 w-1.5 animate-bounce rounded-full ${isAssistanceAI || isChartingAI ? "bg-[#2B76F4]" : "bg-purple-600"}`}
                  style={{ animationDelay: "300ms" }}
                ></span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div />

      {showScrollButton && (
        <button
          onClick={handleScrollToBottom}
          className="fixed bottom-[124px] right-5 z-30 flex h-9 w-9 cursor-pointer select-none items-center justify-center rounded-full bg-[#2B76F4] text-white shadow-lg transition-all duration-200 md:bottom-[92px] md:right-8 md:h-10 md:w-10"
          title="Scroll to latest message"
        >
          <FiChevronDown size={20} />
        </button>
      )}
    </div>
  );
};

export default MessageList;
