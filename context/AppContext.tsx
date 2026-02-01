import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Chat, Message, MessageType, ViewState, Call, Story, UserStatus } from '../types';
import { api } from '../lib/api';
import { io, Socket } from 'socket.io-client';

// --- Types ---
interface AppContextType {
  currentUser: User | null;
  users: User[];
  chats: Chat[];
  messages: Message[];
  activeChatId: string | null;
  activeView: ViewState;
  activeCall: Call | null;
  stories: Story[];
  isLoading: boolean;
  
  // Actions
  setActiveView: (view: ViewState) => void;
  openChat: (chatId: string) => void;
  startChatWithUser: (userId: string) => void;
  sendMessage: (chatId: string, content: string, type?: MessageType) => Promise<void>;
  updateUserProfile: (name: string) => Promise<void>;
  startCall: (participants: string[], type: 'audio' | 'video') => void;
  endCall: () => void;
  toggleCallType: () => void;
  refreshData: () => void;
  signOut: () => void;
  handleLogin: (userData: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SOCKET_URL = 'http://localhost:5000';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewState>('CHATS');
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Load user from session storage on mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem('capsule_user');
    if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Initialize Socket connection when user logs in
  useEffect(() => {
    if (currentUser) {
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.on('new_message', (newMsg: any) => {
            const formattedMsg: Message = {
                ...newMsg,
                timestamp: new Date(newMsg.timestamp)
            };
            
            setMessages(prev => {
                // Avoid duplicates
                if (prev.find(m => m.id === formattedMsg.id)) return prev;
                return [...prev, formattedMsg];
            });

            // Update chat preview
            setChats(prev => prev.map(c => {
                if (c.id === formattedMsg.chatId) {
                    return {
                        ...c,
                        lastMessage: formattedMsg,
                        unreadCount: formattedMsg.senderId !== currentUser.id ? (c.unreadCount || 0) + 1 : 0
                    };
                }
                return c;
            }));
        });

        return () => {
            newSocket.disconnect();
        };
    }
  }, [currentUser]);

  // Join chat rooms
  useEffect(() => {
      if (socket && chats.length > 0) {
          chats.forEach(chat => {
              socket.emit('join', { chat_id: chat.id });
          });
      }
  }, [socket, chats]);

  const fetchData = async () => {
      if (!currentUser) return;
      try {
          const [fetchedUsers, fetchedChats] = await Promise.all([
              api.getUsers(currentUser.id),
              api.getChats(currentUser.id)
          ]);
          
          setUsers(fetchedUsers.map((u: any) => ({
              ...u,
              lastSeen: new Date(u.lastSeen)
          })));
          
          setChats(fetchedChats.map((c: any) => ({
              ...c,
              lastMessage: c.lastMessage ? { ...c.lastMessage, timestamp: new Date(c.lastMessage.timestamp) } : undefined
          })));

      } catch (e) {
          console.error("Failed to fetch data", e);
      }
  };

  useEffect(() => {
      if (currentUser) {
          fetchData();
          // Mock Stories
          setStories([
            {
                id: 's1',
                userId: 'user_1', // Assuming user_1 exists for demo, normally handled dynamically
                mediaUrl: 'https://picsum.photos/400/800?random=20',
                mediaType: 'image',
                timestamp: new Date(Date.now() - 7200000),
                viewers: []
            }
          ]);
      }
  }, [currentUser]);


  const openChat = async (chatId: string) => {
    setActiveChatId(chatId);
    setActiveView('CHATS');
    
    // Fetch messages
    try {
        const msgs = await api.getMessages(chatId);
        setMessages(msgs.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
        })));
    } catch (e) {
        console.error("Error loading messages", e);
    }
  };

  const startChatWithUser = async (userId: string) => {
    if (!currentUser) return;
    try {
        const chatData = await api.createChat([currentUser.id, userId]);
        
        // Refresh chats to include new one
        await fetchData();
        openChat(chatData.id);
    } catch (e) {
        console.error("Error creating chat", e);
    }
  };

  const sendMessage = async (chatId: string, content: string, type: MessageType = MessageType.TEXT) => {
    if (!currentUser) return;
    try {
        await api.sendMessage(chatId, currentUser.id, content, type);
        // Message will come back via SocketIO 'new_message' event
    } catch (e) {
        console.error("Error sending message", e);
    }
  };

  const updateUserProfile = async (name: string) => {
    if (!currentUser) return;
    await api.updateProfile(currentUser.id, name);
    const updated = { ...currentUser, name };
    setCurrentUser(updated);
    sessionStorage.setItem('capsule_user', JSON.stringify(updated));
  };

  const startCall = (participants: string[], type: 'audio' | 'video') => {
    if (!currentUser) return;
    setActiveCall({
      id: `call_${Date.now()}`,
      callerId: currentUser.id,
      receiverIds: participants,
      type,
      status: 'ringing' 
    });
    setTimeout(() => {
      setActiveCall(prev => prev ? { ...prev, status: 'connected', startedAt: new Date() } : null);
    }, 2000);
  };

  const endCall = () => setActiveCall(null);

  const toggleCallType = () => {
    if (activeCall) {
      setActiveCall({
        ...activeCall,
        type: activeCall.type === 'video' ? 'audio' : 'video'
      });
    }
  };
  
  const handleLogin = (userData: any) => {
      const user = {
          ...userData,
          lastSeen: new Date(userData.lastSeen)
      };
      setCurrentUser(user);
      sessionStorage.setItem('capsule_user', JSON.stringify(user));
  };

  const signOut = async () => {
      setCurrentUser(null);
      sessionStorage.removeItem('capsule_user');
      setMessages([]);
      setChats([]);
      if (socket) socket.disconnect();
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, chats, messages, activeChatId, activeView, activeCall, stories, isLoading,
      setActiveView, openChat, startChatWithUser, sendMessage, updateUserProfile, startCall, endCall, toggleCallType, refreshData: fetchData, signOut, handleLogin
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