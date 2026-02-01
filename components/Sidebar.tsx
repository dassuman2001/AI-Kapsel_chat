import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MessageSquare, Users, Phone, Settings, Bot, Search, Plus } from 'lucide-react';
import { format } from 'date-fns';

const Sidebar: React.FC = () => {
  const { chats, users, currentUser, activeChatId, openChat, activeView, setActiveView } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const getChatPartner = (participants: string[]) => {
    const partnerId = participants.find(id => id !== currentUser.id);
    return users.find(u => u.id === partnerId) || currentUser;
  };

  const filteredChats = chats.filter(chat => {
    if (chat.isGroup) {
      return chat.groupName?.toLowerCase().includes(searchTerm.toLowerCase());
    }
    const partner = getChatPartner(chat.participants);
    return partner.name.toLowerCase().includes(searchTerm.toLowerCase()) || partner.mobileNumber.includes(searchTerm);
  });

  const NavItem = ({ view, icon: Icon, label }: { view: string, icon: any, label: string }) => (
    <button
      onClick={() => setActiveView(view as any)}
      className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
        activeView === view ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-800'
      }`}
    >
      <Icon size={24} />
      <span className="text-xs mt-1">{label}</span>
    </button>
  );

  return (
    <div className="w-full md:w-80 h-full bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
             <span className="font-bold text-white">C</span>
          </div>
          <h1 className="font-bold text-xl tracking-tight text-white">Capsule</h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
            <img src={currentUser.avatar} alt="Me" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Navigation Rail (Horizontal on Mobile, could be vertical but keeping simple) */}
      <div className="flex justify-around p-2 bg-slate-900 border-b border-slate-800">
        <NavItem view="CHATS" icon={MessageSquare} label="Chats" />
        <NavItem view="STATUS" icon={Users} label="Status" />
        <NavItem view="CALLS" icon={Phone} label="Calls" />
        <NavItem view="AI_CHAT" icon={Bot} label="AI" />
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search by name or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 text-slate-200 pl-10 pr-4 py-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-transparent transition-all"
          />
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto">
        {activeView === 'CHATS' && (
          <div className="space-y-1 p-2">
            {filteredChats.map(chat => {
              const partner = getChatPartner(chat.participants);
              const displayName = chat.isGroup ? chat.groupName : partner.name;
              const displayAvatar = chat.isGroup ? chat.groupAvatar : partner.avatar;
              const isActive = activeChatId === chat.id;

              return (
                <div
                  key={chat.id}
                  onClick={() => openChat(chat.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                    isActive ? 'bg-slate-800 border border-slate-700' : 'hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="relative">
                    <img src={displayAvatar} alt={displayName} className="w-12 h-12 rounded-full object-cover" />
                    {!chat.isGroup && partner.status === 'online' && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className="font-semibold text-slate-200 truncate">{displayName}</h3>
                      {chat.lastMessage && (
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {format(chat.lastMessage.timestamp, 'HH:mm')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 truncate">
                      {chat.lastMessage ? chat.lastMessage.content : <span className="italic opacity-50">Draft</span>}
                    </p>
                  </div>
                  {chat.unreadCount > 0 && (
                     <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{chat.unreadCount}</span>
                     </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Placeholders for other views in sidebar context */}
        {activeView === 'STATUS' && (
           <div className="p-8 text-center text-slate-500">
              <p>Status updates from your contacts appear here.</p>
           </div>
        )}
        {activeView === 'CALLS' && (
           <div className="p-8 text-center text-slate-500">
              <p>Recent calls history.</p>
           </div>
        )}
      </div>
      
      {/* Floating Action Button (for new chat) */}
      <div className="absolute bottom-6 right-6 md:hidden">
          <button className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-600/40">
             <Plus size={28} />
          </button>
      </div>
    </div>
  );
};

export default Sidebar;
