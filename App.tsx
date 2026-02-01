import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import CallModal from './components/CallModal';
import AIAssistant from './components/AIAssistant';
import StatusSection from './components/StatusSection';

const MainLayout: React.FC = () => {
  const { activeView } = useApp();

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full min-w-0 bg-slate-950 relative">
         {activeView === 'CHATS' && <ChatWindow />}
         {activeView === 'AI_CHAT' && <AIAssistant />}
         {activeView === 'STATUS' && <StatusSection />}
         {activeView === 'CALLS' && (
             <div className="flex-1 flex items-center justify-center text-slate-500">
                 Call history logic would be here.
             </div>
         )}
         {activeView === 'SETTINGS' && (
             <div className="flex-1 flex items-center justify-center text-slate-500">
                 Settings logic would be here.
             </div>
         )}
      </main>
      <CallModal />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
       <MainLayout />
    </AppProvider>
  );
};

export default App;
