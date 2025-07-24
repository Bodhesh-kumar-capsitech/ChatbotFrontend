const BASE_URL = "http://localhost:5096/api/chat";

export async function fetchTopQueries(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/top-queries`);
  const data = await res.json();
  return data.result || [];
}

export interface BotReply {
  reply: string;
  options: { label: string; query: string}[];
  sessionId: string;
}

export async function fetchBotReply(query: string, sessionId?: string): Promise<BotReply> {
  const url = `${BASE_URL}/reply?query=${encodeURIComponent(query)}${sessionId ? `&sessionId=${sessionId}` : ""}`;
  const res = await fetch(url);
  const data = await res.json();
  return {
    reply: data.result.reply,
    options: data.result.options,
    sessionId: data.result.sessionId,
  };
}
