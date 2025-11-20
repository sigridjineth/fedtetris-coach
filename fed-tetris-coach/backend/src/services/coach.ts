import { getDb } from '../db';
import { getFlockAdvice, StrategyAdvice } from './flock';
import crypto from 'crypto';

// L0 Cache: In-memory
const l0Cache = new Map<string, StrategyAdvice>();

interface TetrisState {
  board: number[][];
  currentPiece: any;
  nextQueue: any[];
  holdPiece: any | null;
  level: number;
  // ... other fields
}

function fingerprint(state: TetrisState): string {
  // Simplify state for caching (fuzzy matching could be added here)
  // Taking top 10 rows of board, current piece, etc.
  // If state.board is missing or wrong shape, handle gracefully
  const board = state.board || [];
  const compact = {
    boardTop: board.slice(0, 10), 
    piece: state.currentPiece,
    next: (state.nextQueue || []).slice(0, 1),
    hold: state.holdPiece,
    lvl: Math.floor((state.level || 0) / 3) // bucket levels
  };
  return crypto.createHash('sha256').update(JSON.stringify(compact)).digest('hex');
}

export async function getAdvice(
    state: TetrisState, 
    playerProfile: any,
    walletAddress?: string
): Promise<StrategyAdvice & { source: string }> {
  const key = fingerprint(state);

  // 1. L0 Cache Check
  if (l0Cache.has(key)) {
    return { ...l0Cache.get(key)!, source: 'L0_CACHE' };
  }

  const db = await getDb();

  // 2. L1 Cache Check (SQLite)
  const entry = await db.get('SELECT value_json FROM kv_entries WHERE key = ?', key);
  if (entry) {
    const advice = JSON.parse(entry.value_json);
    l0Cache.set(key, advice);
    return { ...advice, source: 'L1_KV_STORE' };
  }

  // 3. Miss - Call FLock
  const advice = await getFlockAdvice(state, playerProfile);

  // 4. Write Back
  l0Cache.set(key, advice);
  
  // Async write to DB (don't block response)
  db.run(
    `INSERT OR REPLACE INTO kv_entries (key, value_json, prompt_hash, model_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    key,
    JSON.stringify(advice),
    'hash_placeholder', // TODO: Hash prompts
    'qwen-32b',
    Date.now(),
    Date.now()
  ).catch(err => console.error("KV Write Error:", err));

  return { ...advice, source: 'FLOCK_GENERATE' };
}