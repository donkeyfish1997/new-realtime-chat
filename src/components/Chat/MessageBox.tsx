"use client";

import {
  Avatar,
  Box,
  Button,
  Divider,
  lighten,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import MessageBubble from "./MessageBubble";
import { markDateDividers } from "./utils/markDateDividers";
import { useEffect, useRef } from "react";

interface MessageItem {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  status: string;
}

export default function MessageBox({
  user,
  partner,
  messages,
  onSendMessage,
}: {
  user: { id: string; image: string } | null;
  partner: { id: string; image: string; name: string } | null;
  messages: MessageItem[];
  onSendMessage: (content: string) => void;
}) {
  const contentRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const partnerChangedRef = useRef(false);

  useEffect(() => {
    partnerChangedRef.current = true;
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [partner]);

  useEffect(() => {
    if (partnerChangedRef.current) {
      partnerChangedRef.current = false;
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Stack
      spacing={1}
      sx={(theme) => ({
        margin: 2,
        padding: 2,
        width: "100%",
        backgroundColor: lighten(theme.palette.primary.light, 0.9),
        borderRadius: "5px",
      })}
    >
      {partner && (
        <>
          <Stack direction="row" spacing={2} sx={{ height: "70px" }}>
            <Avatar
              src={partner.image}
              sx={{ height: "100%", width: "auto", aspectRatio: "1 / 1" }}
            />
            <Typography variant="h6" sx={{ alignSelf: "center" }}>
              {partner.name}
            </Typography>
          </Stack>
          <Divider />
          <Stack
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {markDateDividers([...messages].reverse(), new Date()).map(
              (message) => (
                <Box key={message.id}>
                  {message.isDateDivider && (
                    <Box sx={{ textAlign: "center", my: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        {message.dateLabel}
                      </Typography>
                    </Box>
                  )}
                  <MessageBubble
                    isReDirect={message.sender_id === user?.id}
                    userImg={
                      message.sender_id === user?.id
                        ? user.image
                        : partner.image
                    }
                    messageInfo={message}
                    showTime={message.shouldShowTime}
                    showAvatar={message.shouldShowAvatar}
                  />
                </Box>
              )
            )}
            <div ref={messagesEndRef} />
          </Stack>

          <Stack direction="row" alignItems="end" spacing={2}>
            <TextField
              inputRef={contentRef}
              variant="outlined"
              placeholder="輸入訊息..."
              size="small"
              fullWidth
              multiline
              maxRows={4}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  const val = (e.target as HTMLInputElement).value;
                  if (val.trim()) {
                    onSendMessage(val.trim());
                    (e.target as HTMLInputElement).value = "";
                  }
                }
              }}
              sx={{
                "& .MuiOutlinedInput-root": { borderRadius: "20px" },
              }}
            />
            <Button
              variant="contained"
              onClick={() => {
                const val = contentRef.current?.value;
                if (val?.trim()) {
                  onSendMessage(val.trim());
                  if (contentRef.current) contentRef.current.value = "";
                }
              }}
            >
              送出
            </Button>
          </Stack>
        </>
      )}
    </Stack>
  );
}
