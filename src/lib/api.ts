"use client";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    credentials: "include",
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      msg = j.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  me: () => request<{ user: any | null }>("/api/auth/me"),
  login: (body: { emailOrUsername: string; password: string }) =>
    request<{ user: any }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  register: (body: { email: string; username: string; password: string }) =>
    request<{ user: any }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),

  listCharacters: (params?: { q?: string; category?: string; sort?: string; mine?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.category) qs.set("category", params.category);
    if (params?.sort) qs.set("sort", params.sort);
    if (params?.mine) qs.set("mine", "1");
    return request<{ items: any[] }>(`/api/characters${qs.toString() ? `?${qs}` : ""}`);
  },
  getCharacter: (id: string) => request<{ character: any }>(`/api/characters/${id}`),
  createCharacter: (body: any) =>
    request<{ character: any }>("/api/characters", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateCharacter: (id: string, body: any) =>
    request<{ character: any }>(`/api/characters/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteCharacter: (id: string) =>
    request<{ ok: true }>(`/api/characters/${id}`, { method: "DELETE" }),
  likeCharacter: (id: string) =>
    request<{ liked: boolean; likesCount: number }>(`/api/characters/${id}/like`, {
      method: "POST",
    }),

  assistCharacter: (body: { name?: string; idea: string; kind?: "character" | "scenario"; current?: any }) =>
    request<{ result: any }>("/api/characters/assist", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listChats: () => request<{ items: any[] }>("/api/chats"),
  createChat: (characterId: string) =>
    request<{ chat: any }>("/api/chats", {
      method: "POST",
      body: JSON.stringify({ characterId }),
    }),
  getChat: (id: string) => request<{ chat: any; messages: any[] }>(`/api/chats/${id}`),
  deleteChat: (id: string) => request<{ ok: true }>(`/api/chats/${id}`, { method: "DELETE" }),
};
