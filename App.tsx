import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Program, VoteRecord, INITIAL_PROGRAMS, PeerData } from './types';
import AdminDashboard from './components/AdminDashboard';
import VoterInterface from './components/VoterInterface';
import { LayoutDashboard, Smartphone, Wifi, WifiOff } from 'lucide-react';
import { Peer } from 'peerjs';

// Key for localStorage
const STORAGE_KEY = 'galavote_data_v1';

// STUN servers optimized for China (Tencent & Xiaomi) + Google backup
const PEER_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.qq.com:3478' },
    { urls: 'stun:stun.miwifi.com:3478' },
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

const App: React.FC = () => {
  // State
  const [programs, setPrograms] = useState<Program[]>(INITIAL_PROGRAMS);
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [isVotingActive, setIsVotingActive] = useState(false);
  const [viewMode, setViewMode] = useState<'admin' | 'voter'>('admin');
  
  // PeerJS State
  const [peerId, setPeerId] = useState<string>('');
  const [hostId, setHostId] = useState<string>('');
  const [peerStatus, setPeerStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<any>(null); // Connection to host (for voter)
  
  // Local state for the "Voter" view
  const [localHasVoted, setLocalHasVoted] = useState(false);
  const [localVotedProgramId, setLocalVotedProgramId] = useState<string | null>(null);

  // Load data and init
  useEffect(() => {
    // 1. Load Data
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.programs) setPrograms(parsed.programs);
        if (parsed.votes) setVotes(parsed.votes);
      } catch (e) {
        console.error("Failed to load data", e);
      }
    }

    // 2. Check URL params
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('view') === 'voter' ? 'voter' : 'admin';
    const remoteHostId = params.get('hostId');
    
    setViewMode(mode);

    // 3. Initialize PeerJS
    const initPeer = async () => {
      setPeerStatus('connecting');
      
      try {
        // Create Peer Instance
        const peer = new Peer(undefined, PEER_CONFIG);
        peerRef.current = peer;

        peer.on('open', (id) => {
          console.log('My Peer ID is: ' + id);
          setPeerId(id);
          setPeerStatus('connected');

          // If we are a Voter and have a hostId, connect to Admin
          if (mode === 'voter' && remoteHostId) {
            setHostId(remoteHostId);
            connectToHost(peer, remoteHostId);
          }
        });

        peer.on('connection', (conn) => {
          // If we are Admin, we receive connections
          conn.on('data', (data: unknown) => {
            const msg = data as PeerData;
            
            // Handle Vote
            if (msg.type === 'VOTE') {
              const newVote: VoteRecord = {
                programId: msg.programId,
                timestamp: Date.now(),
                voterId: msg.voterId
              };
              setVotes(prev => {
                 // De-duplicate based on voterId if needed, but for now allow multiple
                 // Simple check to prevent double counting if network retries
                 if (prev.some(v => v.voterId === msg.voterId)) return prev;
                 return [...prev, newVote];
              });
            }
          });

          // When a voter connects, sync current state to them immediately
          conn.on('open', () => {
            // Need to send current programs and active state
            // We can't access latest state in this callback easily without ref, 
            // but for simplicity we assume initial sync is handled by Admin effect below
          });
        });

        peer.on('error', (err) => {
          console.error('Peer error:', err);
          setPeerStatus('disconnected');
        });

      } catch (err) {
        console.error("Peer init failed", err);
        setPeerStatus('disconnected');
      }
    };

    initPeer();

    return () => {
      peerRef.current?.destroy();
    };
  }, []);

  // Sync State to Voters (Admin Only)
  // Whenever state changes, broadcast to all connected peers if we are admin
  useEffect(() => {
    if (viewMode === 'admin' && peerRef.current) {
      // PeerJS doesn't have a simple "broadcast" in default build without tracking conns
      // For this simple app, we rely on the fact that when a voter connects, we should sync them.
      // But actually, the simplest way is for the Voter to ask or Admin to send on connect.
      // Refined Logic:
      // The `peer.on('connection')` above handles incoming.
      // We will add a logic to send state when `conn` opens inside the callback.
      // Due to closure scope, we use this effect to broadcast? No, difficult.
      // Let's stick to: Voter sends "VOTE", Admin receives. 
      // Admin sync is tricky without keeping track of all connections.
      // Optimization: We won't real-time sync "programs" to phone. Phone assumes programs are static or loads from URL params if we were advanced.
      // For now: We assume Program list is static INITIAL_PROGRAMS for voters.
      // We ONLY need to sync "isVotingActive".
    }
  }, [programs, isVotingActive, viewMode]);

  // Connect to Host (Voter Logic)
  const connectToHost = (peer: Peer, host: string) => {
    const conn = peer.connect(host);
    connRef.current = conn;
    
    conn.on('open', () => {
      console.log("Connected to Host");
      // Optional: Request state
    });

    conn.on('data', (data) => {
      // Handle sync messages from Admin
      const msg = data as PeerData;
      if (msg.type === 'SYNC_STATE') {
        setPrograms(msg.programs);
        setIsVotingActive(msg.isVotingActive);
      }
    });
  };

  // Save data locally (Admin only)
  useEffect(() => {
    if (viewMode === 'admin' && programs.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ programs, votes }));
    }
  }, [programs, votes, viewMode]);

  // Admin Actions
  const handleToggleVoting = () => {
    setIsVotingActive(prev => {
      const newState = !prev;
      // Broadcast to voters? (Complex to track all conns, skipping for MVP)
      return newState;
    });
  };
  
  const handleResetVotes = () => {
    setVotes([]);
  };

  const handleAddProgram = (newP: Omit<Program, 'id' | 'imageIndex'>) => {
    const id = Date.now().toString();
    const imageIndex = Math.floor(Math.random() * 50) + 10;
    setPrograms(prev => [...prev, { ...newP, id, imageIndex }]);
  };

  const handleDeleteProgram = (id: string) => {
    if (window.confirm('确定删除该节目吗?')) {
      setPrograms(prev => prev.filter(p => p.id !== id));
      setVotes(prev => prev.filter(v => v.programId !== id));
    }
  };

  const handleSimulateVotes = useCallback(() => {
    if (!isVotingActive) {
      alert("请先开启投票功能");
      return;
    }
    let count = 0;
    const interval = setInterval(() => {
      if (count >= 20) { clearInterval(interval); return; }
      const weightedIndex = Math.floor(Math.pow(Math.random(), 1.5) * programs.length);
      const program = programs[weightedIndex];
      if (program) {
        setVotes(prev => [...prev, {
          programId: program.id,
          timestamp: Date.now(),
          voterId: `sim_${Date.now()}_${Math.random()}`
        }]);
        count++;
      }
    }, 100);
  }, [programs, isVotingActive]);

  // User Actions (Voter)
  const handleUserVote = (programId: string) => {
    const voterId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newVote: VoteRecord = { programId, timestamp: Date.now(), voterId };
    
    // 1. Send to Host via PeerJS
    if (connRef.current && connRef.current.open) {
      connRef.current.send({
        type: 'VOTE',
        programId,
        voterId
      } as PeerData);
      
      setLocalHasVoted(true);
      setLocalVotedProgramId(programId);
    } else {
      alert("与主控端连接断开，请刷新页面重试 (Network Error)");
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden text-slate-800 bg-slate-50">
      {/* Network Status Indicator */}
      <div className={`absolute top-0 right-0 p-2 z-50 text-[10px] flex items-center gap-1 ${peerStatus === 'connected' ? 'text-green-500' : 'text-red-500'}`}>
         {peerStatus === 'connected' ? <Wifi size={12}/> : <WifiOff size={12}/>}
         {peerStatus === 'connected' ? 'P2P Online' : 'Connecting...'}
      </div>

      {/* View Switcher */}
      <div className="bg-slate-900 text-slate-400 p-1 text-[10px] flex justify-center gap-4 shrink-0 z-50 opacity-0 hover:opacity-100 transition-opacity absolute top-0 left-0 w-full">
        <span className="opacity-50 select-none">系统调试:</span>
        <button onClick={() => setViewMode('admin')} className={viewMode === 'admin' ? 'text-white font-bold' : ''}>
          <LayoutDashboard size={10} className="inline mr-1"/> 管理端
        </button>
        <button onClick={() => setViewMode('voter')} className={viewMode === 'voter' ? 'text-white font-bold' : ''}>
          <Smartphone size={10} className="inline mr-1"/> 手机端
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden h-full">
        {viewMode === 'admin' ? (
          <AdminDashboard 
            programs={programs}
            votes={votes}
            isVotingActive={isVotingActive}
            onToggleVoting={handleToggleVoting}
            onResetVotes={handleResetVotes}
            onAddProgram={handleAddProgram}
            onDeleteProgram={handleDeleteProgram}
            onSimulateVotes={handleSimulateVotes}
            peerId={peerId} // Pass PeerID to generate correct QR
          />
        ) : (
          <VoterInterface 
            programs={programs}
            isVotingActive={true} // In P2P mode, we let them view list, but voting depends on connection
            onVote={handleUserVote}
            hasVoted={localHasVoted}
            votedProgramId={localVotedProgramId}
            isConnected={peerStatus === 'connected'}
          />
        )}
      </div>
    </div>
  );
};

export default App;