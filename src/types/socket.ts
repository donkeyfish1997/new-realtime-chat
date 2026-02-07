export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender_id?: string;
  content: string;
  createdAt: string;
  created_at?: string;
  status: "SENT" | "DELIVERED" | "READ";
}

export interface ClientToServerEvents {
  // Add if needed
}

export interface ServerToClientEvents {
  receive_private_message: (message: Message) => void;
  user_readed: (data: { readerId: string }) => void;
}
