"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Box, Button, Divider, lighten, Stack, Typography } from "@mui/material";
import { Logout } from "@mui/icons-material";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthProvider";
import UserList from "@/components/Chat/UserList";
import MessageBox from "@/components/Chat/MessageBox";
import SearchBlock from "@/components/Chat/SearchBlock";
import { useChatInfo } from "@/components/Chat/useChatInfo";
import { getRandomAvatarUrl } from "@/utils/avatar";

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const {
    currentChatInfo,
    chatInfos,
    sendMessage,
    handleSelectChat,
    searchResults,
    searchUsers,
  } = useChatInfo();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
    router.refresh();
  };

  if (loading || !user) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Typography>載入中...</Typography>
      </Box>
    );
  }

  const userWithImage = {
    id: user.uid,
    image: user.photoURL || getRandomAvatarUrl(user.uid),
  };

  return (
    <Stack
      direction="row"
      sx={{
        margin: -2,
        marginTop: 0,
        height: "100vh",
        width: `calc(100% + 32px)`,
        overflow: "hidden",
      }}
    >
      <Stack
        spacing={2}
        sx={(theme) => ({
          padding: 2,
          width: "30%",
          minWidth: 300,
          height: "100%",
          backgroundColor: lighten(theme.palette.primary.light, 0.9),
        })}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{user.displayName || user.email}</Typography>
          <Button
            component={Link}
            href="/"
            startIcon={<Logout />}
            onClick={(e) => {
              e.preventDefault();
              handleLogout();
            }}
          >
            登出
          </Button>
        </Stack>
        <SearchBlock
          options={searchResults.options}
          isLoading={searchResults.isLoading}
          onSearchUsers={searchUsers}
          onSelectedUser={handleSelectChat}
        />
        <Divider />
        <UserList users={chatInfos} onClickUser={handleSelectChat} />
      </Stack>
      <MessageBox
        user={userWithImage}
        partner={
          currentChatInfo?.partner
            ? {
                ...currentChatInfo.partner,
                image:
                  currentChatInfo.partner.image ??
                  getRandomAvatarUrl(currentChatInfo.partner.id),
              }
            : null
        }
        messages={currentChatInfo?.messages ?? []}
        onSendMessage={(content) => {
          sendMessage(currentChatInfo?.partner.id, content);
        }}
      />
    </Stack>
  );
}
