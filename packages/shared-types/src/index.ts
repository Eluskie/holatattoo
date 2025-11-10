// Studio Types
export interface Studio {
  id: string;
  name: string;
  email: string;
  whatsappNumber: string | null;
  webhookUrl: string | null;
  createdAt: Date;
}

// Bot Configuration Types
export interface BotQuestion {
  id: number;
  text: string;
  field: string;
  type: 'text' | 'number' | 'choice';
  choices?: string[];
}

export interface BotConfig {
  id: string;
  studioId: string;
  welcomeMessage: string;
  questions: BotQuestion[];
  brandingColor: string;
  logoUrl: string | null;
}

// Conversation Types
export type ConversationStatus = 'active' | 'qualified' | 'dropped';

export interface Conversation {
  id: string;
  studioId: string;
  userPhone: string;
  status: ConversationStatus;
  currentStep: number;
  collectedData: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Webhook Types
export interface QualifiedLead {
  lead_id: string;
  studio_id: string;
  timestamp: string;
  source: 'whatsapp';
  data: {
    phone: string;
    name: string;
    [key: string]: string;
  };
}

// Twilio Types
export interface TwilioIncomingMessage {
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Widget Types
export interface WidgetConfig {
  studioId: string;
  whatsappNumber: string;
  brandingColor?: string;
  position?: 'bottom-right' | 'bottom-left';
  buttonText?: string;
  welcomeMessage?: string;
}
