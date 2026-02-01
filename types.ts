export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy'
}

export interface User {
  id: string;
  name: string;
  mobileNumber: string;
  avatar: string;
  status: UserStatus;
  lastSeen: Date;
  about?: string;
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  SYSTEM = 'system'
}

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  status: MessageStatus;
}

export interface Chat {
  id: string;
  participants: string[]; // User IDs
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  lastMessage?: Message;
  unreadCount: number;
}

export interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  timestamp: Date;
  viewers: string[];
}

export interface Call {
  id: string;
  callerId: string;
  receiverIds: string[];
  type: 'audio' | 'video';
  status: 'ringing' | 'connected' | 'ended';
  startedAt?: Date;
}

export type ViewState = 'CHATS' | 'STATUS' | 'CALLS' | 'SETTINGS' | 'AI_CHAT';

export interface AICommandResult {
  action: 'navigate' | 'message' | 'update_profile' | 'none';
  targetId?: string;
  payload?: any;
  responseToUser?: string;
}