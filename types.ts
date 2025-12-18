export interface Program {
  id: string;
  name: string;
  performer: string;
  description: string;
  imageIndex: number; // For placeholder image generation
}

export interface VoteRecord {
  programId: string;
  timestamp: number;
  voterId: string; // Simulated unique ID
}

export interface AppState {
  programs: Program[];
  votes: VoteRecord[];
  isVotingActive: boolean;
  viewMode: 'admin' | 'voter' | 'results';
}

// Data packet types for P2P communication
export type PeerData = 
  | { type: 'VOTE'; programId: string; voterId: string }
  | { type: 'SYNC_STATE'; programs: Program[]; isVotingActive: boolean; votes: VoteRecord[] };

export const INITIAL_PROGRAMS: Program[] = [
  { id: '1', name: '开场舞：盛世龙腾', performer: '舞蹈队', description: '气势恢宏的开场舞蹈表演', imageIndex: 10 },
  { id: '2', name: '歌曲：通过云端', performer: '张伟', description: '深情独唱，震撼全场', imageIndex: 11 },
  { id: '3', name: '小品：办公室的故事', performer: '销售部', description: '爆笑职场生活写照', imageIndex: 12 },
  { id: '4', name: '魔术：奇迹时刻', performer: '李明', description: '近景魔术，见证奇迹', imageIndex: 13 },
  { id: '5', name: '大合唱：明天会更好', performer: '全体高管', description: '温情满满的大合唱', imageIndex: 14 },
  { id: '6', name: '古筝独奏：高山流水', performer: '王芳', description: '传统文化，视听盛宴', imageIndex: 15 },
  { id: '7', name: '街舞：青春风暴', performer: '实习生团队', description: '活力四射的现代舞', imageIndex: 16 },
  { id: '8', name: '相声：趣谈编程', performer: '开发组', description: '程序员的幽默你懂吗', imageIndex: 17 },
  { id: '9', name: '诗朗诵：奋斗', performer: '李总', description: '激情澎湃的诗歌朗诵', imageIndex: 18 },
  { id: '10', name: '压轴：难忘今宵', performer: '全员', description: '经典曲目，完美落幕', imageIndex: 19 },
];