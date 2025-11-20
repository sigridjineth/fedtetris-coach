import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { initDb, getDb } from './db';
import { getAdvice } from './services/coach';
import crypto from 'crypto';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Initialize DB
initDb().catch(console.error);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Coach API
app.post('/api/coach', async (req, res) => {
  try {
    const { state, playerProfile, walletAddress } = req.body;
    if (!state) {
      return res.status(400).json({ error: 'Missing state' });
    }
    
    const advice = await getAdvice(state, playerProfile || {}, walletAddress);
    res.json(advice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Replay Upload
app.post('/api/replay', async (req, res) => {
  try {
    const { episodes, score, level, walletAddress } = req.body;
    const db = await getDb();
    const id = crypto.randomUUID();
    
    // Save episode meta
    await db.run(
        `INSERT INTO episodes (id, wallet, start_at, end_at, score, lines_cleared, meta_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        id,
        walletAddress || 'anon',
        episodes[0]?.timestamp || Date.now(),
        Date.now(),
        score,
        level, // mapping level to lines_cleared roughly for this schema
        JSON.stringify({ count: episodes.length })
    );

    // Save steps (sampled)
    const stmt = await db.prepare(`INSERT INTO steps (episode_id, seq, state_key, action, score_delta) VALUES (?, ?, ?, ?, ?)`);
    for (let i = 0; i < episodes.length; i++) {
        const ep = episodes[i];
        // Simple fingerprint for key
        const key = crypto.createHash('sha256').update(JSON.stringify(ep.state)).digest('hex');
        await stmt.run(id, i, key, 'DROP', 0); // Mock action for now
    }
    await stmt.finalize();

    console.log(`Replay saved: ${id} for ${walletAddress}`);
    res.json({ success: true, id });
  } catch (error) {
    console.error("Replay Error:", error);
    res.status(500).json({ error: 'Failed to save replay' });
  }
});

app.listen(port, () => {
  console.log(`FedTetris Coach Backend running on port ${port}`);
});