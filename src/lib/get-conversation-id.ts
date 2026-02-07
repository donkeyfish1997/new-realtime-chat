export function getConversationId(userId1: string, userId2: string): string {
  if (userId1 === userId2) {
    throw new Error("Cannot create conversation with same user");
  }
  return [userId1, userId2].sort().join("_");
}
