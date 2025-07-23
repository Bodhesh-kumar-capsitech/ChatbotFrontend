export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

export interface Option {
  label: string;
  query: {
    query: string;
    reply: string;
    options: Option[];
  };
}

export interface BotResponse {
  sessionId: string;
  reply: string;
  options: Option[];
}
