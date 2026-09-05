/**
 * Chatbot and General API Response Types
 */

export interface ChatMessage {
  id: string;
  sender: "user" | "saathi";
  text: string;
  timestamp: string;
  suggestions?: string[];
  action?: {
    type: "OPEN_BOOKING" | "OPEN_SOS" | "SHOW_MY_BOOKINGS" | "SHOW_SERVICES" | "TOGGLE_AVAILABILITY" | "SHOW_PMSBY";
    service?: string;
    label?: string;
  };
}

export interface ChatbotResponse {
  reply: string;
  intent: string;
  suggestions?: string[];
  action?: {
    type: "OPEN_BOOKING" | "OPEN_SOS" | "SHOW_MY_BOOKINGS" | "SHOW_SERVICES" | "TOGGLE_AVAILABILITY" | "SHOW_PMSBY";
    service?: string;
    label?: string;
  };
  timestamp: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  error?: string;
  [key: string]: any;
}
