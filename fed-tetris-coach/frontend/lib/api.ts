const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export interface CoachAdvice {
  recommendedAction: string;
  explanation: string;
  source?: string;
}

export const fetchCoachAdvice = async (
  state: any, 
  playerProfile: any, 
  walletAddress?: string,
  opts: { timeoutMs?: number; retries?: number; signal?: AbortSignal } = {}
): Promise<CoachAdvice> => {
  const { timeoutMs = 4000, retries = 1, signal } = opts;
  let attempt = 0;

  while (attempt <= retries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    // If parent signal aborts, abort our fetch too
    const onAbort = () => controller.abort();
    if (signal) {
        if (signal.aborted) {
            clearTimeout(timeoutId);
            // Don't even try
            return { recommendedAction: 'Unknown', explanation: 'Request aborted' };
        }
        signal.addEventListener('abort', onAbort);
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/coach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state, playerProfile, walletAddress }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', onAbort);

      if (!response.ok) {
        throw new Error('Failed to fetch advice');
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', onAbort);

      const isAbort = error.name === 'AbortError';
      if (isAbort) {
          // If it was OUR timeout, treat as retryable (unless max retries)
          // If it was PARENT signal, stop
          if (signal?.aborted) throw error;
      }

      if (attempt === retries) {
        console.error('Error fetching coach advice (Max retries):', error);
        return {
          recommendedAction: 'Unknown',
          explanation: 'Coach is offline or slow.',
        };
      }
      
      // Exponential backoff
      await new Promise(r => setTimeout(r, 300 * (2 ** attempt)));
      attempt++;
    }
  }
  
  return {
      recommendedAction: 'Unknown',
      explanation: 'Coach is offline.'
  };
};

export const uploadReplay = async (
  replayData: any,
  walletAddress?: string
) => {
  try {
    // Fire and forget, but with timeout so it doesn't hang browser resources
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000);
    
    await fetch(`${BACKEND_URL}/api/replay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...replayData, walletAddress }),
      signal: controller.signal
    });
    clearTimeout(id);
  } catch (error) {
    console.error('Failed to upload replay:', error);
  }
};
