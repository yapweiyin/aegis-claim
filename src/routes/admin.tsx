import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Shield,
  Search,
  Eye,
  Save,
  LogOut,
  ArrowLeft,
  ClipboardList,
  History,
  FileText,
  Image as ImageIcon,
  Send,
  CheckCircle2,
  Inbox,
} from "lucide-react";
import {
  readClaims,
  writeClaims,
  updateClaim as updateClaimStore,
  uid,
  pushStatusHistory,
  type StoredClaim,
  type DocRecord,
  type DocRequest,
} from "@/lib/claim-docs";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Aegis Claims – Admin Dashboard" },
      {
        name: "description",
        content: "Administrative dashboard for managing Aegis Claims submissions, statuses, and adjuster notes.",
      },
      { property: "og:title", content: "Aegis Claims – Admin Dashboard" },
      {
        property: "og:description",
        content: "Manage claims, update statuses, and log adjuster notes.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const HISTORY_KEY = "aegis.claims.history.v1";
const AUTH_KEY = "aegis.admin.auth.v1";
const ADMIN_PASSWORD = "admin123";

const STATUSES = [
  "New",
  "Under Review",
  "Request Info",
  "Approved",
  "Denied",
  "Paid",
  "Closed",
] as const;
type Status = (typeof STATUSES)[number];

const STATUS_META: Record<Status, { emoji: string; cls: string }> = {
  New: { emoji: "🟡", cls: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  "Under Review": { emoji: "🔵", cls: "bg-blue-100 text-blue-800 border-blue-200" },
  "Request Info": { emoji: "🟠", cls: "bg-orange-100 text-orange-800 border-orange-200" },
  Approved: { emoji: "🟢", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  Denied: { emoji: "🔴", cls: "bg-red-100 text-red-800 border-red-200" },
  Paid: { emoji: "🟣", cls: "bg-purple-100 text-purple-800 border-purple-200" },
  Closed: { emoji: "⚫", cls: "bg-slate-200 text-slate-800 border-slate-300" },
};

interface StatusLog {
  status: Status;
  at: string;
  note?: string;
}

type ClaimEntry = StoredClaim;

function defaultStatusFromDecision(d: ClaimEntry["result"]["decision"]): Status {
  if (d === "APPROVE") return "Approved";
  if (d === "DENY") return "Denied";
  return "Under Review";
}

function readHistory(): ClaimEntry[] {
  return readClaims();
}

function writeHistory(items: ClaimEntry[]) {
  writeClaims(items);
}

function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(AUTH_KEY) === "1") setAuthed(true);
  }, []);

  function login(e: React.FormEvent) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, "1");
      setAuthed(true);
      setPwError(null);
    } else {
      setPwError("Incorrect password.");
    }
  }

  function logout() {
    sessionStorage.removeItem(AUTH_KEY);
    setAuthed(false);
    setPw("");
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <form
          onSubmit={login}
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#2563eb]" />
            <h1 className="text-lg font-semibold text-slate-900">Admin Access</h1>
          </div>
          <p className="mb-4 text-sm text-slate-600">
            Enter the admin password to access the Aegis Claims dashboard.
          </p>
          <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoFocus
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
          />
          {pwError && <p className="mt-2 text-sm text-red-600">{pwError}</p>}
          <button
            type="submit"
            className="mt-4 w-full rounded-md bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            Sign In
          </button>
          <Link
            to="/claims"
            className="mt-3 flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Claims
          </Link>
        </form>
      </div>
    );
  }

  return <AdminDashboard onLogout={logout} />;
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [claims, setClaims] = useState<ClaimEntry[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setClaims(readHistory());
  }, []);

  const filtered = useMemo(() => {
    return claims.filter((c) => {
      const s = c.status ?? defaultStatusFromDecision(c.result.decision);
      if (statusFilter !== "all" && s !== statusFilter) return false;
      if (search && !c.id.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [claims, statusFilter, search]);

  const selected = useMemo(
    () => claims.find((c) => c.id === selectedId) ?? null,
    [claims, selectedId],
  );

  function updateClaim(updated: ClaimEntry) {
    const next = claims.map((c) => (c.id === updated.id ? updated : c));
    setClaims(next);
    writeHistory(next);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-10 lg:px-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:mb-8">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              <Shield className="h-7 w-7 text-[#2563eb]" />
              Aegis Claims – Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage submitted claims, update statuses, and record adjuster notes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/claims"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" /> Claims
            </Link>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <ClipboardList className="h-5 w-5 text-[#2563eb]" />
              All Claims
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {filtered.length}
              </span>
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Claim ID"
                  className="w-56 rounded-md border border-slate-300 py-2 pl-8 pr-3 text-sm shadow-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | Status)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              >
                <option value="all">All statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].emoji} {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              {claims.length === 0
                ? "No claims submitted yet."
                : "No claims match your filters."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-4 font-medium">Claim ID</th>
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 pr-4 font-medium">Type</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Payout</th>
                    <th className="py-2 pr-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const s = asStatus(c.status, defaultStatusFromDecision(c.result.decision));
                    const meta = STATUS_META[s];
                    return (
                      <tr key={c.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 pr-4 font-mono text-xs text-slate-700">{c.id}</td>
                        <td className="py-3 pr-4 text-slate-700">
                          {new Date(c.date).toLocaleString()}
                        </td>
                        <td className="py-3 pr-4 capitalize text-slate-700">{c.claimType}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${meta.cls}`}
                          >
                            <span>{meta.emoji}</span>
                            {s}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-medium text-slate-900">
                          ${Math.round(c.result.payout).toLocaleString()}
                        </td>
                        <td className="py-3 pr-4">
                          <button
                            type="button"
                            onClick={() => setSelectedId(c.id)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {selected && (
          <ClaimDetail
            key={selected.id}
            claim={selected}
            onClose={() => setSelectedId(null)}
            onSave={updateClaim}
          />
        )}

        <p className="mt-10 text-center text-xs text-slate-500">
          Aegis Claims Admin · Prototype · Password-gated demo view.
        </p>
      </div>
    </div>
  );
}

const NEXT_STATUSES: Record<Status, Status[]> = {
  New: ["Under Review", "Request Info"],
  "Under Review": ["Request Info", "Approved", "Denied"],
  "Request Info": ["Under Review", "Denied"],
  Approved: ["Paid", "Closed"],
  Denied: ["Closed"],
  Paid: ["Closed"],
  Closed: [],
};

function asStatus(s: string | undefined, fallback: Status): Status {
  return (STATUSES as readonly string[]).includes(s ?? "") ? (s as Status) : fallback;
}

function ClaimDetail({
  claim,
  onClose,
  onSave,
}: {
  claim: ClaimEntry;
  onClose: () => void;
  onSave: (c: ClaimEntry) => void;
}) {
  const currentStatus: Status = asStatus(claim.status, defaultStatusFromDecision(claim.result.decision));
  const [status, setStatus] = useState<Status>(currentStatus);
  const [notes, setNotes] = useState(claim.notes ?? "");
  const [saved, setSaved] = useState(false);
  const [requestMsg, setRequestMsg] = useState("");
  const [previewDoc, setPreviewDoc] = useState<DocRecord | null>(null);
  const [reviewNotesById, setReviewNotesById] = useState<Record<string, string>>({});

  const allowedNext = NEXT_STATUSES[currentStatus];
  const statusOptions = Array.from(new Set([currentStatus, ...allowedNext]));

  function saveClaim(next: ClaimEntry) {
    onSave(next);
  }

  function requestDocuments() {
    const msg = requestMsg.trim();
    if (!msg) return;
    const req: DocRequest = {
      id: uid("req"),
      message: msg,
      requestedBy: "admin",
      requestedDate: new Date().toISOString(),
    };
    const next = pushStatusHistory(
      {
        ...claim,
        documentRequests: [...(claim.documentRequests ?? []), req],
      },
      "Request Info",
      `Requested: ${msg}`,
    );
    saveClaim(next);
    setRequestMsg("");
    setStatus(asStatus(next.status, currentStatus));
  }

  function markDocReceived(docId: string) {
    const docs = (claim.documents ?? []).map((d) =>
      d.id === docId ? { ...d, status: "Received" as const } : d,
    );
    const next = pushStatusHistory({ ...claim, documents: docs }, "Under Review", "Document received.");
    saveClaim(next);
    setStatus(asStatus(next.status, currentStatus));
  }

  function markDocReviewed(docId: string) {
    const note = reviewNotesById[docId] ?? "";
    const docs = (claim.documents ?? []).map((d) =>
      d.id === docId
        ? {
            ...d,
            status: "Reviewed" as const,
            reviewedBy: "admin",
            reviewDate: new Date().toISOString(),
            reviewNotes: note || null,
          }
        : d,
    );
    saveClaim({ ...claim, documents: docs });
  }

  function handleSave() {
    const history = claim.statusHistory ?? [
      {
        status: currentStatus,
        at: claim.date,
        note: "Initial status from AI decision.",
      },
    ];
    const changed = status !== currentStatus;
    const nextHistory = changed
      ? [...history, { status, at: new Date().toISOString(), note: notes || undefined }]
      : history;

    onSave({
      ...claim,
      status,
      notes,
      statusHistory: nextHistory,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  const meta = STATUS_META[currentStatus];
  const form = claim.formData ?? {};

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Claim #{claim.id} – Details
          </h2>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${meta.cls}`}
            >
              {meta.emoji} {currentStatus}
            </span>
            <span>· {new Date(claim.date).toLocaleString()}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Close
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card title="Submitted Data">
            {Object.keys(form).length === 0 ? (
              <p className="text-sm text-slate-500">No form data captured for this claim.</p>
            ) : (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {Object.entries(form).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="capitalize text-slate-500">{k}</dt>
                    <dd className="text-slate-900">{v || "—"}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>

          <Card title="Uploaded Files">
            {claim.fileNames && claim.fileNames.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                {claim.fileNames.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No files recorded.</p>
            )}
          </Card>

          <Card title="AI Decision">
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-500">Decision:</span>{" "}
                <span className="font-semibold">{claim.result.decision}</span>
              </div>
              <div>
                <span className="text-slate-500">Confidence:</span>{" "}
                {Math.round(claim.result.confidence)}%
              </div>
              <div>
                <span className="text-slate-500">Repair cost:</span>{" "}
                ${Math.round(claim.result.repairCost).toLocaleString()}
              </div>
              <div>
                <span className="text-slate-500">Payout:</span>{" "}
                ${Math.round(claim.result.payout).toLocaleString()}
              </div>
              <div>
                <p className="mt-2 font-medium text-slate-700">Reasoning</p>
                <p className="text-slate-700">{claim.result.reasoning}</p>
              </div>
              {claim.result.fraudFlags.length > 0 && (
                <div>
                  <p className="mt-2 font-medium text-slate-700">Flags</p>
                  <ul className="list-disc pl-5 text-slate-700">
                    {claim.result.fraudFlags.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="mt-2 font-medium text-slate-700">Next steps</p>
                <p className="text-slate-700">{claim.result.nextSteps}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Update Status">
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].emoji} {s}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Allowed next: {allowedNext.length ? allowedNext.join(", ") : "— (terminal)"}
            </p>

            <label className="mt-4 mb-1 block text-sm font-medium text-slate-700">
              Adjuster Note
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add a note for the record…"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
            />

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
              >
                <Save className="h-4 w-4" /> Save Changes
              </button>
              {saved && <span className="text-sm text-emerald-600">Saved.</span>}
            </div>
          </Card>

          <Card title={<span className="inline-flex items-center gap-2"><History className="h-4 w-4" /> Status History</span>}>
            {(() => {
              const logs = claim.statusHistory ?? [
                {
                  status: currentStatus,
                  at: claim.date,
                  note: "Initial status from AI decision.",
                },
              ];
              return (
                <ol className="space-y-2 text-sm">
                  {logs.map((l, i) => {
                    const m = STATUS_META[asStatus(l.status, currentStatus)];
                    return (
                      <li
                        key={i}
                        className="flex items-start justify-between gap-3 rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${m.cls}`}
                            >
                              {m.emoji} {l.status}
                            </span>
                            <span className="text-xs text-slate-500">
                              {new Date(l.at).toLocaleString()}
                            </span>
                          </div>
                          {l.note && (
                            <p className="mt-1 text-xs text-slate-600">{l.note}</p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              );
            })()}
          </Card>
        </div>
      </div>
    </section>
  );
}

function Card({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}
