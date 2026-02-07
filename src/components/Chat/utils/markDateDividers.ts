import { format, isSameDay, parseISO, differenceInMinutes } from "date-fns";

export interface MessageItem {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  status: string;
}

export interface MessageWithDateDivider extends MessageItem {
  isDateDivider: boolean;
  shouldShowTime: boolean;
  shouldShowAvatar: boolean;
  dateLabel: string | null;
  timeText: string;
}

const TIME_GAP_MINUTES = 5;

export function markDateDividers(
  messages: MessageItem[],
  today: Date
): MessageWithDateDivider[] {
  const lastIndex = messages.length - 1;

  return messages.reduce((acc, message, index) => {
    const currentMsgDate = parseISO(message.created_at);
    let shouldShowDate = false;
    let shouldShowTime = false;

    if (index === 0) {
      shouldShowDate = true;
    } else {
      const previousMessage = messages[index - 1];
      const previousMsgDate = parseISO(previousMessage.created_at);
      if (!isSameDay(currentMsgDate, previousMsgDate)) {
        shouldShowDate = true;
      }
    }

    const isLastInSameSenderGroup =
      index === lastIndex ||
      messages[index + 1].sender_id !== message.sender_id;
    if (
      shouldShowDate ||
      isLastInSameSenderGroup ||
      (index > 0 &&
        differenceInMinutes(
          currentMsgDate,
          parseISO(messages[index - 1].created_at)
        ) >= TIME_GAP_MINUTES)
    ) {
      shouldShowTime = true;
    }

    const shouldShowAvatar =
      index === 0 ||
      messages[index - 1].sender_id !== message.sender_id;

    acc.push({
      ...message,
      isDateDivider: shouldShowDate,
      shouldShowAvatar,
      dateLabel: shouldShowDate
        ? isSameDay(currentMsgDate, today)
          ? "今天"
          : format(currentMsgDate, "yyyy年M月d日")
        : null,
      shouldShowTime,
      timeText: format(currentMsgDate, "HH:mm"),
    });

    return acc;
  }, [] as MessageWithDateDivider[]);
}
