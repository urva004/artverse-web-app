export interface ChatSendPayload {
  content: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
}