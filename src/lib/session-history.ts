export type StoredSessionHistoryItem = {
  id: number;
  createdAt: string;
  amountRequested?: number;
};

const HISTORY_KEY = "zenvana_payments_session_history";
const MAX_ITEMS = 80;

function readHistoryRaw(): StoredSessionHistoryItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredSessionHistoryItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry) => Number.isFinite(entry.id));
  } catch {
    return [];
  }
}

export function getSessionHistory(): StoredSessionHistoryItem[] {
  return readHistoryRaw().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function addSessionHistory(item: StoredSessionHistoryItem): void {
  if (typeof window === "undefined") return;
  const current = readHistoryRaw();
  const merged = [
    item,
    ...current.filter((entry) => entry.id !== item.id),
  ].slice(0, MAX_ITEMS);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(merged));
}
