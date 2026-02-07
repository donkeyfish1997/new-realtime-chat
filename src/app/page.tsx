import Link from "next/link";
import { Box, Button, Container, Typography } from "@mui/material";

export default function HomePage() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: 2,
        }}
      >
        <Typography variant="h4">Realtime Chat</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button component={Link} href="/login" variant="outlined">
            登入
          </Button>
          <Button component={Link} href="/register" variant="contained">
            註冊
          </Button>
          <Button component={Link} href="/chat" variant="outlined">
            進入聊天
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
