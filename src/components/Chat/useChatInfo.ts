"use client";

import { useEffect, useRef, useState } from "react";
import { useImmer, useImmerReducer } from "use-immer";
import { useAuth } from "@/context/AuthProvider";
import { createSocket } from "@/lib/socket-client";
import { apiGet, apiPost } from "@/lib/api-client";
import { getRandomAvatarUrl } from "@/utils/avatar";
import type { ChatSummary, MessageItem } from "./UserList";

interface ChatInfo {
  partner: { id: string; name: string; image: string | null };
  unreadCount: number;
  // isOnline: boolean;
  messages: MessageItem[];
}

type Action =
  | { type: "init"; payload: ChatSummary[] }
  | {
      type: "addExistingMessages";
      payload: {
        partnerId: string;
        messages: MessageItem[];
        type: "new" | "history" | "replace";
      };
    }
  | {
      type: "addNewPartnerMessages";
      payload: {
        partner: { id: string; name: string; image: string | null };
        messages: MessageItem[];
      };
    }
  | {
      type: "markMessagesAsRead";
      payload: { type: "iReaded" | "userReaded"; partnerId: string };
    };

function chatInfoReducer(
  state: ChatInfo[],
  action: Action
): ChatInfo[] | void {
  switch (action.type) {
    case "init": {
      const next = action.payload.map((s) => {
        const lm = s.lastMessage as { id?: string; sender_id?: string; senderId?: string; content?: string; created_at?: string; status?: string } | undefined;
        return {
          partner: {
            ...s.partner,
            image: s.partner.image ?? getRandomAvatarUrl(s.partner.id),
          },
          unreadCount: s.unreadCount,
          messages: lm
            ? [
                {
                  id: lm.id ?? "",
                  sender_id: lm.sender_id ?? lm.senderId ?? "",
                  content: lm.content ?? "",
                  created_at: lm.created_at ?? "",
                  status: lm.status ?? "SENT",
                },
              ]
            : [],
        };
      });
      state.length = 0;
      state.push(...next);
      return;
    }
    case "addExistingMessages": {
      const idx = state.findIndex((c) => c.partner.id === action.payload.partnerId);
      if (idx === -1) return;
      const info = state[idx];
      if (action.payload.type === "replace") {
        info.messages.length = 0;
        info.messages.push(...action.payload.messages);
      } else if (action.payload.type === "history") {
        info.messages.push(...action.payload.messages);
      } else {
        const [removed] = state.splice(idx, 1);
        state.unshift(removed);
        removed.messages = [...action.payload.messages, ...removed.messages];
        const newUnread = action.payload.messages.filter(
          (m) => m.status !== "READ" && m.sender_id === action.payload.partnerId
        ).length;
        removed.unreadCount += newUnread;
      }
      return;
    }
    case "addNewPartnerMessages": {
      const newUnread = action.payload.messages.filter(
        (m) =>
          m.status !== "READ" && m.sender_id === action.payload.partner.id
      ).length;
      state.unshift({
        partner: {
          ...action.payload.partner,
          image:
            action.payload.partner.image ??
            getRandomAvatarUrl(action.payload.partner.id),
        },
        unreadCount: newUnread,
        messages: action.payload.messages,
      });
      return;
    }
    case "markMessagesAsRead": {
      const info = state.find((c) => c.partner.id === action.payload.partnerId);
      if (!info) return;
      if (action.payload.type === "iReaded") info.unreadCount = 0;
      if (action.payload.type === "iReaded") {
        info.messages.forEach((m) => {
          if (m.sender_id === action.payload.partnerId) m.status = "READ";
        });
      } else {
        info.messages.forEach((m) => {
          if (m.sender_id !== action.payload.partnerId) m.status = "READ";
        });
      }
      return;
    }
    default:
      return;
  }
}

export function useChatInfo() {
  const { user } = useAuth();
  const [currentChatUserId, setCurrentChatUserId] = useState<string | null>(null);
  const currentChatUserIdRef = useRef(currentChatUserId);
  useEffect(() => {
    currentChatUserIdRef.current = currentChatUserId;
  }, [currentChatUserId]);

  const socketRef = useRef<Awaited<ReturnType<typeof createSocket>> | null>(null);

  // Explicitly initialize chatInfos and use correct types to resolve ImmerReducer typing issue
  const [chatInfos, dispatch] = useImmerReducer<ChatInfo[], Action>(chatInfoReducer, []);
  const chatInfosRef = useRef(chatInfos);
  useEffect(() => {
    chatInfosRef.current = chatInfos;
  }, [chatInfos]);


  const currentChatInfo = chatInfos.find((c) => c.partner.id === currentChatUserId);

  const sendMessage = (partnerId: string | undefined, content: string) => {
    if (!partnerId) return;
    apiPost<{ id: string; senderId?: string; sender_id?: string; content: string; createdAt?: string; created_at?: string; status?: string }>(
      `/api/chat/message/${partnerId}`,
      { message: content }
    ).then((msg) => {
        const normalized: MessageItem = {
          id: msg.id,
          sender_id: msg.senderId ?? msg.sender_id ?? "",
          content: msg.content,
          created_at: msg.createdAt ?? msg.created_at ?? "",
          status: msg.status ?? "SENT",
        };
        if (chatInfosRef.current.some((c) => c.partner.id === partnerId)) {
          dispatch({
            type: "addExistingMessages",
            payload: { partnerId, messages: [normalized], type: "new" },
          });
        } else {
          apiGet<{ id: string; name: string; image: string | null }>(
            `/api/users/${partnerId}`
          ).then((u) => {
            dispatch({
              type: "addNewPartnerMessages",
              payload: { partner: u, messages: [normalized] },
            });
          });
        }
      }
    );
  };

  const handleSelectChat = async (userId: string) => {
    setCurrentChatUserId(userId);
    const info = chatInfosRef.current.find((c) => c.partner.id === userId);
    if (!info) {
      const u = await apiGet<{ id: string; name: string; image: string | null }>(
        `/api/users/${userId}`
      );
      dispatch({
        type: "addNewPartnerMessages",
        payload: { partner: u, messages: [] },
      });
      return;
    }

    const messages = await apiGet<MessageItem[]>(
      `/api/chat/message/${userId}?limit=50`
    );
    dispatch({
      type: "addExistingMessages",
      payload: { partnerId: userId, messages, type: "replace" },
    });

    if (info.unreadCount) {
      try {
        await apiPost(`/api/chat/read/${userId}`);
        dispatch({
          type: "markMessagesAsRead",
          payload: { partnerId: userId, type: "iReaded" },
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    if (!user) return;

    apiGet<ChatSummary[]>("/api/chat/summaries")
      .then((summaries) => dispatch({ type: "init", payload: summaries }))
      .catch(console.error);

    createSocket()
      .then((socket) => {
        socketRef.current = socket;
        socket.on("receive_private_message", (message) => {
          const normalized = {
            id: message.id,
            sender_id: message.senderId,
            content: message.content,
            created_at: message.createdAt,
            status: message.status,
          };
          const info = chatInfosRef.current.find(
            (c) => c.partner.id === message.senderId
          );
          if (!info) {
            apiGet<{ id: string; name: string; image: string | null }>(
              `/api/users/${message.senderId}`
            ).then((u) => {
              dispatch({
                type: "addNewPartnerMessages",
                payload: { partner: u, messages: [normalized] },
              });
            });
            return;
          }
          dispatch({
            type: "addExistingMessages",
            payload: {
              partnerId: message.senderId,
              messages: [normalized],
              type: "new",
            },
          });
          if (currentChatUserIdRef.current === message.senderId) {
            apiPost(`/api/chat/read/${message.senderId}`).then(() =>
              dispatch({
                type: "markMessagesAsRead",
                payload: { partnerId: message.senderId, type: "iReaded" },
              })
            );
          }
        });
        socket.on("user_readed", ({ readerId }) => {
          dispatch({
            type: "markMessagesAsRead",
            payload: { partnerId: readerId, type: "userReaded" },
          });
        });
      })
      .catch(console.error);

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user]);

  const [searchResults, setSearchResults] = useImmer<{
    options: { id: string; name: string; image: string | null }[];
    isLoading: boolean;
  }>({ options: [], isLoading: false });

  const searchUsers = (query: string) => {
    const q = query.trim();
    setSearchResults((d) => {
      d.isLoading = true;
      return;
    });
    apiGet<{ id: string; name: string; image: string | null }[]>(
      `/api/users/search?query=${encodeURIComponent(q)}`
    )
      .then((list) => {
        setSearchResults((d) => {
          d.options = list.filter((u) => u.id !== user?.uid);
          d.isLoading = false;
        });
      })
      .catch(() => {
        setSearchResults((d) => {
          d.isLoading = false;
        });
      });
  };

  return {
    currentChatInfo,
    chatInfos,
    sendMessage,
    handleSelectChat,
    searchResults,
    searchUsers,
  };
}
