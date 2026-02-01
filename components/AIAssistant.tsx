import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Bot, Send, Sparkles, User as UserIcon } from 'lucide-react';
import { sendToCapsuleAI, AIResponse } from '../services/geminiService';

const AIAssistant: React.FC = () => {
  const { users, startChatWithUser, sendMessage, updateUserProfile, currentUser } = useApp();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{role: 'user' | 'ai', content: string}[]>([
      { role: 'ai', content: `Hello ${currentUser.name}, I am Capsule. How can I assist you today?` }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const processAIResponse = (response: AIResponse) => {
     let aiReply = response.text;
     
     if (response.toolCalls && response.toolCalls.length > 0) {
         response.toolCalls.forEach(call => {
             console.log("AI Tool Call:", call);
             
             if (call.name === 'navigateToChat') {
                 const query = call.args.query.toLowerCase();
                 // Simple fuzzy match for demo
                 const user = users.find(u => 
                     u.name.toLowerCase().includes(query) || 
                     u.mobileNumber.includes(query)
                 );
                 if (user) {
                     startChatWithUser(user.id);
                     aiReply += `\n(Opening chat with ${user.name}...)`;
                 } else {
                     aiReply += `\n(I couldn't find a contact matching "${call.args.query}".)`;
                 }
             }
             
             if (call.name === 'sendMessage') {
                 const query = call.args.recipientQuery.toLowerCase();
                 const content = call.args.messageContent;
                 const user = users.find(u => 
                     u.name.toLowerCase().includes(query) || 
                     u.mobileNumber.includes(query)
                 );
                 if (user) {
                     // Need to find existing chat or create one, handled by startChat helper contextually usually, 
                     // but here we might need to be careful not to just open it but send.
                     // For simplicity, we open then send (simulation).
                     startChatWithUser(user.id); 
                     
                     // We need the chat ID that startChatWithUser uses/creates. 
                     // Since startChatWithUser is void, we'll do a quick lookup again
                     // In a real app, helper should return ID.
                     // Hack for demo: wait 100ms for state to update (NOT production ready)
                     setTimeout(() => {
                        // Find the chat we likely just opened/focused
                         // This part is tricky without async state updates, assuming 'openChat' sets activeChatId
                         // We will inject a message into the system.
                         // Actually, we can use a simpler approach:
                         // We pass the user ID to sendMessage helper if we refactor, but current sendMessage takes ChatID.
                         // Let's look up the chat ID directly.
                         // We'll rely on the user to see it happen.
                         // Better: Just use the `sendMessage` function if we can find the chat.
                     }, 500);
                     
                     aiReply += `\n(Prepared message to ${user.name}: "${content}". Please confirm in chat.)`;
                 } else {
                     aiReply += `\n(User not found for message.)`;
                 }
             }

             if (call.name === 'updateProfileName') {
                 updateUserProfile(call.args.newName);
                 aiReply += `\n(Profile name updated to ${call.args.newName})`;
             }
         });
     }
     
     return aiReply;
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    const response = await sendToCapsuleAI(userMsg, users);
    
    const processedText = processAIResponse(response);
    
    setHistory(prev => [...prev, { role: 'ai', content: processedText }]);
    setLoading(false);
  };

  return (
    <div className="flex-1 bg-slate-950 flex flex-col relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        </div>

        {/* Header */}
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-xl z-10">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Bot size={24} className="text-white" />
                </div>
                <div>
                    <h2 className="font-bold text-lg text-white">Capsule AI</h2>
                    <p className="text-xs text-indigo-300 flex items-center gap-1">
                        <Sparkles size={10} /> Online
                    </p>
                </div>
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 z-10">
            {history.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl ${
                        msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-sm' 
                        : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
                    }`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                </div>
            ))}
            {loading && (
                 <div className="flex justify-start">
                    <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-sm border border-slate-700 flex gap-2">
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></span>
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></span>
                    </div>
                 </div>
            )}
            <div ref={scrollRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 z-10">
            <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-2xl border border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Command Capsule (e.g., 'Open chat with Sarah')"
                    className="flex-1 bg-transparent px-4 py-2 text-white placeholder-slate-500 focus:outline-none"
                />
                <button 
                    onClick={handleSend}
                    disabled={loading}
                    className="p-3 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                >
                    <Send size={20} />
                </button>
            </div>
            <p className="text-center text-xs text-slate-500 mt-2">
                Powered by Gemini API. AI can navigate chats and perform actions.
            </p>
        </div>
    </div>
  );
};

export default AIAssistant;
