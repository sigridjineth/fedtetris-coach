import Tetris from '../components/TetrisBoard';
import { WalletComponents } from '../components/WalletComponents';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">FedTetris Coach Studio</h1>
          <p className="text-gray-600">
            Federated Learning + KV Cache powered Tetris Coach.
          </p>
        </div>
        <WalletComponents />
      </div>
      
      <Tetris />
    </main>
  );
}