import React, { useState, useEffect } from 'react';
import { Program, VoteRecord } from '../types';
import ResultsChart from './ResultsChart';
import { Play, Square, RefreshCw, Users, Trash2, Plus, Trophy, QrCode, Monitor, X, AlertTriangle, ExternalLink, Link } from 'lucide-react';

interface AdminDashboardProps {
  programs: Program[];
  votes: VoteRecord[];
  isVotingActive: boolean;
  onToggleVoting: () => void;
  onResetVotes: () => void;
  onAddProgram: (program: Omit<Program, 'id' | 'imageIndex'>) => void;
  onDeleteProgram: (id: string) => void;
  onSimulateVotes: () => void;
  peerId: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  programs,
  votes,
  isVotingActive,
  onToggleVoting,
  onResetVotes,
  onAddProgram,
  onDeleteProgram,
  onSimulateVotes,
  peerId,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'programs'>('dashboard');
  const [newProgram, setNewProgram] = useState({ name: '', performer: '', description: '' });
  const [showQrModal, setShowQrModal] = useState(false);
  const [isBigScreen, setIsBigScreen] = useState(false);
  
  const [customBaseUrl, setCustomBaseUrl] = useState('');

  useEffect(() => {
    // Default to current URL, removing parameters
    setCustomBaseUrl(window.location.href.split('?')[0]);
  }, []);

  // Generate URL for QR Code including the Peer Host ID
  const voteUrl = `${customBaseUrl}?view=voter&hostId=${peerId}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(voteUrl)}&bgcolor=ffffff`;
  
  const isBadUrl = customBaseUrl.startsWith('blob:') || customBaseUrl.includes('localhost') || customBaseUrl.includes('127.0.0.1');

  const voteCounts: Record<string, number> = {};
  votes.forEach(v => voteCounts[v.programId] = (voteCounts[v.programId] || 0) + 1);
  const sortedPrograms = [...programs].sort((a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0));
  const leader = sortedPrograms.length > 0 ? sortedPrograms[0] : null;

  const handleAdd = () => {
    if (newProgram.name && newProgram.performer) {
      onAddProgram(newProgram);
      setNewProgram({ name: '', performer: '', description: '' });
    }
  };

  // --- Big Screen View ---
  if (isBigScreen) {
    return (
      <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden relative">
        <div className="p-6 flex justify-between items-start z-10">
           <div>
             <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">年度盛典实时投票</h1>
             <p className="text-slate-400 mt-2 text-lg">扫码加入 (云端直连)</p>
           </div>
           <div className="flex items-center gap-4">
              <div className={`px-6 py-2 rounded-full font-bold text-lg flex items-center gap-2 ${isVotingActive ? 'bg-green-600/20 text-green-400 border border-green-500/50' : 'bg-red-600/20 text-red-400 border border-red-500/50'}`}>
                <div className={`w-3 h-3 rounded-full ${isVotingActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                {isVotingActive ? '通道已开启' : '通道已关闭'}
              </div>
              <button onClick={() => setIsBigScreen(false)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors text-slate-400 hover:text-white">
                <X size={24} />
              </button>
           </div>
        </div>

        <div className="flex-1 flex gap-8 p-8 overflow-hidden">
           <div className="flex-1 bg-slate-800/50 rounded-3xl p-6 border border-slate-700/50 backdrop-blur-sm flex flex-col">
              <h2 className="text-2xl font-bold mb-6 text-slate-300 flex items-center gap-2">
                <Users className="text-indigo-400" /> 实时得票趋势
                <span className="ml-auto text-lg font-normal text-slate-500">总票数: {votes.length}</span>
              </h2>
              <div className="flex-1 w-full h-full min-h-0">
                 <ResultsChart programs={programs} votes={votes} />
              </div>
           </div>

           <div className="w-[350px] flex flex-col gap-6 shrink-0">
              <div className="bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center text-slate-900">
                  <p className="font-bold text-lg mb-4 text-center">手机扫码投票</p>
                  <img src={qrImageUrl} alt="Vote QR" className="w-48 h-48 mb-2" />
                  {peerId ? (
                    <p className="text-xs text-green-600 font-mono">云端服务已连接</p>
                  ) : (
                    <p className="text-xs text-red-500 animate-pulse">正在连接云端服务...</p>
                  )}
              </div>

              <div className="flex-1 bg-slate-800/50 rounded-3xl p-6 border border-slate-700/50 backdrop-blur-sm overflow-hidden flex flex-col">
                 <h2 className="text-xl font-bold mb-4 text-slate-300 flex items-center gap-2">
                    <Trophy className="text-yellow-400" /> 当前领先
                 </h2>
                 <div className="overflow-y-auto space-y-3 no-scrollbar">
                    {sortedPrograms.slice(0, 5).map((p, idx) => (
                       <div key={p.id} className="flex items-center gap-3 bg-slate-700/40 p-3 rounded-xl border border-slate-600/30">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-900 ${idx===0?'bg-yellow-400':idx===1?'bg-slate-300':idx===2?'bg-orange-400':'bg-slate-500'}`}>{idx+1}</div>
                          <div className="min-w-0 flex-1">
                             <div className="font-medium truncate text-white">{p.name}</div>
                             <div className="text-xs text-slate-400 truncate">{p.performer}</div>
                          </div>
                          <div className="font-bold text-indigo-400">{voteCounts[p.id]||0}</div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">GalaVote 控制台</h1>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className={`w-2 h-2 rounded-full ${isVotingActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
              {peerId ? '云端连接成功' : '连接中...'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button onClick={() => setIsBigScreen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm">
            <Monitor size={16} /> 大屏模式
          </button>
           <button onClick={() => setShowQrModal(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-all">
            <QrCode size={16} /> 投票码
          </button>
           <div className="h-8 w-px bg-slate-200 mx-2"></div>
           <button onClick={onSimulateVotes} disabled={!isVotingActive} className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${!isVotingActive ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}>
            <Users size={16} /> 模拟数据
          </button>
          <button onClick={onToggleVoting} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm ${isVotingActive ? 'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100'}`}>
            {isVotingActive ? <><Square size={16} fill="currentColor" /> 停止投票</> : <><Play size={16} fill="currentColor" /> 开始投票</>}
          </button>
          <button onClick={() => { if(window.confirm('确定清空?')) onResetVotes(); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><RefreshCw size={18} /></button>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-6 pt-6 flex gap-1 shrink-0">
        <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-white text-indigo-600 border-t border-x border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}>实时数据看板</button>
        <button onClick={() => setActiveTab('programs')} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${activeTab === 'programs' ? 'bg-white text-indigo-600 border-t border-x border-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}>节目单管理</button>
        <div className="flex-1 border-b border-slate-200 transform translate-y-[1px] -z-10"></div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-white mx-6 mb-6 rounded-b-lg rounded-tr-lg shadow-sm border border-slate-200 mt-[-1px]">
        {activeTab === 'dashboard' && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100"><p className="text-slate-500 text-sm font-medium mb-1">总票数</p><p className="text-3xl font-bold text-slate-800">{votes.length}</p></div>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100"><p className="text-slate-500 text-sm font-medium mb-1">云端连接 ID</p><p className="text-xs font-mono text-slate-500 break-all">{peerId || '获取中...'}</p></div>
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-5 rounded-xl shadow-md text-white"><p className="text-indigo-100 text-sm font-medium mb-1">当前领跑</p><div className="flex items-center gap-2"><Trophy size={20} className="text-yellow-300" /><p className="text-xl font-bold truncate">{leader ? leader.name : '暂无数据'}</p></div></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 border border-slate-100 rounded-xl p-4"><ResultsChart programs={programs} votes={votes} /></div>
              <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden flex flex-col h-[400px]">
                <div className="p-4 border-b border-slate-200"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Trophy size={16} className="text-yellow-500"/> 排行榜详情</h3></div>
                <div className="overflow-y-auto flex-1 p-2">{sortedPrograms.map((program, idx) => (
                    <div key={program.id} className="flex items-center p-3 hover:bg-white rounded-lg transition-colors border-b border-slate-100 last:border-0"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 shrink-0 ${idx === 0 ? 'bg-yellow-100 text-yellow-600' : idx === 1 ? 'bg-gray-200 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-white border border-slate-200 text-slate-500'}`}>{idx + 1}</div><div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-800 truncate">{program.name}</p><p className="text-xs text-slate-500 truncate">{program.performer}</p></div><div className="text-sm font-bold text-indigo-600 ml-2">{voteCounts[program.id] || 0}</div></div>))}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'programs' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6"><h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Plus size={18} /> 添加新节目</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><input type="text" placeholder="节目名称" className="px-4 py-2 rounded-lg border border-slate-300" value={newProgram.name} onChange={e => setNewProgram({...newProgram, name: e.target.value})} /><input type="text" placeholder="表演者" className="px-4 py-2 rounded-lg border border-slate-300" value={newProgram.performer} onChange={e => setNewProgram({...newProgram, performer: e.target.value})} /></div><button onClick={handleAdd} className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium">添加</button></div>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden"><div className="divide-y divide-slate-100">{programs.map((program) => (<div key={program.id} className="p-4 flex items-center justify-between hover:bg-slate-50 group"><div className="flex items-center gap-4"><div className="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden shrink-0"><img src={`https://picsum.photos/id/${program.imageIndex}/200/200`} className="w-full h-full object-cover"/></div><div><p className="font-medium text-slate-800">{program.name}</p><p className="text-sm text-slate-500">{program.performer}</p></div></div><button onClick={() => onDeleteProgram(program.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={18} /></button></div>))}</div></div>
          </div>
        )}
      </div>

      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowQrModal(false)}>
           <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-bold text-slate-800">扫码参与投票</h3>
                 <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>

              {isBadUrl && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-left">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="text-xs font-bold text-amber-800">关键提示：需要部署</p>
                      <p className="text-[10px] text-amber-700 mt-1 leading-tight">
                        手机无法直接访问 Localhost 链接。请将此项目部署到 <span className="font-bold">Vercel / GitHub Pages</span> 获得公网链接，即可实现全网互通投票。
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4 text-left">
                <label className="text-xs font-bold text-slate-500 mb-1 block">当前投票链接:</label>
                <div className="flex gap-2">
                  <input type="text" value={customBaseUrl} onChange={(e) => setCustomBaseUrl(e.target.value)} className="flex-1 text-xs border border-slate-300 rounded px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="例如: https://my-vote.vercel.app" />
                </div>
              </div>
              
              <div className="bg-white border-2 border-slate-100 p-2 rounded-xl inline-block mb-4 shadow-inner relative">
                 <img src={qrImageUrl} alt="QR Code" className={`w-48 h-48 mix-blend-multiply ${!peerId ? 'opacity-20' : ''}`} />
                 {!peerId && <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-400">正在生成云端ID...</div>}
              </div>

              <div className="flex gap-2 justify-center">
                 <a href={voteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-indigo-600 text-xs font-medium hover:underline">
                   在浏览器打开 <ExternalLink size={10} />
                 </a>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;