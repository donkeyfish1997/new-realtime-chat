import axios, { type AxiosInstance } from "axios";
import { auth } from "./firebase";

const API_BASE = typeof window !== "undefined" ? "" : "http://localhost:3000";

async function createApiClient(): Promise<AxiosInstance> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken();

  return axios.create({
    baseURL: API_BASE,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function apiGet<T>(path: string): Promise<T> {
  try {
    const client = await createApiClient();
    const { data } = await client.get<T>(path);
    return data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const data = err.response?.data;
      const msg = typeof data === "object" && data && "error" in data
        ? String((data as { error: unknown }).error)
        : err.response?.statusText || err.message;
      throw new Error(msg);
    }
    throw err;
  }
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  try {
    const client = await createApiClient();
    const { data } = await client.post<T>(path, body);
    return data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const data = err.response?.data;
      const msg = typeof data === "object" && data && "error" in data
        ? String((data as { error: unknown }).error)
        : err.response?.statusText || err.message;
      throw new Error(msg);
    }
    throw err;
  }
}