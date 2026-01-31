// In-memory store for clipboard data (in production, use a backend/database)

export interface ClipboardEntry {
  code: string;
  text: string;
  expiresAt: number;
  timer: number; // in seconds
}

const clipboardStore = new Map<string, ClipboardEntry>();

// Generate a random 6-character code
export const generateCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars like 0,O,1,I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Store text with a timer
export const storeClipboard = (text: string, timerSeconds: number): ClipboardEntry => {
  const code = generateCode();
  const expiresAt = Date.now() + timerSeconds * 1000;
  
  const entry: ClipboardEntry = {
    code,
    text,
    expiresAt,
    timer: timerSeconds,
  };
  
  clipboardStore.set(code, entry);
  
  // Auto-delete after expiry
  setTimeout(() => {
    clipboardStore.delete(code);
  }, timerSeconds * 1000);
  
  return entry;
};

// Retrieve clipboard by code
export const getClipboard = (code: string): ClipboardEntry | null => {
  const entry = clipboardStore.get(code.toUpperCase());
  
  if (!entry) {
    return null;
  }
  
  // Check if expired
  if (Date.now() > entry.expiresAt) {
    clipboardStore.delete(code);
    return null;
  }
  
  return entry;
};

// Delete clipboard entry
export const deleteClipboard = (code: string): void => {
  clipboardStore.delete(code.toUpperCase());
};

// Get remaining time in seconds
export const getRemainingTime = (code: string): number => {
  const entry = clipboardStore.get(code.toUpperCase());
  if (!entry) return 0;
  
  const remaining = Math.max(0, Math.floor((entry.expiresAt - Date.now()) / 1000));
  return remaining;
};
