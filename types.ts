
export enum MessageRole {
  User = 'user',
  Model = 'model'
}

export interface Attachment {
  type: 'image' | 'file';
  content: string; // Base64 or Text depending on read method, usually DataURL
  name: string;
  mimeType: string;
}

export interface Source {
  title: string;
  url: string;
  favicon?: string;
  image?: string;
  sourceName?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  sources?: Source[];
  isThinking?: boolean;
  attachments?: Attachment[];
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  activeTool: string | null;
}

export interface SavedChat {
  id: string;
  title: string;
  date: number; // Timestamp
  snippet: string;
  messages: Message[];
  activeTool: ToolId | null;
}

export type View = 'dashboard' | 'recent-chats' | 'knowledge-base' | 'projects' | 'landing';

export type ToolId = 'deep-search' | 'image-gen' | 'project-arch' | 'swot' | 'competitor' | 'benchmark' | 'prd';