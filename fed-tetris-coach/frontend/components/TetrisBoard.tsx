"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createStage, checkCollision, randomTetromino, ROWS, COLS } from '../lib/tetris'; // Fixed import
import { fetchCoachAdvice, uploadReplay, CoachAdvice } from '../lib/api';
import CoachPanel from './CoachPanel';
import { useAccount } from 'wagmi';

// Styles
const cellStyle = (color: string) => ({
    width: 'auto',
    background: `rgba(${color}, 0.8)`,
    border: `4px solid rgba(${color}, 1)`,
    borderBottomColor: `rgba(${color}, 0.1)`,
    borderRightColor: `rgba(${color}, 1)`,
    borderTopColor: `rgba(${color}, 1)`,
    borderLeftColor: `rgba(${color}, 0.3)`,
});

// Custom Hook for Interval
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => {
        if (savedCallback.current) savedCallback.current();
      }, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

const Tetris = () => {
  const { address } = useAccount();
  const [dropTime, setDropTime] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [rows, setRows] = useState(0);
  const [level, setLevel] = useState(0);

  // Game State
  const [stage, setStage] = useState(createStage());
  const [player, setPlayer] = useState({
    pos: { x: 0, y: 0 },
    tetromino: randomTetromino().shape,
    collided: false,
  });
  
  // Replay Log
  const replayLog = useRef<any[]>([]);

  // Advice State
  const [advice, setAdvice] = useState<CoachAdvice | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Helpers
  const movePlayer = (dir: number) => {
    if (!checkCollision(player, stage, { x: dir, y: 0 })) {
      updatePlayerPos({ x: dir, y: 0, collided: false });
    }
  };

  const startGame = () => {
    // Reset everything
    setStage(createStage());
    setDropTime(1000);
    resetPlayer();
    setGameOver(false);
    setScore(0);
    setRows(0);
    setLevel(0);
    replayLog.current = [];
  };

  const resetPlayer = useCallback(() => {
    setPlayer({
      pos: { x: COLS / 2 - 2, y: 0 },
      tetromino: randomTetromino().shape,
      collided: false,
    });
  }, []);

  const drop = () => {
    // Increase level every 10 rows
    if (rows > (level + 1) * 10) {
      setLevel((prev) => prev + 1);
      setDropTime(1000 / (level + 1) + 200);
    }

    if (!checkCollision(player, stage, { x: 0, y: 1 })) {
      updatePlayerPos({ x: 0, y: 1, collided: false });
    } else {
      // Game Over
      if (player.pos.y < 1) {
        console.log("GAME OVER!!!");
        setGameOver(true);
        setDropTime(null);
        // Upload Replay
        uploadReplay({
            episodes: replayLog.current,
            score,
            level
        }, address);
      }
      updatePlayerPos({ x: 0, y: 0, collided: true });
    }
  };

  const keyUp = ({ keyCode }: { keyCode: number }) => {
    if (!gameOver) {
      if (keyCode === 40) {
        setDropTime(1000 / (level + 1) + 200);
      }
    }
  };

  const dropPlayer = () => {
    setDropTime(null);
    drop();
  };

  const move = ({ keyCode }: { keyCode: number }) => {
    if (!gameOver) {
      if (keyCode === 37) { // Left
        movePlayer(-1);
      } else if (keyCode === 39) { // Right
        movePlayer(1);
      } else if (keyCode === 40) { // Down
        dropPlayer();
      } else if (keyCode === 38) { // Up (Rotate)
        playerRotate(stage, 1);
      }
    }
  };

  const playerRotate = (stage: any, dir: number) => {
     // Simple rotation logic
     const clonedPlayer = JSON.parse(JSON.stringify(player));
     clonedPlayer.tetromino = rotate(clonedPlayer.tetromino, dir);
     
     const pos = clonedPlayer.pos.x;
     let offset = 1;
     while (checkCollision(clonedPlayer, stage, { x: 0, y: 0 })) {
       clonedPlayer.pos.x += offset;
       offset = -(offset + (offset > 0 ? 1 : -1));
       if (offset > clonedPlayer.tetromino[0].length) {
         rotate(clonedPlayer.tetromino, -dir);
         clonedPlayer.pos.x = pos;
         return;
       }
     }
     setPlayer(clonedPlayer);
  };

  const rotate = (matrix: any, dir: number) => {
     // Transpose
     const rotatedTetro = matrix.map((_: any, index: number) => 
       matrix.map((col: any) => col[index])
     );
     // Reverse rows to rotate
     if (dir > 0) return rotatedTetro.map((row: any) => row.reverse());
     return rotatedTetro.reverse();
  };

  const updatePlayerPos = ({ x, y, collided }: { x: number, y: number, collided: boolean }) => {
    setPlayer(prev => ({
      ...prev,
      pos: { x: prev.pos.x + x, y: prev.pos.y + y },
      collided,
    }));
  };

  // Game Loop
  useInterval(() => {
    drop();
  }, dropTime);

  // Effect: Update Stage when collided
  useEffect(() => {
     const updateStage = (prevStage: any) => {
       const newStage = prevStage.map((row: any) =>
         row.map((cell: any) => (cell[1] === 'clear' ? [0, 'clear'] : cell))
       );

       player.tetromino.forEach((row: any, y: any) => {
         row.forEach((value: any, x: any) => {
           if (value !== 0) {
             newStage[y + player.pos.y][x + player.pos.x] = [
               value,
               `${player.collided ? 'merged' : 'clear'}`,
             ];
           }
         });
       });

       if (player.collided) {
         resetPlayer();
         return sweepRows(newStage);
       }

       return newStage;
     };

     setStage((prev: any) => updateStage(prev));

  }, [player, resetPlayer]);

  const sweepRows = (newStage: any) => {
     return newStage.reduce((ack: any, row: any) => {
       if (row.findIndex((cell: any) => cell[0] === 0) === -1) {
         setRows(prev => prev + 1);
         setScore(prev => prev + 100); // Simple scoring
         ack.unshift(new Array(newStage[0].length).fill([0, 'clear']));
         return ack;
       }
       ack.push(row);
       return ack;
     }, []);
  };
  
  // Ref-based state access for independent polling loop
  const gameStateRef = useRef({ stage, player, level, score });
  useEffect(() => {
      gameStateRef.current = { stage, player, level, score };
  }, [stage, player, level, score]);

  // Robust AI Coach Polling Loop
  useEffect(() => {
      if (gameOver) return;
      
      const controller = new AbortController();
      const aiInterval = setInterval(async () => {
          if (loadingAdvice) return; // Skip if busy
          if (gameStateRef.current.player.collided) return;

          setLoadingAdvice(true);
          const current = gameStateRef.current;
          const stateSummary = {
              board: current.stage.map(row => row.map(cell => cell[0])),
              currentPiece: current.player.tetromino,
              currentPos: current.player.pos,
              level: current.level,
              score: current.score
          };
          
          replayLog.current.push({ state: stateSummary, timestamp: Date.now() });

          try {
              const newAdvice = await fetchCoachAdvice(
                  stateSummary, 
                  { level: 'intermediate' }, 
                  address, 
                  { signal: controller.signal, timeoutMs: 4000, retries: 2 }
              );
              setAdvice(newAdvice);
          } catch {
              // ignore errors to keep game smooth
          } finally {
              setLoadingAdvice(false);
          }
      }, 4000); // Poll every 4s independent of drop speed

      return () => {
          clearInterval(aiInterval);
          controller.abort();
      };
  }, [gameOver, address]);

  return (
    <div className="flex gap-8 w-full max-w-4xl mx-auto outline-none" role="button" tabIndex={0} onKeyDown={(e) => move(e)} onKeyUp={keyUp}>
      
      {/* Game Board */}
      <div className="border-4 border-gray-800 bg-gray-900 p-1 relative">
         {stage.map((row: any, y: any) => 
           <div key={y} className="flex">
             {row.map((cell: any, x: any) => (
               <div key={x} style={{
                   width: '30px',
                   height: '30px',
                   background: cell[0] === 0 ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.1)', // Simplified color
                   border: cell[0] === 0 ? '1px solid #333' : '1px solid #fff'
               }} />
             ))}
           </div>
         )}
         
         {gameOver && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-2xl font-bold">
                 GAME OVER
                 <button onClick={startGame} className="mt-4 text-sm bg-blue-600 px-4 py-2 rounded hover:bg-blue-500">Restart</button>
             </div>
         )}
      </div>

      {/* Sidebar */}
      <div className="w-80 flex flex-col gap-4">
        <div className="bg-gray-800 text-white p-4 rounded-lg">
            <div>Score: {score}</div>
            <div>Rows: {rows}</div>
            <div>Level: {level}</div>
            {address && <div className="text-xs mt-2 text-gray-400 truncate">Wallet: {address}</div>}
        </div>
        
        <div className="flex-grow">
            <CoachPanel advice={advice} isLoading={loadingAdvice} />
        </div>

        <button className="bg-green-600 text-white font-bold py-3 rounded-lg shadow-lg hover:bg-green-500" onClick={startGame}>
            Start Game
        </button>
      </div>

    </div>
  );
};

export default Tetris;
