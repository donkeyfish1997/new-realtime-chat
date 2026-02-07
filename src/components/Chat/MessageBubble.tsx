import { Avatar, Box, lighten, Stack, Typography } from "@mui/material";
import type { MessageWithDateDivider } from "./utils/markDateDividers";

export default function MessageBubble({
  messageInfo,
  userImg,
  isReDirect = false,
  showTime,
  showAvatar = true,
}: {
  messageInfo: MessageWithDateDivider;
  showTime: boolean;
  userImg: string;
  isReDirect?: boolean;
  showAvatar?: boolean;
}) {
  return (
    <Stack
      direction={isReDirect ? "row-reverse" : "row"}
      alignItems="end"
      alignSelf={isReDirect ? "end" : "start"}
      marginBottom={showAvatar ? "3px" : "2px"}
      marginTop={showAvatar ? 0 : "-2px"}
      spacing={1}
      maxWidth="80%"
    >
      {showAvatar ? (
        <Avatar src={userImg} />
      ) : (
        <Avatar sx={{ visibility: "hidden", flexShrink: 0 }} />
      )}
      <Box
        padding={1}
        sx={(theme) => ({
          backgroundColor: lighten(theme.palette.primary.light, 0.6),
          borderRadius: "5px",
        })}
      >
        <Typography>{messageInfo.content}</Typography>
      </Box>
      {showTime && (
        <>
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{ whiteSpace: "nowrap", pb: 0.5 }}
          >
            {messageInfo.timeText}
          </Typography>
          {messageInfo.status === "READ" && (
            <Typography color="text.disabled" component="span"> ✓</Typography>
          )}
        </>
      )}
    </Stack>
  );
}
