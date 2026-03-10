"use client";

import { useInfiniteQuery, useQueryClient, useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo, useRef } from "react";
import { FiSend, FiInfo, FiPaperclip, FiX } from "react-icons/fi";
import { MentionsInput, Mention } from "react-mentions";
import "./mentions.css";
import axiosApi from "../../../service/axiosInstance";
import { connectWebSocketForChat } from "./ChatService";
import { getAuthData } from "../../../config/Config";
import MessageList from "./MessageList";
import { useLocation } from "react-router-dom";
import ActionsDropdown from "./ActionsDropdown";
import { CiCirclePlus } from "react-icons/ci";
import ReactMarkdown from 'react-markdown';

const ChatPanel = ({ chatRoom, roomType, activeTab, forwardedMessage, onForwardConsumed, avatar, avatarNode }) => {

  const queryClient = useQueryClient();
  const [inputMessage, setInputMessage] = useState("");
  const [showActions, setShowActions] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [forwardedDraft, setForwardedDraft] = useState("");
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const actionsDropdownRef = useRef(null);
  const shouldFetchMentionRef = useRef(false);
  const lastForwardedRef = useRef(null);

  // Auth
  const { userInfo } = getAuthData();
  const userId = userInfo?.user_id;
  const location = useLocation();
  const path = location.pathname.split('/')[2];
  const isAiRoom = roomType === "ai" || path === "charting-ai";

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
      const res = await axiosApi.get(
        `/api/v1/rooms/${chatRoom}/messages/`,
        { params: { cursor: pageParam } }
      );

      return res.data;
    },
    getNextPageParam: (lastPage) => lastPage?.next_cursor ?? null,
    getPreviousPageParam: (firstPage) => firstPage?.previous_cursor ?? null,
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    gcTime: 10 * 60 * 1000,   // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Flatten and reverse to show oldest -> newest
  const messages = useMemo(() => {
    const list = data?.pages.flatMap((p) => p.results) ?? [];
    // Ensure deterministic order oldest -> newest
    return [...list].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
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
    if (!shouldFetchMentionRef.current || !chatRoom || !mentionMessageId || !data) return;

    // Check if message exists in current loaded messages
    const messageExists = messages.some((m) => m.id === mentionMessageId);

    if (messageExists) {
      if (anchorMessageId !== mentionMessageId) {
        setAnchorMessageId(mentionMessageId);
        shouldFetchMentionRef.current = false; // Stop fetching
        // Clear location state after message is anchored
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      return;
    }

    // If message not found and we have more pages, keep fetching
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    } else if (!hasNextPage) {
      shouldFetchMentionRef.current = false; // Stop fetching
    }
  }, [chatRoom, mentionMessageId, messages.length, hasNextPage, isFetchingNextPage, data, anchorMessageId]);

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

  // WebSocket for real-time messages
  useEffect(() => {
    if (!chatRoom) return;

    const socket = connectWebSocketForChat({
      roomId: chatRoom,

      onMessage: (payload) => {
        if (payload.type !== "message") return;
        const newMessage = payload.data;

        // Turn off AI typing indicator when AI responds
        if (newMessage?.is_ai && isAiRoom) {
          setIsAiTyping(false);
        }

        queryClient.setQueryData(["messages", userId, chatRoom], (old) => {
          if (!old) return old;

          const exists = old.pages.some((p) =>
            p.results.some((m) => m.id === newMessage.id)
          );

          if (exists) return old;

          // Always add new messages to the FIRST page (page 0), not last page
          // First page = newest messages, last page = oldest messages
          return {
            ...old,
            pages: old.pages.map((p, i) =>
              i === 0
                ? { ...p, results: [newMessage, ...p.results] }
                : p
            ),
          };
        });
      },
    });

    return () => socket.close();
  }, [chatRoom, queryClient, userId, isAiRoom]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!showActions) return;
      if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(event.target)) {
        setShowActions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showActions]);

  const sendMessage = async ({ content, files = [] }) => {
    if (!content.trim() && files.length === 0) return;
    if (isAiRoom && isAiTyping) return;

    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      text: content,
      created_at: new Date().toISOString(),
      sender: { id: userId },
      avatar: safeUser.avatar,
    };

    setInputMessage("");

    // Show AI typing indicator if this is an AI chat
    if (isAiRoom) {
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
      return Array.from(new Set(ids)).filter((id) => /^\d+$/.test(String(id)));
    };

    // Helper: convert markup to plain text, e.g. @[John Doe](2) => @John Doe
    const toPlainText = (text) =>
      (text || "").replace(/@\[(.+?)\]\(.+?\)/g, "@$1");

    // Prepare payload
    const mentionIds = extractMentionIdsFromMarkup(content);
    const contentPlain = toPlainText(content).trim();

    // .................................................** Send Messages **.............................................. //
    try {
      const formData = new FormData();
      // Just appent paylod fields to formData
      formData.append("content", contentPlain);
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

      const resp = await axiosApi.post(`/api/v1/rooms/${chatRoom}/send/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setAttachments([]);
    } catch (err) {
      // Turn off typing indicator on error
      if (isAiRoom) {
        setIsAiTyping(false);
      }
    }
  };

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

  const handleResetCase = async () => {
    await sendMessage({ content: "new case" });
  };





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
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'xls', 'xlsx', 'csv', 'doc', 'docx', 'pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const validFiles = files.filter(file => {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const isValidExtension = allowedExtensions.includes(fileExtension);
      const isValidSize = file.size <= maxSize;

      return isValidExtension && isValidSize;
    });

    setAttachments(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
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
        { id: '1', display: 'Rafit jr_staff' },
        { id: '2', display: 'Fugit magna' },
        { id: '3', display: 'Dolor Test' },
      ];
    }
    // ========================================== Ensure AI mention is always present for AI rooms ========================================= \\
    const hasAiMention = mentionList.some(
      (item) => String(item.display).trim().toLowerCase() === 'ai'
    );

    // Keep AI mention always as the final option in the suggestions list.
    if (!hasAiMention) {
      mentionList = [...mentionList, { id: 'ai_assistant', display: 'AI' }];
    }

    return mentionList;
  }, [members]);

  const isInputDisabled =
    data?.pages[0]?.room?.chat_blocked ||
    path === "user-management" ||
    data?.pages[0]?.room?.can_send === false;

  const inputPlaceholder =
    data?.pages[0]?.room?.chat_blocked
      ? 'Chat is blocked. You are not allowed to send messages until unblocked.'
      : data?.pages[0]?.room?.can_send === false
        ? 'User is currently inactive. Cannot send messages.'
        : 'Type your message...';
  // ...........................**Chat info**........................... //
  // data?.pages[0].chatInfo)
  const safeUser = {
    name: data?.pages[0]?.room?.name || "Unknown User",
    role: data?.pages[0]?.room?.display_role || "unknown",
    avatar: `https://backend.getkyroai.com${data?.pages[0]?.room?.image}` ||
      "https://api.dicebear.com/7.x/avataaars/svg?seed=Chat",
  };
  const headerAvatar = avatar ? `https://backend.getkyroai.com${avatar}` : safeUser.avatar;

  return (
    <div className={`flex flex-col h-full border border-gray-300 rounded-lg bg-white/50 overflow-hidden ${path == "charting-ai" ? "min-h-[calc(100vh-130px)] max-h-[calc(100vh-100px)]" : ""}`}>
      {!chatRoom ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 bg-white/50 rounded-lg">
          Select a chat
        </div>
      ) : (
        <>
          {/* Header */}
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
                  <div className="font-semibold truncate max-w-[150px] sm:max-w-[260px]">{path === "charting-ai" ? "Chartly AI" : safeUser.name}</div>
                  <div className="text-xs text-primary font-medium">{safeUser.role}</div>
                </div>
              </div>

              {/* Blocked status */}
              {
                data?.pages[0]?.room?.chat_blocked && (
                  <div>
                    <p className="text-red-500 font-semibold">Blocked</p>
                  </div>
                )
              }

              {/* Button at the end */}



            </div>


            <div ref={actionsDropdownRef} className={`relative ${data?.pages[0]?.room?.type === "ai" ? "hidden" : ""} `}>
              <FiInfo
                size={20}
                className={`cursor-pointer ${path === "user-management" || path === "charting-ai" || path === "clinicwise-chat-history" ? "hidden" : ""}`}
                onClick={() => setShowActions(!showActions)}
              />

              <ActionsDropdown
                showActions={showActions}
                onEditDetails={() => { }}
                onAddMember={() => { }}
                onBlockMember={() => { }}
                onDeleteChat={() => setShowActions(false)}
                chatInfo={data?.pages[0]?.room}
              />
            </div>
          </div>
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
          />

          {/* ........................................................Input Area For send text................................................ */}
          <div className="p-2 sm:p-4 border-t border-gray-300">
            {/* ====================================== Forwarded message display ==================================== */}
            {forwardedDraft && (
              <div className="mb-3 rounded-lg border border-gray-300 bg-gray-50 p-3 max-h-[140px] overflow-y-auto">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-semibold text-gray-600">Forwarded message details</div>
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
            {attachments.length > 0 && (roomType === "group" || roomType === "private" || roomType === "ai" || roomType === "ai_charting") && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                    <FiPaperclip size={16} className="text-gray-600" />
                    <span className="text-sm text-gray-700 max-w-[200px] truncate">{file.name}</span>
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

              {/* ===================================== File upload button for group and private ================================== */}
              {(roomType === "group" || roomType === "private" || roomType === "ai") && (
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
                    className="text-gray-600 hover:text-gray-800 disabled:opacity-50 cursor-pointer shrink-0"
                    title="Attach files"
                  >
                    <FiPaperclip size={24} />
                  </button>
                </>
              )}



              {roomType === "group" ? (
                <div className="flex-1 relative min-w-0 ">
                  <MentionsInput
                    className="mentions mentions--multiLine"
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
                      renderSuggestion={(suggestion, search, highlightedDisplay, index, focused) => {
                        return (
                          <div
                            style={{
                              padding: "8px 12px",
                              maxHeight: "50vh",
                              overflowY: "auto"
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
                  rows={2}
                  disabled={isInputDisabled}
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyDown}
                  placeholder={inputPlaceholder}
                  className={`flex-1 outline-none resize-none overflow-y-auto border border-gray-300 rounded-lg p-2 min-w-0 text-base min-h-[70px] sm:min-h-[100px] ${data?.pages[0]?.room?.chat_blocked || data?.pages[0]?.room?.can_send === false ? 'placeholder:text-red-500' : ''}`}
                  style={{ minHeight: "70px", maxHeight: "220px" }}
                />
              )}
              <button
                onClick={handleSendMessage}
                disabled={(!inputMessage.trim() && attachments.length === 0) || isInputDisabled || (isAiRoom && isAiTyping)}
                className="disabled:opacity-50 cursor-pointer shrink-0"
                title={isAiRoom && isAiTyping ? 'Please wait, AI is responding...' : 'Send Messages'}
              >
                <FiSend size={24} />
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
