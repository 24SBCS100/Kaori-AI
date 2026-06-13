import { ChatMessage } from "./types";

export type ChatThread = {
  id: string;
  title: string;
  isStarred?: boolean;
  messages: ChatMessage[];
  createdAt?: string;
  updatedAt?: string;
};
