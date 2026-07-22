"use client";

import {
  useInfiniteQuery,
  useQueryClient,
  useQuery,
} from "@tanstack/react-query";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  FiChevronLeft,
  FiSend,
  FiInfo,
  FiPaperclip,
  FiX,
  FiPlus,
  FiList,
} from "react-icons/fi";
import { TbTrash } from "react-icons/tb";
import { LuSparkles, LuStethoscope } from "react-icons/lu";
import { MentionsInput, Mention } from "react-mentions";
import "./mentions.css";
import axiosApi from "../../../service/axiosInstance";
import { connectWebSocketForChat } from "./ChatService";
import { getAuthData } from "../../../config/Config";
import MessageList from "./MessageList";
import { useLocation } from "react-router-dom";
import ActionsDropdown from "./ActionsDropdown";
import ReactMarkdown from "react-markdown";

const AI_ASSISTANT_STARTER_QUESTIONS = [
  "Summarize my latest clinic conversations.",
  "Help me draft a professional patient message.",
  "What should I prioritize today?",
  "Create a checklist for a patient follow-up.",
  "Explain a clinical note in simple language.",
  "Suggest next steps for a team update.",
];

const CHARTING_STARTER_QUESTIONS = [
  "What ICD-10 codes apply to my chart?",
  "How do I choose the right E&M level?",
  "Suggest a plan for this diagnosis",
];

const EMPTY_ARRAY = [];

const getChatInitials = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const buildNewCaseSeparator = (separatorData = {}) => ({
  id:
    separatorData.id ||
    `newcase-${separatorData.room_id || "room"}-${Date.now()}`,
  type: "newcase_separator",
  is_separator: true,
  room_id: separatorData.room_id,
  created_at: separatorData.created_at || new Date().toISOString(),
});

const ChatPanel = ({
  chatRoom,
  roomType,
  activeTab,
  forwardedMessage,
  onForwardConsumed,
  avatar,
  avatarNode,
  draftMessage,
  onDraftConsumed,
  onBackToList,
  onOpenTopics,
}) => {
  const queryClient = useQueryClient();
  const [inputMessage, setInputMessage] = useState("");
  const [showActions, setShowActions] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isResettingCase, setIsResettingCase] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [forwardedDraft, setForwardedDraft] = useState("");
  const [chartingMode, setChartingMode] = useState(() => {
    if (typeof window === "undefined") return "chart";
    const savedMode = window.localStorage.getItem("chartingMode");
    return savedMode === "normal-text" || savedMode === "chart"
      ? savedMode
      : "chart";
  });
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const actionsDropdownRef = useRef(null);
  const shouldFetchMentionRef = useRef(false);
  const lastForwardedRef = useRef(null);
  const streamingMessageIdRef = useRef(null);

  // Auth
  const { userInfo } = getAuthData();
  const userId = userInfo?.user_id;
  const location = useLocation();
  const path = location.pathname.split("/")[2];
  const isChartingPage = path === "charting-ai";
  const isAssistancePage = path === "assistance";
  const isTeamChatPage = path === "communication";
  const isModernChatSurface =
    isChartingPage || isAssistancePage || isTeamChatPage;
  const isAiRoom =
    roomType === "ai" || roomType === "ai_charting" || path === "charting-ai";

  const addMessageToCache = useCallback(
    (message) => {
      if (!message?.id) {
        console.warn("addMessageToCache: No message ID", message);
        return;
      }

      queryClient.setQueryData(["messages", userId, chatRoom], (old) => {
        if (!old?.pages?.length) {
          console.warn(
            "addMessageToCache: old cache is empty or has no pages",
            old,
          );
          return old;
        }

        const exists = old.pages.some((page) =>
          page.results?.some(
            (currentMessage) => currentMessage.id === message.id,
          ),
        );

        if (exists) {
          console.log("addMessageToCache: message already exists", message.id);
          return old;
        }

        console.log("addMessageToCache: adding message to cache", message);
        return {
          ...old,
          pages: old.pages.map((page, index) =>
            index === 0
              ? { ...page, results: [message, ...(page.results || [])] }
              : page,
          ),
        };
      });
    },
    [chatRoom, queryClient, userId],
  );

  // =============================Fetch room members for mentions (group rooms only)=================================\\
  const { data: roomMembersData } = useQuery({
    queryKey: ["roomMembersForMentions", chatRoom],
    queryFn: async () => {
      const res = await axiosApi.get(`/api/v1/rooms/${chatRoom}/members/`);
      return res.data;
    },
    enabled: !!chatRoom && roomType === "group",
    staleTime: 5 * 60 * 1000,
  });
  // ======================================= Messages (HTTP with infinite scroll) =======================================\\
  const {
    data,
    error,
    isError,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
  } = useInfiniteQuery({
    queryKey: ["messages", userId, chatRoom],
    enabled: !!chatRoom,
    queryFn: async ({ pageParam = null }) => {
      const res = await axiosApi.get(`/api/v1/rooms/${chatRoom}/messages/`, {
        params: { cursor: pageParam },
      });

      return res.data;
    },
    getNextPageParam: (lastPage) => lastPage?.next_cursor ?? null,
    getPreviousPageParam: (firstPage) => firstPage?.previous_cursor ?? null,
    initialPageParam: null,
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Diagnostic useEffect
  useEffect(() => {
    console.log(
      "[Diagnostic] Component mounted. chatRoom:",
      chatRoom,
      "userId:",
      userId,
    );
    if (!chatRoom) return;

    const runDiagnostic = async () => {
      try {
        console.log("[Diagnostic] Fetching messages manually...");
        const res = await axiosApi.get(`/api/v1/rooms/${chatRoom}/messages/`);
        console.log("[Diagnostic] Manual fetch successful:", res.data);
      } catch (err) {
        console.error("[Diagnostic] Manual fetch failed:", err);
      }

      const cacheState = queryClient.getQueryState([
        "messages",
        userId,
        chatRoom,
      ]);
      console.log("[Diagnostic] React Query cache state:", cacheState);
    };

    runDiagnostic();
  }, [chatRoom, userId, queryClient]);

  // ...........................**Chat info**........................... //
  // data?.pages[0].chatInfo)
  const safeUser = {
    name: data?.pages[0]?.room?.name || "Unknown User",
    role: data?.pages[0]?.room?.display_role || "unknown",
    avatar:
      `https://backend.getkyroai.com${data?.pages[0]?.room?.image}` ||
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Chat",
  };
  const headerAvatar = avatar
    ? `https://backend.getkyroai.com${avatar}`
    : safeUser.avatar;

  const isInputDisabled =
    data?.pages[0]?.room?.chat_blocked ||
    path === "user-management" ||
    data?.pages[0]?.room?.can_send === false;

  const inputPlaceholder = data?.pages[0]?.room?.chat_blocked
    ? "Chat is blocked. You are not allowed to send messages until unblocked."
    : data?.pages[0]?.room?.can_send === false
      ? "User is currently inactive. Cannot send messages."
      : isChartingPage
        ? "Ask about coding, levels, or documentation..."
        : isAssistancePage
          ? "Ask KyroAI any questions..."
          : isTeamChatPage
            ? "Message or /ask to query AI..."
            : "Type your message...";

  // Flatten and reverse to show oldest -> newest
  const messages = useMemo(() => {
    console.log(
      "Recomputing messages. data:",
      data,
      "isError:",
      isError,
      "error:",
      error,
    );
    const list = data?.pages.flatMap((p) => p.results) ?? [];
    // Ensure deterministic order oldest -> newest
    const sorted = [...list].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at),
    );
    console.log("Sorted messages:", sorted);
    return sorted;
  }, [data]);

  // Anchor message id when navigating from notification
  const [anchorMessageId, setAnchorMessageId] = useState(null);
  const mentionMessageId = useMemo(() => {
    const raw = location.state?.messageId;
    return raw !== undefined && raw !== null ? Number(raw) : null;
  }, [location.state?.messageId]);

  // Track when we have a valid mention to fetch
  useEffect(() => {
    if (mentionMessageId && !anchorMessageId) {
      shouldFetchMentionRef.current = true;
    }
  }, [mentionMessageId, anchorMessageId]);

  // When location.state changes (mention notification clicked while on same route)
  useEffect(() => {
    if (mentionMessageId && anchorMessageId !== mentionMessageId) {
      setAnchorMessageId(null); // Reset to trigger mention detection
    }
  }, [location.state?.messageId, mentionMessageId]);

  // Reset anchor when switching rooms
  useEffect(() => {
    setAnchorMessageId(null);
    // Don't reset shouldFetchMentionRef here - let the mention detection effect handle it
  }, [chatRoom]);

  // Auto-fetch until mention message is found (ONLY if we have a valid mention)
  useEffect(() => {
    if (
      !shouldFetchMentionRef.current ||
      !chatRoom ||
      !mentionMessageId ||
      !data
    )
      return;

    // Check if message exists in current loaded messages
    const messageExists = messages.some((m) => m.id === mentionMessageId);

    if (messageExists) {
      if (anchorMessageId !== mentionMessageId) {
        setAnchorMessageId(mentionMessageId);
        shouldFetchMentionRef.current = false; // Stop fetching
        // Clear location state after message is anchored
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }
      return;
    }

    // If message not found and we have more pages, keep fetching
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    } else if (!hasNextPage) {
      shouldFetchMentionRef.current = false; // Stop fetching
    }
  }, [
    chatRoom,
    mentionMessageId,
    messages.length,
    hasNextPage,
    isFetchingNextPage,
    data,
    anchorMessageId,
  ]);

  useEffect(() => {
    if (!forwardedMessage) return;
    if (lastForwardedRef.current === forwardedMessage) return;

    lastForwardedRef.current = forwardedMessage;
    setForwardedDraft(forwardedMessage);

    if (textareaRef.current) {
      textareaRef.current.focus();
    }

    if (typeof onForwardConsumed === "function") {
      onForwardConsumed();
    }
  }, [forwardedMessage, onForwardConsumed]);

  useEffect(() => {
    if (!draftMessage) return;
    setInputMessage(draftMessage);
    requestAnimationFrame(() => textareaRef.current?.focus());
    if (typeof onDraftConsumed === "function") {
      onDraftConsumed();
    }
  }, [draftMessage, onDraftConsumed]);

  // WebSocket for real-time messages
  useEffect(() => {
    if (!chatRoom) return;

    const socket = connectWebSocketForChat({
      roomId: chatRoom,

      onMessage: (payload) => {
        // Handle AI stream
        if (payload.type === "ai_stream") {
          const streamData = payload.data;

          if (streamData.phase === "start") {
            console.log("AI stream start", streamData);
            // Turn off the typing indicator since we started streaming
            setIsAiTyping(false);
            streamingMessageIdRef.current = `stream-${streamData.message_id}`;
            const optimisticMsg = {
              id: streamingMessageIdRef.current,
              content: "",
              is_ai: true,
              created_at: new Date().toISOString(),
              sender: { id: "ai", name: "Chartly AI", role: "ai", picture: "" },
              room_id: streamData.room_id,
            };
            addMessageToCache(optimisticMsg);
          } else if (
            streamData.phase === "chunk" &&
            streamingMessageIdRef.current
          ) {
            console.log("AI stream chunk", streamData.chunk);
            queryClient.setQueryData(["messages", userId, chatRoom], (old) => {
              if (!old?.pages?.length) {
                console.warn("Chunk: old cache has no pages", old);
                return old;
              }
              return {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  results: page.results.map((msg) =>
                    msg.id === streamingMessageIdRef.current
                      ? {
                          ...msg,
                          content: msg.content + (streamData.chunk || ""),
                        }
                      : msg,
                  ),
                })),
              };
            });
          } else if (streamData.phase === "done") {
            const finalMessage = streamData.message;
            if (finalMessage) {
              queryClient.setQueryData(
                ["messages", userId, chatRoom],
                (old) => {
                  if (!old?.pages?.length) return old;
                  return {
                    ...old,
                    pages: old.pages.map((page) => ({
                      ...page,
                      results: page.results.map((msg) =>
                        msg.id === streamingMessageIdRef.current
                          ? finalMessage
                          : msg,
                      ),
                    })),
                  };
                },
              );
            }
            streamingMessageIdRef.current = null;
            setIsAiTyping(false);
          }
          return;
        }

        if (payload.type !== "message") return;
        const newMessage = payload.data;
        const isNewCaseSeparator =
          newMessage?.type === "newcase_separator" || newMessage?.is_separator;
        const cacheMessage = isNewCaseSeparator
          ? buildNewCaseSeparator(newMessage)
          : newMessage;
        if (!cacheMessage) return;

        // Turn off AI typing indicator when AI responds
        if (cacheMessage?.is_ai && isAiRoom) {
          setIsAiTyping(false);
        }

        addMessageToCache(cacheMessage);
      },
    });

    return () => socket.close();
  }, [chatRoom, queryClient, userId, isAiRoom]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!showActions) return;
      if (
        actionsDropdownRef.current &&
        !actionsDropdownRef.current.contains(event.target)
      ) {
        setShowActions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showActions]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("chartingMode", chartingMode);
    }
  }, [chartingMode]);

  const sendMessage = useCallback(
    async ({ content, files = [], suppressAiTyping = false }) => {
      if (!content.trim() && files.length === 0) return;
      if (isAiRoom && isAiTyping) return;

      const optimisticMsg =
        content === "newcase"
          ? buildNewCaseSeparator({ room_id: chatRoom })
          : {
              id: `temp-${Date.now()}`,
              content: content,
              text: content,
              is_ai: false,
              room_id: chatRoom,
              created_at: new Date().toISOString(),
              sender: {
                id: userId,
                name: safeUser.name,
                picture: safeUser.avatar,
              },
              avatar: safeUser.avatar,
              attachments: files.map((f, i) => ({
                id: `temp-att-${Date.now()}-${i}`,
                url: URL.createObjectURL(f),
                name: f.name,
                file_type: f.type,
              })),
            };

      addMessageToCache(optimisticMsg);
      setInputMessage("");

      // Show AI typing indicator if this is an AI chat
      if (isAiRoom && !suppressAiTyping) {
        setIsAiTyping(true);
      }

      // Helper: extract mention ids from react-mentions markup @[__display__](__id__)
      const extractMentionIdsFromMarkup = (text) => {
        const ids = [];
        if (!text) return ids;
        const regex = /@\[(.+?)\]\((.+?)\)/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
          // match[2] is the id per our markup
          ids.push(match[2]);
        }
        // Ensure uniqueness and keep only numeric user IDs for backend mention_user_ids.
        return Array.from(new Set(ids)).filter((id) =>
          /^\d+$/.test(String(id)),
        );
      };

      // Helper: convert markup to plain text, e.g. @[John Doe](2) => @John Doe
      const toPlainText = (text) =>
        (text || "").replace(/@\[(.+?)\]\((.+?)\)/g, "@$1");

      // Prepare payload
      const mentionIds = extractMentionIdsFromMarkup(content);
      const contentPlain = toPlainText(content).trim();

      // .................................................** Send Messages **.............................................. //
      try {
        const formData = new FormData();
        // Just appent paylod fields to formData
        formData.append("content", contentPlain);
        const messageType =
          path === "charting-ai"
            ? chartingMode === "chart"
              ? "chart"
              : "chart"
            : "text";
        formData.append("message_type", messageType);
        if (mentionIds.length > 0) {
          // Backend expects comma-separated IDs (e.g., "2,5"); single value is fine too
          formData.append("mention_user_ids", mentionIds.join(","));
        }

        // Append attachments
        if (files.length > 0) {
          files.forEach((file) => {
            formData.append("attachments", file);
          });
        }

        const resp = await axiosApi.post(
          `/api/v1/rooms/${chatRoom}/send/`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        const responseData = resp?.data?.data;
        const isNewCaseSeparator =
          responseData?.type === "newcase_separator" ||
          responseData?.is_separator;

        if (isNewCaseSeparator) {
          const separator = buildNewCaseSeparator(responseData);
          addMessageToCache(separator);
        }

        setAttachments([]);
      } catch (err) {
        // Turn off typing indicator on error
        if (isAiRoom) {
          setIsAiTyping(false);
        }
      } finally {
        // Remove the optimistic message since the real one will arrive via WebSocket
        queryClient.setQueryData(["messages", userId, chatRoom], (old) => {
          if (!old?.pages?.length) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              results: page.results?.filter(
                (msg) => msg.id !== optimisticMsg.id,
              ),
            })),
          };
        });
      }
    },
    [
      chatRoom,
      path,
      roomType,
      userId,
      isAiRoom,
      isAiTyping,
      chartingMode,
      safeUser.avatar,
      addMessageToCache,
      queryClient,
    ],
  );

  // ============================================Send message with optimistic update=====================================\\
  const handleSendMessage = async () => {
    if (isAiRoom && isAiTyping) return;

    const trimmedInput = inputMessage.trim();
    if (forwardedDraft && trimmedInput) {
      const combined = `**Forwarded message:** \n> ${forwardedDraft.replace(/\n/g, "\n> ")}\n\n---\n\n**Added Query:** \n>${trimmedInput}`;
      await sendMessage({ content: combined, files: attachments });
      setForwardedDraft("");
      return;
    }

    await sendMessage({ content: inputMessage, files: attachments });
  };

  const handleResetCase = useCallback(async () => {
    if (isResettingCase) return;
    setIsResettingCase(true);
    try {
      await sendMessage({ content: "newcase", suppressAiTyping: true });
    } finally {
      setIsResettingCase(false);
    }
  }, [sendMessage, isResettingCase]);

  const handleStarterQuestionClick = useCallback(
    async (question) => {
      if (isInputDisabled || isAiTyping) return;
      await sendMessage({ content: question, files: [] });
    },
    [isInputDisabled, isAiTyping, sendMessage],
  );

  const handleInputChange = (e) => {
    const el = e.target;
    setInputMessage(el.value);
    // Auto-resize up to 150px height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const nextHeight = Math.min(textareaRef.current.scrollHeight, 150);
      textareaRef.current.style.height = `${nextHeight}px`;
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const allowedExtensions = [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "svg",
      "xls",
      "xlsx",
      "csv",
      "doc",
      "docx",
      "pdf",
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const validFiles = files.filter((file) => {
      const fileExtension = file.name.split(".").pop().toLowerCase();
      const isValidExtension = allowedExtensions.includes(fileExtension);
      const isValidSize = file.size <= maxSize;

      return isValidExtension && isValidSize;
    });

    setAttachments((prev) => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  // Members filtered for mention suggestions
  const members = roomMembersData?.results ?? [];
  const mentionData = useMemo(() => {
    const data = members.map((m) => ({
      id: String(m.id),
      display: m.name || m.username || "Unknown User",
    }));

    // Add test data if no members loaded
    let mentionList = data;

    if (data.length === 0) {
      mentionList = [
        { id: "1", display: "Rafit jr_staff" },
        { id: "2", display: "Fugit magna" },
        { id: "3", display: "Dolor Test" },
      ];
    }
    // ========================================== Ensure AI mention is always present for AI rooms ========================================= \\
    const hasAiMention = mentionList.some(
      (item) => String(item.display).trim().toLowerCase() === "ai",
    );

    // Keep AI mention always as the final option in the suggestions list.
    if (!hasAiMention) {
      mentionList = [...mentionList, { id: "ai_assistant", display: "AI" }];
    }

    return mentionList;
  }, [members]);

  return (
    <div
      className={
        isModernChatSurface
          ? "flex h-full min-h-0 flex-col overflow-hidden bg-[#eef2f8]"
          : "flex flex-col h-full border border-gray-300 rounded-lg bg-white/50 overflow-hidden"
      }
    >
      {!chatRoom ? (
        <div className="flex flex-1 items-center justify-center bg-[#eef2f8] text-sm font-medium text-[#6b7890]">
          {isAssistancePage ? "Preparing KyroAI..." : "Select a chat"}
        </div>
      ) : (
        <>
          {/* Header */}
          {isChartingPage ? (
            <>
              <header className="flex min-h-[64px] items-center justify-between gap-3 bg-[#172640] px-3 py-2 text-white shadow-sm md:gap-4 md:px-5 md:py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#5b91ff] to-[#2B76F4] shadow-[0_10px_24px_rgba(43,118,244,0.32)] md:h-10 md:w-10">
                    <LuStethoscope size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="hidden text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9dc0ff] md:block">
                      Physician Workstation
                    </p>
                    <h1 className="truncate text-[13px] font-semibold leading-5 text-white md:text-base">
                      Chartly
                    </h1>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {/* <button
                  type="button"
                  onClick={() => setChartingMode("chart")}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7d2fe3] text-white shadow-[0_8px_18px_rgba(125,47,227,0.28)] transition-colors hover:bg-[#8b3df0] md:h-8 md:w-auto md:gap-2 md:rounded-full md:px-4 md:text-xs md:font-semibold md:uppercase"
                  title="Chart mode"
                >
                  <LuSparkles size={14} />
                  <span className="hidden md:inline">Chart</span>
                </button> */}
                  <button
                    type="button"
                    onClick={handleResetCase}
                    disabled={isInputDisabled || isAiTyping || isResettingCase}
                    className="flex h-9 w-9 items-center hover:cursor-pointer disabled:hover:cursor-not-allowed justify-center rounded-xl border border-white/15 bg-white/[0.08] text-[#b6c5dc] transition-colors hover:bg-white/[0.14] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 md:h-8 md:w-auto md:gap-1.5 md:rounded-full md:px-3 md:text-xs md:font-semibold md:uppercase"
                    title="Start a new case"
                  >
                    {isResettingCase ? (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white mr-1" />
                    ) : (
                      <FiPlus size={14} />
                    )}
                    <span className="hidden md:inline">
                      {isResettingCase ? "Starting..." : "New Case"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputMessage("");
                      setAttachments([]);
                      setForwardedDraft("");
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/30 bg-red-500/10 text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-200 md:h-8 md:w-10 md:rounded-full"
                    title="Clear draft"
                    aria-label="Clear draft"
                  >
                    <TbTrash size={15} />
                  </button>
                  <div className="hidden h-8 items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9fb0c8] xl:flex">
                    <FiInfo size={14} />
                    Decision Support - Not Diagnostic - Physician Judgment
                    Required
                  </div>
                </div>
              </header>
              <div className="flex min-h-[56px] items-center justify-between gap-3 border-b border-[#dbe2ed] bg-white px-4 md:min-h-[50px] md:px-5">
                <div className="flex min-w-0 items-center gap-2 text-[13px] font-medium text-[#35445c] md:text-sm">
                  <LuSparkles size={17} className="text-[#2B76F4]" />
                  <span className="truncate">AI Code & Chart Assistant</span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 md:hidden">
                  {["/code", "/emcode", "/soap"].map((command) => (
                    <button
                      key={command}
                      type="button"
                      onClick={() => setInputMessage(command)}
                      className="h-8 rounded-lg border border-[#cfe0ff] bg-[#eef5ff] px-3 text-[11px] font-semibold text-[#2B76F4]"
                    >
                      {command}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : isAssistancePage ? (
            <header className="flex min-h-[56px] items-center justify-between gap-4 border-b border-[#dfe3ea] bg-white px-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#2B76F4]">
                  AI Assistant
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <h1 className="text-base font-semibold leading-5 text-[#111827]">
                    KyroAI
                  </h1>
                  <LuSparkles size={16} className="text-[#2B76F4]" />
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenTopics}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[#cfe0ff] bg-[#f6faff] px-4 text-sm font-semibold text-[#2B76F4] shadow-[0_8px_18px_rgba(43,118,244,0.08)] transition hover:border-[#aac8ff] hover:bg-[#eef5ff] md:hidden"
                title="Browse topics"
              >
                <FiList size={16} />
                Topics
              </button>
            </header>
          ) : isTeamChatPage ? (
            <header
              className={`flex min-h-[64px] items-center justify-between gap-3 border-b border-[#e7ecf3] bg-white px-4 py-2 text-[#101827] shadow-none md:min-h-[70px] md:border-b-0 md:px-5 md:py-3 md:text-white md:shadow-sm ${roomType === "group" ? "md:bg-[#9f171d]" : "md:bg-[#172640]"}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                {typeof onBackToList === "function" && (
                  <button
                    type="button"
                    onClick={onBackToList}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#8291a7] transition hover:bg-[#f3f6fa] hover:text-[#172640] md:hidden"
                    title="Back to conversations"
                    aria-label="Back to conversations"
                  >
                    <FiChevronLeft size={20} />
                  </button>
                )}
                <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#c7a7f3] text-sm font-semibold text-white md:h-10 md:w-10 md:bg-white/15 md:ring-1 md:ring-white/20">
                  {avatar ? (
                    <img
                      src={headerAvatar}
                      className="h-full w-full object-cover"
                      alt=""
                    />
                  ) : (
                    <span>{getChatInitials(safeUser.name)}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9aa6b8] md:text-[11px] md:text-white/65">
                    {roomType === "group" ? "Team Channel" : "Direct Message"}
                  </p>
                  <h1 className="truncate text-[14px] font-semibold leading-5 text-[#050b18] md:text-base md:text-white">
                    {safeUser.name}
                  </h1>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                {data?.pages[0]?.room?.chat_blocked && (
                  <span className="rounded-full border border-red-200/30 bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-100">
                    Blocked
                  </span>
                )}
                <div
                  ref={actionsDropdownRef}
                  className={`relative hidden md:block ${data?.pages[0]?.room?.type === "ai" ? "md:hidden" : ""} `}
                >
                  <button
                    type="button"
                    className={`grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/15 hover:text-white ${path === "user-management" || path === "charting-ai" || path === "clinicwise-chat-history" ? "hidden" : ""}`}
                    onClick={() => setShowActions(!showActions)}
                    title="Conversation actions"
                  >
                    <FiInfo size={18} />
                  </button>

                  <ActionsDropdown
                    showActions={showActions}
                    onEditDetails={() => {}}
                    onAddMember={() => {}}
                    onBlockMember={() => {}}
                    onDeleteChat={() => setShowActions(false)}
                    chatInfo={data?.pages[0]?.room}
                  />
                </div>
              </div>
            </header>
          ) : (
            <div className="p-3 sm:p-4 border-b border-gray-300 flex justify-between items-center relative">
              <div className="flex gap-3 items-start justify-between w-full">
                <div className="flex items-start gap-2 min-w-0">
                  {avatarNode || (
                    <img
                      src={headerAvatar}
                      className="w-10 h-10 rounded-full"
                      alt=""
                    />
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold truncate max-w-[150px] sm:max-w-[260px]">
                      {path === "charting-ai" ? "Chartly AI" : safeUser.name}
                    </div>
                    <div className="text-xs text-primary font-medium">
                      {safeUser.role}
                    </div>
                  </div>
                </div>

                {/* Blocked status */}
                {data?.pages[0]?.room?.chat_blocked && (
                  <div>
                    <p className="text-red-500 font-semibold">Blocked</p>
                  </div>
                )}

                {/* Button at the end */}
              </div>

              <div
                ref={actionsDropdownRef}
                className={`relative ${data?.pages[0]?.room?.type === "ai" ? "hidden" : ""} `}
              >
                <FiInfo
                  size={20}
                  className={`cursor-pointer ${path === "user-management" || path === "charting-ai" || path === "clinicwise-chat-history" ? "hidden" : ""}`}
                  onClick={() => setShowActions(!showActions)}
                />

                <ActionsDropdown
                  showActions={showActions}
                  onEditDetails={() => {}}
                  onAddMember={() => {}}
                  onBlockMember={() => {}}
                  onDeleteChat={() => setShowActions(false)}
                  chatInfo={data?.pages[0]?.room}
                />
              </div>
            </div>
          )}
          {/* Message List */}
          <MessageList
            key={chatRoom}
            messages={messages}
            userId={userId}
            onLoadMore={fetchNextPage}
            fetchPreviousPage={fetchPreviousPage}
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            isFetchingNextPage={isFetchingNextPage}
            isFetchingPreviousPage={isFetchingPreviousPage}
            roomType={roomType}
            isAiTyping={isAiTyping}
            anchorMessageId={anchorMessageId}
            path={path}
            starterQuestions={
              isChartingPage
                ? CHARTING_STARTER_QUESTIONS
                : isAssistancePage
                  ? EMPTY_ARRAY
                  : roomType === "ai"
                    ? AI_ASSISTANT_STARTER_QUESTIONS
                    : EMPTY_ARRAY
            }
            onStarterQuestionClick={handleStarterQuestionClick}
          />

          {/* ........................................................Input Area For send text................................................ */}
          <div
            className={
              isModernChatSurface
                ? `border-t border-[#dfe5ef] px-3 py-2.5 shadow-[0_-8px_22px_rgba(15,23,42,0.04)] md:bg-white/95 md:px-4 md:py-3 ${isChartingPage ? "bg-white" : "bg-[#f7faff]"}`
                : "p-2 sm:p-4 border-t border-gray-300"
            }
          >
            {/* ====================================== Forwarded message display ==================================== */}
            {forwardedDraft && (
              <div className="mb-3 rounded-lg border border-gray-300 bg-gray-50 p-3 max-h-[140px] overflow-y-auto">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-semibold text-gray-600">
                    Forwarded message details
                  </div>
                  <button
                    type="button"
                    onClick={() => setForwardedDraft("")}
                    className="text-gray-500 hover:text-gray-700"
                    title="Remove forwarded message"
                  >
                    <FiX size={14} />
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap break-words">
                  {/* {forwardedDraft} */}
                  <ReactMarkdown>{forwardedDraft}</ReactMarkdown>
                </div>
              </div>
            )}
            {/* File attachments preview */}
            {attachments.length > 0 &&
              (roomType === "group" ||
                roomType === "private" ||
                roomType === "ai" ||
                roomType === "ai_charting" ||
                isChartingPage) && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg"
                    >
                      <FiPaperclip size={16} className="text-gray-600" />
                      <span className="text-sm text-gray-700 max-w-[200px] truncate">
                        {file.name}
                      </span>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            <div className="flex items-center gap-2 sm:gap-3 w-full min-w-0">
              {/* ===================================== File upload button ================================== */}
              {(roomType === "group" ||
                roomType === "private" ||
                roomType === "ai_charting" ||
                isChartingPage ||
                (roomType === "ai" && !isAssistancePage)) && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.xls,.xlsx,.csv,.doc,.docx,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={handleFileInputClick}
                    disabled={isInputDisabled}
                    className={
                      isTeamChatPage
                        ? "grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#a5d9ee] bg-[#e3f9ff] text-[#15a0d3] shadow-sm transition hover:border-[#2B76F4] hover:text-[#2B76F4] disabled:opacity-50 md:border-[#d8dee8] md:bg-white md:text-[#74839f]"
                        : isModernChatSurface
                          ? "grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#d8dee8] bg-white text-[#74839f] shadow-sm transition hover:border-[#2B76F4] hover:text-[#2B76F4] disabled:opacity-50 cursor-pointer"
                          : "text-gray-600 hover:text-gray-800 disabled:opacity-50 cursor-pointer shrink-0"
                    }
                    title="Attach files"
                  >
                    {isTeamChatPage ? (
                      <>
                        <LuSparkles className="md:hidden" size={17} />
                        <FiPaperclip className="hidden md:block" size={18} />
                      </>
                    ) : (
                      <FiPaperclip size={isModernChatSurface ? 18 : 24} />
                    )}
                  </button>
                </>
              )}

              {roomType === "group" ? (
                <div className="flex-1 relative min-w-0 ">
                  <MentionsInput
                    className={
                      isTeamChatPage
                        ? "mentions mentions--team"
                        : "mentions mentions--multiLine"
                    }
                    inputClassName="mentions__input"
                    highlighterClassName="mentions__highlighter"
                    controlClassName="mentions__control"
                    suggestionsClassName="mentions__suggestions__list"
                    suggestionClassName="mentions__suggestions__item"
                    value={inputMessage}
                    onChange={(e) => handleInputChange(e)}
                    onKeyDown={handleInputKeyDown}
                    placeholder={inputPlaceholder}
                    disabled={isInputDisabled}
                    singleLine={false}
                    allowSuggestionsAboveCursor={true}
                    forceSuggestionsAboveCursor={true}
                    a11ySuggestionsListLabel="Suggested mentions"
                  >
                    <Mention
                      trigger="@"
                      data={mentionData}
                      displayTransform={(id, display) => `@${display}`}
                      markup="@[__display__](__id__)"
                      mentionClassName="mentions__mention"
                      renderSuggestion={(suggestion) => {
                        return (
                          <div
                            style={{
                              padding: "8px 12px",
                              maxHeight: "50vh",
                              overflowY: "auto",
                            }}
                          >
                            {suggestion.display}
                          </div>
                        );
                      }}
                    />
                  </MentionsInput>
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  rows={isModernChatSurface ? 1 : 2}
                  disabled={isInputDisabled}
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyDown}
                  placeholder={inputPlaceholder}
                  className={`flex-1 min-w-0 resize-none overflow-y-auto border outline-none ${
                    isModernChatSurface
                      ? `${isChartingPage ? "min-h-[42px] rounded-xl border-[#d8dee8] bg-white px-4 py-2.5 text-sm text-[#172033] shadow-[0_2px_8px_rgba(15,23,42,0.10)] placeholder:text-[#9aa9c0]" : "min-h-[40px] rounded-xl border-[#d8dee8] bg-white px-4 py-2 text-sm text-[#172033] shadow-[0_2px_8px_rgba(15,23,42,0.08)] placeholder:text-[#91a0b6]"}`
                      : "rounded-lg border-gray-300 p-2 text-base min-h-[70px] sm:min-h-[100px]"
                  } ${data?.pages[0]?.room?.chat_blocked || data?.pages[0]?.room?.can_send === false ? "placeholder:text-red-500" : ""}`}
                  style={
                    isModernChatSurface
                      ? {
                          minHeight: isChartingPage ? "42px" : "40px",
                          maxHeight: "120px",
                        }
                      : { minHeight: "70px", maxHeight: "220px" }
                  }
                />
              )}
              <button
                onClick={handleSendMessage}
                disabled={
                  (!inputMessage.trim() && attachments.length === 0) ||
                  isInputDisabled ||
                  (isAiRoom && isAiTyping)
                }
                className={
                  isModernChatSurface
                    ? `${isChartingPage ? "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#9dbdff] text-white shadow-[0_8px_18px_rgba(43,118,244,0.24)] transition-colors hover:bg-[#7fa9ff] disabled:cursor-not-allowed disabled:opacity-50 md:bg-[#2B76F4] md:hover:bg-[#1f68e8]" : "flex h-10 min-w-[72px] shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[#a9bef3] px-4 text-[12px] font-semibold uppercase text-white shadow-[0_8px_18px_rgba(91,128,220,0.24)] transition-colors hover:bg-[#8fa9ed] disabled:cursor-not-allowed disabled:opacity-50 md:w-10 md:min-w-10 md:rounded-full md:bg-[#2B76F4] md:px-0 md:hover:bg-[#1f68e8]"}`
                    : "disabled:opacity-50 cursor-pointer shrink-0"
                }
                title={
                  isAiRoom && isAiTyping
                    ? "Please wait, AI is responding..."
                    : "Send Messages"
                }
              >
                {isTeamChatPage ? (
                  <>
                    <span className="md:hidden">Send</span>
                    <FiSend className="hidden md:block" size={18} />
                  </>
                ) : (
                  <FiSend size={isModernChatSurface ? 18 : 24} />
                )}
              </button>
            </div>

            {path === "user-management" && (
              <p className="mt-2 text-sm text-red-600 font-medium">
                You are not allowed to send messages.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ChatPanel;
