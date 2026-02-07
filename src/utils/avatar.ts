export function getRandomAvatarUrl(id: string): string {
  const index = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 70;
  return `https://i.pravatar.cc/150?u=${id || index}`;
}
