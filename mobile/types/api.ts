/**
 * Chatbot and General API Response Types
 */

export interface ChatMessage {
  id: string;
  sender?: "user" | "saathi" | "assistant";
  role?: "user" | "assistant" | "saathi";
  text?: string;
  content?: string;
  timestamp: string;
  intent?: string;
  suggestions?: string[];
  action?: any;
}

export interface ChatbotResponse {
  reply: string;
  intent: string;
  suggestions?: string[];
  action?: any;
  timestamp?: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  error?: string;
  [key: string]: any;
}
