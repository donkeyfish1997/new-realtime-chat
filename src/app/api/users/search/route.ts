import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getUserIdFromRequest } from "@/lib/auth-api";

export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const queryStr = (searchParams.get("query")?.trim() ?? "").toLowerCase();

  const db = getAdminDb();
  const snapshot = await db.collection("users").limit(20).get();

  const results = snapshot.docs
    .map((d) => {
      const data = d.data() as { displayName?: string; email?: string; photoURL?: string | null };
      return {
        id: d.id,
        displayName: data.displayName ?? "",
        email: data.email ?? "",
        photoURL: data.photoURL ?? null,
      };
    })
    .filter(
      (u) =>
        u.id !== userId &&
        (u.displayName.toLowerCase().includes(queryStr) ||
          u.email.toLowerCase().includes(queryStr))
    )
    .slice(0, 10)
    .map(({ id, displayName, email, photoURL }) => ({
      id,
      name: displayName || email?.split("@")[0] || "Unknown",
      email,
      image: photoURL ?? null,
    }));

  return NextResponse.json(results);
}
