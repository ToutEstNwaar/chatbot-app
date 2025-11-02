import { Chat, FinishReason, SafetyRating } from "@google/genai";

export type MessageRole = 'user' | 'model';

export type AttachmentType = 'image' | 'video' | 'audio' | 'file';

export interface Attachment {
  type: AttachmentType;
  name: string;
  data: string; // base64 data URL
  mimeType: string;
}

export interface GroundingChunk {
    web?: {
        uri: string;
        title: string;
    };
}

export interface UrlMetadata {
  retrievedUrl: string;
  urlRetrievalStatus: string;
}

export interface UrlContextMetadata {
  urlMetadata: UrlMetadata[];
}

export interface Message {
  id: string;
  role: MessageRole;
  text?: string;
  attachments?: Attachment[];
  timestamp: Date;
  isLoading?: boolean;
  groundingChunks?: GroundingChunk[];
  urlContextMetadata?: UrlContextMetadata;
  finishReason?: FinishReason;
  safetyRatings?: SafetyRating[];
  tokenCount?: number;
  thoughtSummary?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  geminiChat: Chat | null;
}