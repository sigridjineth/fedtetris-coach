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

const BOARD_WIDTH = 10;

function normalizePiece(piece: any): string {
  if (!piece) return 'none';
  const type = (piece.type ?? piece.name ?? piece.id ?? 'unknown').toString();
  // Rotation matters for strategy, but minor variations in state (e.g. spawn frame) shouldn't break cache
  const rot = (piece.rotation ?? piece.state ?? piece.dir ?? 0).toString();
  return `${type}:${rot}`;
}

function bucket(value: number, size: number): number {
  return Math.floor((value || 0) / size);
}

function bucketArray(values: number[], size: number): number[] {
  return values.map(v => bucket(v, size));
}

function extractBoardFeatures(board: number[][]) {
  const rows = board.length;
  const cols = board[0]?.length ?? BOARD_WIDTH;
  const heights = new Array(cols).fill(0);
  let holes = 0;

  for (let c = 0; c < cols; c++) {
    let seenBlock = false;
    for (let r = 0; r < rows; r++) {
      const cell = board[r]?.[c] ?? 0;
      if (cell) {
        if (!seenBlock) {
          heights[c] = rows - r; // height from bottom
          seenBlock = true;
        }
      } else if (seenBlock) {
        holes++; // empty cell under the surface
      }
    }
  }

  let bumpiness = 0;
  for (let c = 0; c < cols - 1; c++) {
    bumpiness += Math.abs(heights[c] - heights[c + 1]);
  }

  const maxHeight = Math.max(...heights, 0);
  const avgHeight = heights.reduce((a, b) => a + b, 0) / (cols || 1);

  return { heights, holes, bumpiness, maxHeight, avgHeight };
}

function fingerprint(state: TetrisState): string {
  const board = state.board || [];
  const { heights, holes, bumpiness, maxHeight, avgHeight } = extractBoardFeatures(board);

  const signature = {
    // Coarse features for fuzzy matching
    heights: bucketArray(heights, 2),       // Match shapes that are within 2 rows of height difference
    holes: bucket(holes, 3),                // Group by hole count (0-2, 3-5, etc)
    bump: bucket(bumpiness, 4),             // General surface roughness
    max: bucket(maxHeight, 2),              // Max height bucket
    avg: bucket(avgHeight, 2),              // Avg height bucket
    
    // Piece context
    piece: normalizePiece(state.currentPiece),
    next: normalizePiece((state.nextQueue ?? [])[0]),
    hold: normalizePiece(state.holdPiece),
    
    // Game phase context
    lvl: bucket(state.level ?? 0, 5)        // Strategy shifts every ~5 levels
  };

  return crypto.createHash('sha256').update(JSON.stringify(signature)).digest('hex');
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
