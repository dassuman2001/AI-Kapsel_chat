import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Send, Phone, Video, Paperclip, Mic, MoreVertical, Smile, Image as ImageIcon } from 'lucide-react';
import { MessageType } from '../types';
import { format } from 'date-fns';

const ChatWindow: React.FC = () => {
  const { activeChatId, chats, users, messages, currentUser, sendMessage, startCall } = useApp();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeChat = chats.find(c => c.id === activeChatId);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChatId]);

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-slate-500">
        <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center mb-4">
            <span className="text-4xl">💊</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-300 mb-2">Welcome to Capsule</h2>
        <p>Select a chat or ask the AI to start a conversation.</p>
      </div>
    );
  }

  const chatMessages = messages.filter(m => m.chatId === activeChat.id);
  const partnerId = activeChat.participants.find(id => id !== currentUser.id);
  const partner = users.find(u => u.id === partnerId) || currentUser;
  const displayName = activeChat.isGroup ? activeChat.groupName : partner.name;
  const displayAvatar = activeChat.isGroup ? activeChat.groupAvatar : partner.avatar;

  const handleSend = () => {
    if (inputValue.trim()) {
      sendMessage(activeChat.id, inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          // In a real app, upload to storage and get URL.
          // Here we just use a fake URL or create object URL
          const file = e.target.files[0];
          const objectUrl = URL.createObjectURL(file);
          const type = file.type.startsWith('video') ? MessageType.VIDEO : MessageType.IMAGE;
          sendMessage(activeChat.id, objectUrl, type);
      }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 relative">
      {/* Header */}
      <div className="h-16 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <img src={displayAvatar} alt={displayName} className="w-10 h-10 rounded-full object-cover" />
          <div>
            <h2 className="font-semibold text-slate-100">{displayName}</h2>
            <p className="text-xs text-slate-400">
               {activeChat.isGroup ? 'Group' : (partner.status === 'online' ? 'Online' : `Last seen ${format(partner.lastSeen, 'HH:mm')}`)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-indigo-400">
          <button onClick={() => startCall(activeChat.participants, 'audio')} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <Phone size={20} />
          </button>
          <button onClick={() => startCall(activeChat.participants, 'video')} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <Video size={20} />
          </button>
          <button className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
        {chatMessages.map(msg => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                isMe 
                  ? 'bg-indigo-600 text-white rounded-tr-sm' 
                  : 'bg-slate-800 text-slate-200 rounded-tl-sm'
              }`}>
                {msg.type === MessageType.TEXT && (
                   <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
                {msg.type === MessageType.IMAGE && (
                    <img src={msg.content} alt="Attachment" className="rounded-lg max-h-60 mt-1 mb-1" />
                )}
                {msg.type === MessageType.VIDEO && (
                    <video src={msg.content} controls className="rounded-lg max-h-60 mt-1 mb-1" />
                )}
                {msg.type === MessageType.AUDIO && (
                    <div className="flex items-center gap-2 min-w-[150px]">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-xs">▶</span>
                        </div>
                        <div className="h-1 flex-1 bg-white/30 rounded-full"></div>
                        <span className="text-xs opacity-70">0:15</span>
                    </div>
                )}
                
                <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {format(msg.timestamp, 'HH:mm')}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-slate-900 border-t border-slate-800">
        <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-3xl border border-slate-700">
          <button 
             onClick={() => fileInputRef.current?.click()}
             className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 rounded-full transition-colors"
          >
            <Paperclip size={20} />
          </button>
          <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             accept="image/*,video/*"
             onChange={handleFileSelect}
          />
          
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none px-2"
          />
          
          {inputValue.trim() ? (
            <button 
              onClick={handleSend}
              className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30"
            >
              <Send size={18} />
            </button>
          ) : (
             <div className="flex gap-1">
                 <button className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 rounded-full transition-colors">
                    <Mic size={20} />
                 </button>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
