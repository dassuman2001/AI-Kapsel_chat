import React from 'react';
import { useApp } from '../context/AppContext';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';

const StatusSection: React.FC = () => {
  const { stories, users, currentUser } = useApp();

  return (
    <div className="flex-1 bg-slate-950 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Stories</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* Add Story Card */}
            <div className="aspect-[9/16] rounded-2xl bg-slate-800 border-2 border-dashed border-slate-600 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-750 transition-colors group relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-900/50 group-hover:bg-slate-900/30 transition-all z-0">
                    <img src={currentUser.avatar} alt="Me" className="w-full h-full object-cover opacity-50 blur-sm" />
                </div>
                <div className="z-10 flex flex-col items-center">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white mb-2 shadow-lg">
                        <Plus size={24} />
                    </div>
                    <span className="text-sm font-medium text-white">Add Story</span>
                </div>
            </div>

            {/* Stories List */}
            {stories.map(story => {
                const author = users.find(u => u.id === story.userId) || currentUser;
                return (
                    <div key={story.id} className="aspect-[9/16] rounded-2xl bg-slate-800 relative overflow-hidden group cursor-pointer border border-slate-800 hover:border-indigo-500/50 transition-all">
                        {story.mediaType === 'image' ? (
                            <img src={story.mediaUrl} alt="Story" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" />
                        ) : (
                            <video src={story.mediaUrl} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 opacity-60"></div>
                        
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full border-2 border-indigo-500 p-0.5 bg-black">
                                 <img src={author.avatar} className="w-full h-full rounded-full object-cover" />
                             </div>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                             <p className="text-white text-sm font-bold truncate">{author.name}</p>
                             <p className="text-slate-300 text-xs">{format(story.timestamp, 'HH:mm')}</p>
                        </div>
                    </div>
                )
            })}
        </div>
    </div>
  );
};

export default StatusSection;
