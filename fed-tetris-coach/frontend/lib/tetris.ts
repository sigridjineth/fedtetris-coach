export const ROWS = 20;
export const COLS = 10;

export type Board = number[][];

export const TETROMINOS = {
  0: { shape: [[0]], color: '0,0,0' }, // Empty
  1: { shape: [[1, 1, 1, 1]], color: '80, 227, 230' }, // I
  2: { shape: [[1, 1], [1, 1]], color: '223, 217, 36' }, // O
  3: { shape: [[0, 1, 0], [1, 1, 1]], color: '132, 61, 198' }, // T
  4: { shape: [[1, 0, 0], [1, 1, 1]], color: '56, 108, 228' }, // J
  5: { shape: [[0, 0, 1], [1, 1, 1]], color: '227, 115, 36' }, // L
  6: { shape: [[0, 1, 1], [1, 1, 0]], color: '56, 227, 82' }, // S
  7: { shape: [[1, 1, 0], [0, 1, 1]], color: '227, 56, 56' }, // Z
};

export const randomTetromino = () => {
  const tetrominos = 'IJLOSTZ';
  const randTetromino = tetrominos[Math.floor(Math.random() * tetrominos.length)];
  switch (randTetromino) {
    case 'I': return TETROMINOS[1];
    case 'J': return TETROMINOS[4];
    case 'L': return TETROMINOS[5];
    case 'O': return TETROMINOS[2];
    case 'S': return TETROMINOS[6];
    case 'T': return TETROMINOS[3];
    case 'Z': return TETROMINOS[7];
    default: return TETROMINOS[1]; // Should not happen
  }
}

export const createStage = (): Board =>
  Array.from(Array(ROWS), () =>
    new Array(COLS).fill([0, 'clear'])
  );

export const checkCollision = (player: any, stage: any, { x: moveX, y: moveY }: { x: number, y: number }) => {
  for (let y = 0; y < player.tetromino.shape.length; y += 1) {
    for (let x = 0; x < player.tetromino.shape[y].length; x += 1) {
      // 1. Check that we're on an actual Tetromino cell
      if (player.tetromino.shape[y][x] !== 0) {
        if (
          // 2. Check that our move is inside the game areas height (y)
          // We shouldn't go through the bottom of the play area
          !stage[y + player.pos.y + moveY] ||
          // 3. Check that our move is inside the game areas width (x)
          !stage[y + player.pos.y + moveY][x + player.pos.x + moveX] ||
          // 4. Check that the cell we're moving to isn't set to clear
          stage[y + player.pos.y + moveY][x + player.pos.x + moveX][1] !== 'clear'
        ) {
          return true;
        }
      }
    }
  }
  return false;
};
