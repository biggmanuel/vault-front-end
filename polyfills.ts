import { Buffer } from 'buffer';

// Ensure global objects are available for Solana libraries
if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).Buffer = Buffer;
  (window as any).process = {
    env: { NODE_ENV: 'development' },
    version: 'v16.0.0', // Fake Node.js version for compatibility
    browser: true,
    nextTick: (cb: any) => setTimeout(cb, 0),
    argv: [],
    cwd: () => '/'
  };
}

export {};