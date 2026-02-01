import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Chat, Message, MessageType, ViewState, Call, Story, UserStatus } from '../types';
import { MOCK_USERS, MOCK_CHATS, MOCK_MESSAGES, MOCK_STORIES, CURRENT_USER_ID } from '../constants';

interface AppContextType {
  currentUser: User;
  users: User[];
  chats: Chat[];
  messages: Message[];
  activeChatId: string | null;
  activeView: ViewState;
  activeCall: Call | null;
  stories: Story[];
  
  // Actions
  setActiveView: (view: ViewState) => void;
  openChat: (chatId: string) => void;
  startChatWithUser: (userId: string) => void;
  sendMessage: (chatId: string, content: string, type?: MessageType) => void;
  updateUserProfile: (name: string) => void;
  startCall: (participants: string[], type: 'audio' | 'video') => void;
  endCall: () => void;
  toggleCallType: () => void; // Switch video/audio
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS.find(u => u.id === CURRENT_USER_ID)!);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [chats, setChats] = useState<Chat[]>(MOCK_CHATS);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewState>('CHATS');
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [stories, setStories] = useState<Story[]>(MOCK_STORIES);

  const openChat = (chatId: string) => {
    setActiveChatId(chatId);
    setActiveView('CHATS');
    // Mark as read logic would go here
  };

  const startChatWithUser = (userId: string) => {
    // Check if chat exists
    const existingChat = chats.find(c => !c.isGroup && c.participants.includes(userId) && c.participants.includes(currentUser.id));
    if (existingChat) {
      openChat(existingChat.id);
    } else {
      // Create new chat
      const newChat: Chat = {
        id: `chat_${Date.now()}`,
        participants: [currentUser.id, userId],
        isGroup: false,
        unreadCount: 0
      };
      setChats(prev => [newChat, ...prev]);
      openChat(newChat.id);
    }
  };

  const sendMessage = (chatId: string, content: string, type: MessageType = MessageType.TEXT) => {
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      chatId,
      senderId: currentUser.id,
      type,
      content,
      timestamp: new Date(),
      read: false
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Update chat last message
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        return { ...chat, lastMessage: newMessage };
      }
      return chat;
    }));
  };

  const updateUserProfile = (name: string) => {
    setCurrentUser(prev => ({ ...prev, name }));
    // Also update in users list
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, name } : u));
  };

  const startCall = (participants: string[], type: 'audio' | 'video') => {
    setActiveCall({
      id: `call_${Date.now()}`,
      callerId: currentUser.id,
      receiverIds: participants,
      type,
      status: 'ringing' // In a real app, this would wait for answer
    });
    // Simulate connection after 2 seconds
    setTimeout(() => {
      setActiveCall(prev => prev ? { ...prev, status: 'connected', startedAt: new Date() } : null);
    }, 2000);
  };

  const endCall = () => {
    setActiveCall(null);
  };

  const toggleCallType = () => {
    if (activeCall) {
      setActiveCall({
        ...activeCall,
        type: activeCall.type === 'video' ? 'audio' : 'video'
      });
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, chats, messages, activeChatId, activeView, activeCall, stories,
      setActiveView, openChat, startChatWithUser, sendMessage, updateUserProfile, startCall, endCall, toggleCallType
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
