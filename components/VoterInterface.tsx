import React, { useState } from 'react';
import { Program } from '../types';
import { Heart, CheckCircle2, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface VoterInterfaceProps {
  programs: Program[];
  isVotingActive: boolean;
  onVote: (programId: string) => void;
  hasVoted: boolean;
  votedProgramId: string | null;
  isConnected: boolean;
}

const VoterInterface: React.FC<VoterInterfaceProps> = ({ 
  programs, 
  isVotingActive, 
  onVote, 
  hasVoted,
  votedProgramId,
  isConnected
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSubmit = () => {
    if (selectedId && isConnected) {
      onVote(selectedId);
    } else if (!isConnected) {
      alert("正在连接云端服务器，请稍后再试...");
    }
  };

  const getVotedProgramName = () => {
    return programs.find(p => p.id === votedProgramId)?.name || '未知节目';
  };

  if (hasVoted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-sm">
           <div className="mb-8 transform transition-all animate-[bounce_1s_infinite]">
             <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto" />
           </div>
           <h2 className="text-2xl font-bold text-slate-800 mb-2">投票成功!</h2>
           <p className="text-slate-600 mb-8">您已投票给：<br/><span className="font-bold text-indigo-600 text-lg">{getVotedProgramName()}</span></p>
           <p className="text-sm text-slate-400">感谢您的参与，请关注大屏幕查看实时排名。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      {/* Mobile Header */}
      <div className="bg-white sticky top-0 z-20 px-4 py-4 shadow-sm border-b border-slate-200 flex justify-between items-center">
         <div>
            <h1 className="text-lg font-bold text-slate-800">年度盛典 - 节目评选</h1>
            <p className="text-xs text-slate-500">请选择您最喜爱的一个节目</p>
         </div>
         <div className="flex items-center gap-1">
            {isConnected ? <Wifi size={16} className="text-green-500"/> : <WifiOff size={16} className="text-red-500 animate-pulse"/>}
         </div>
      </div>

      {!isConnected && (
        <div className="bg-red-50 p-2 text-center text-xs text-red-500 font-medium">
          与主会场断开连接，正在重连...
        </div>
      )}

      {/* Program List */}
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {programs.map((program) => (
          <div 
            key={program.id}
            onClick={() => setSelectedId(program.id)}
            className={`bg-white rounded-xl overflow-hidden shadow-sm transition-all duration-200 border-2 cursor-pointer
              ${selectedId === program.id ? 'border-indigo-600 ring-4 ring-indigo-50/50 transform scale-[1.02]' : 'border-transparent hover:border-slate-200'}
            `}
          >
            <div className="relative h-40">
              <img 
                src={`https://picsum.photos/id/${program.imageIndex}/600/400`} 
                alt={program.name} 
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <div className="text-white">
                  <p className="font-bold text-lg leading-tight">{program.name}</p>
                  <p className="text-sm opacity-90">{program.performer}</p>
                </div>
              </div>
              {selectedId === program.id && (
                <div className="absolute top-3 right-3 bg-indigo-600 text-white p-1.5 rounded-full shadow-lg">
                  <CheckCircle2 size={20} />
                </div>
              )}
            </div>
            <div className="p-4">
               <p className="text-sm text-slate-600">{program.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 z-30">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!selectedId || !isConnected}
            className={`w-full py-3.5 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2
              ${selectedId && isConnected
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-200 translate-y-0' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed translate-y-1'
              }
            `}
          >
            <Heart size={20} className={selectedId ? "fill-white" : ""} />
            {isConnected ? '确认投票' : '连接中...'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoterInterface;