"use client";

import { Avatar, Stack, Typography } from "@mui/material";
import { getRandomAvatarUrl } from "@/utils/avatar";

export interface ChatSummary {
  partner: { id: string; name: string; image: string | null };
  unreadCount: number;
  lastMessage?: { id?: string; sender_id?: string; content: string; created_at?: string; status?: string };
}

export interface MessageItem {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  status: string;
}

export default function UserList({
  users,
  onClickUser,
}: {
  users: Array<{
    partner: { id: string; name: string; image: string | null };
    unreadCount: number;
    messages: MessageItem[];
  }>;
  onClickUser: (userId: string) => void;
}) {
  return (
    <Stack spacing={2} sx={{ overflowY: "auto" }}>
      {users.map((user) => (
        <Stack
          key={user.partner.id}
          direction="row"
          spacing={2}
          padding={1}
          paddingRight={2}
          onClick={() => onClickUser(user.partner.id)}
          sx={(theme) => ({
            height: "70px",
            borderRadius: "5px",
            "&:hover": {
              backgroundColor: theme.palette.action.hover,
              cursor: "pointer",
            },
          })}
        >
          <Avatar
            src={user.partner.image ?? getRandomAvatarUrl(user.partner.id)}
            sx={{ height: "100%", width: "auto", aspectRatio: "1 / 1" }}
          />
          <Stack flexGrow={1} minWidth={0}>
            <Typography
              variant="h6"
              overflow="hidden"
              textOverflow="ellipsis"
            >
              {user.partner.name}
            </Typography>
            <Typography
              color="text.secondary"
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              variant="body2"
            >
              {user.messages[0]?.content ?? ""}
            </Typography>
          </Stack>
          {user.unreadCount > 0 && (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{
                minWidth: 20,
                height: 20,
                px: 0.75,
                borderRadius: 10,
                backgroundColor: "error.main",
                color: "error.contrastText",
                flexShrink: 0,
              }}
            >
              <Typography component="span" variant="caption" fontWeight={600} sx={{ lineHeight: 1 }}>
                {user.unreadCount > 99 ? "99+" : user.unreadCount}
              </Typography>
            </Stack>
          )}
        </Stack>
      ))}
    </Stack>
  );
}
