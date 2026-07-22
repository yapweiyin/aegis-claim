// Shared claim-storage helpers for document management.
// Documents live on the claim record in localStorage.

export const CLAIMS_HISTORY_KEY = "aegis.claims.history.v1";

export const DOC_MAX_BYTES = 5 * 1024 * 1024; // 5MB base64 storage cap
export const DOC_ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export type DocStatus = "Pending" | "Received" | "Reviewed";

export interface DocRequest {
  id: string;
  message: string;
  requestedBy: string;
  requestedDate: string;
}

export interface DocRecord {
  id: string;
  claimId: string;
  requestId?: string;
  fileName: string;
  fileType: string; // "image" | "pdf"
  contentType: string; // MIME
  fileSize: number;
  contentBase64: string; // data URL
  uploadDate: string;
  status: DocStatus;
  reviewedBy?: string | null;
  reviewDate?: string | null;
  reviewNotes?: string | null;
}

export interface StoredClaim {
  id: string;
  date: string;
  claimType: "auto" | "property";
  result: {
    decision: "APPROVE" | "ESCALATE" | "DENY";
    confidence: number;
    repairCost: number;
    payout: number;
    reasoning: string;
    fraudFlags: string[];
    nextSteps: string;
  };
  formData?: Record<string, string>;
  fileNames?: string[];
  status?: string;
  notes?: string;
  statusHistory?: { status: string; at: string; note?: string }[];
  documentRequests?: DocRequest[];
  documents?: DocRecord[];
}

export function readClaims(): StoredClaim[] {
  try {
    const raw = localStorage.getItem(CLAIMS_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeClaims(items: StoredClaim[]) {
  localStorage.setItem(CLAIMS_HISTORY_KEY, JSON.stringify(items));
}

export function updateClaim(id: string, updater: (c: StoredClaim) => StoredClaim): StoredClaim[] {
  const items = readClaims().map((c) => (c.id === id ? updater(c) : c));
  writeClaims(items);
  return items;
}

export function uid(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function pushStatusHistory(
  c: StoredClaim,
  status: string,
  note?: string,
): StoredClaim {
  const history = c.statusHistory ?? [];
  if (c.status === status) return { ...c, status };
  return {
    ...c,
    status,
    statusHistory: [...history, { status, at: new Date().toISOString(), note }],
  };
}
