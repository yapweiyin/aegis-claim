import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  Car,
  Home,
  Upload,
  FileText,
  Music,
  X,
  Rocket,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
} from "lucide-react";
import { analyzeClaim } from "@/lib/claims-analysis.functions";

export const Route = createFileRoute("/claims")({
  head: () => ({
    meta: [
      { title: "Aegis Claims – Instant Triage" },
      {
        name: "description",
        content:
          "AI-powered auto and property claims assessment. Upload evidence and get a decision in seconds.",
      },
      { property: "og:title", content: "Aegis Claims – Instant Triage" },
      {
        property: "og:description",
        content:
          "AI-powered auto and property claims assessment. Upload evidence and get a decision in seconds.",
      },
    ],
  }),
  component: ClaimsPage,
});

type ClaimType = "auto" | "property";
type Decision = "APPROVE" | "ESCALATE" | "DENY";

interface AutoForm {
  vin: string;
  make: string;
  model: string;
  year: string;
  mileage: string;
  location: string;
  value: string;
  deductible: string;
}

interface PropertyForm {
  address: string;
  yearBuilt: string;
  construction: string;
  sqft: string;
  damageType: string;
  value: string;
  deductible: string;
}

interface ClaimResult {
  decision: Decision;
  confidence: number;
  repairCost: number;
  payout: number;
  reasoning: string;
  fraudFlags: string[];
  nextSteps: string;
}

const initialAuto: AutoForm = {
  vin: "",
  make: "",
  model: "",
  year: "",
  mileage: "",
  location: "",
  value: "",
  deductible: "500",
};

const initialProperty: PropertyForm = {
  address: "",
  yearBuilt: "",
  construction: "Brick",
  sqft: "",
  damageType: "Water Leak",
  value: "",
  deductible: "1000",
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/wave", "audio/x-wav", "audio/mp4", "audio/x-m4a", "audio/m4a"];

function classifyFile(f: File): "image" | "audio" | null {
  const name = f.name.toLowerCase();
  if (ALLOWED_IMAGE_TYPES.includes(f.type) || /\.(jpe?g|png)$/i.test(name)) return "image";
  if (ALLOWED_AUDIO_TYPES.includes(f.type) || /\.(mp3|wav|m4a)$/i.test(name)) return "audio";
  return null;
}

function ClaimsPage() {
  const analyze = useServerFn(analyzeClaim);
  const [claimType, setClaimType] = useState<ClaimType>("auto");
  const [autoForm, setAutoForm] = useState<AutoForm>(initialAuto);
  const [propertyForm, setPropertyForm] = useState<PropertyForm>(initialProperty);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(
    () =>
      files.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        url: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
      })),
    [files],
  );

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list).filter((f) => {
      const ok =
        f.type.startsWith("image/") ||
        f.type === "application/pdf" ||
        f.type.startsWith("audio/") ||
        /\.(mp3|wav|pdf|jpe?g|png)$/i.test(f.name);
      return ok;
    });
    setFiles((prev) => [...prev, ...incoming].slice(0, 10));
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (i: number) =>
    setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const validate = (): string | null => {
    if (claimType === "auto") {
      if (!autoForm.location.trim()) return "Location of Accident is required.";
      if (!autoForm.value.trim()) return "Estimated Vehicle Value is required.";
      if (!autoForm.deductible.trim()) return "Deductible is required.";
    } else {
      if (!propertyForm.address.trim()) return "Property Address is required.";
      if (!propertyForm.value.trim()) return "Estimated Property Value is required.";
      if (!propertyForm.deductible.trim()) return "Deductible is required.";
    }
    return null;
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const s = reader.result as string;
        resolve(s.includes(",") ? s.split(",")[1] : s);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const runAnalysis = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    setStatusIdx(0);

    // Advance status messages while the real request runs
    const statusTimers: number[] = [];
    for (let i = 1; i < STATUS_MESSAGES.length; i++) {
      statusTimers.push(
        window.setTimeout(() => setStatusIdx(i), i * 800),
      );
    }

    try {
      const isAuto = claimType === "auto";
      const form = isAuto ? autoForm : propertyForm;

      // Only send images and audio to keep the payload small
      const supported = files.filter(
        (f) => f.type.startsWith("image/") || f.type.startsWith("audio/"),
      );
      const payloadFiles = await Promise.all(
        supported.map(async (f) => ({
          name: f.name,
          type: f.type,
          base64: await fileToBase64(f),
        })),
      );

      const res = await analyze({
        data: {
          claimType,
          formData: form as unknown as Record<string, string>,
          files: payloadFiles,
        },
      });

      setResult({
        decision: res.decision,
        confidence: res.confidence_score,
        repairCost: res.repair_cost,
        payout: res.estimated_payout,
        reasoning: res.reasoning,
        fraudFlags: res.flags,
        nextSteps: res.next_steps,
      });
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error
          ? `Analysis failed: ${e.message}`
          : "Analysis failed. Please try again.",
      );
    } finally {
      statusTimers.forEach((t) => window.clearTimeout(t));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Aegis Claims – Instant Triage
          </h1>
          <p className="mt-2 text-base text-slate-600">
            AI-powered auto and property claims assessment. Upload evidence and get a decision in seconds.
          </p>
        </header>

        {/* Toggle */}
        <div className="mb-8 inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {(["auto", "property"] as ClaimType[]).map((t) => {
            const active = claimType === t;
            const Icon = t === "auto" ? Car : Home;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setClaimType(t)}
                className={`flex items-center gap-2 rounded-md px-5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#2563eb] text-white shadow"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t === "auto" ? "Auto" : "Property"}
              </button>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left column: form (~40%) */}
          <section className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                {claimType === "auto" ? "Vehicle & Incident Details" : "Property & Damage Details"}
              </h2>

              {claimType === "auto" ? (
                <AutoFields form={autoForm} setForm={setAutoForm} />
              ) : (
                <PropertyFields form={propertyForm} setForm={setPropertyForm} />
              )}
            </div>
          </section>

          {/* Right column: upload + results */}
          <section className="space-y-6 lg:col-span-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <label className="mb-3 block text-sm font-semibold text-slate-900">
                Upload Evidence (Photos, Police Report, Voice Memo)
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  isDragging
                    ? "border-[#2563eb] bg-blue-50"
                    : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <Upload className="mb-2 h-8 w-8 text-slate-400" />
                <p className="text-sm font-medium text-slate-700">
                  Drag & drop files here, or click to browse
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  JPG, PNG, PDF, MP3, WAV · up to 10 files
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,application/pdf,audio/mpeg,audio/wav,audio/*"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>

              {previews.length > 0 && (
                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {previews.map((p, i) => (
                    <li
                      key={`${p.name}-${i}`}
                      className="relative flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-2 text-xs"
                    >
                      {p.url ? (
                        <img
                          src={p.url}
                          alt={p.name}
                          className="h-12 w-12 flex-shrink-0 rounded object-cover"
                        />
                      ) : p.type === "application/pdf" ? (
                        <FileText className="h-8 w-8 flex-shrink-0 text-rose-500" />
                      ) : (
                        <Music className="h-8 w-8 flex-shrink-0 text-indigo-500" />
                      )}
                      <span className="truncate">{p.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(i);
                        }}
                        className="absolute right-1 top-1 rounded-full bg-white p-0.5 text-slate-500 shadow hover:text-slate-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {error && (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={runAnalysis}
                disabled={loading}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-4 py-3 text-base font-semibold text-white shadow transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {STATUS_MESSAGES[statusIdx]}
                  </>
                ) : (
                  <>
                    <Rocket className="h-5 w-5" />
                    Run AI Claim Analysis
                  </>
                )}
              </button>
            </div>

            {/* Results */}
            {result && <ResultsPanel result={result} />}
          </section>
        </div>

        <p className="mt-10 text-center text-xs text-slate-500">
          Aegis Claims · Prototype · Decisions are AI-generated and require human sign-off for final
          approval.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100";

function AutoFields({
  form,
  setForm,
}: {
  form: AutoForm;
  setForm: (f: AutoForm) => void;
}) {
  const upd = (k: keyof AutoForm) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label="VIN">
          <input className={inputCls} placeholder="1HGCM82633A123456" value={form.vin} onChange={upd("vin")} />
        </Field>
      </div>
      <Field label="Make">
        <input className={inputCls} placeholder="Toyota" value={form.make} onChange={upd("make")} />
      </Field>
      <Field label="Model">
        <input className={inputCls} placeholder="Camry" value={form.model} onChange={upd("model")} />
      </Field>
      <Field label="Year">
        <input type="number" className={inputCls} placeholder="2020" value={form.year} onChange={upd("year")} />
      </Field>
      <Field label="Mileage">
        <input type="number" className={inputCls} placeholder="45000" value={form.mileage} onChange={upd("mileage")} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Location of Accident" required>
          <input
            className={inputCls}
            placeholder="Main St & 5th Ave, Austin, TX"
            value={form.location}
            onChange={upd("location")}
          />
        </Field>
      </div>
      <Field label="Estimated Vehicle Value" required>
        <input type="number" className={inputCls} placeholder="25000" value={form.value} onChange={upd("value")} />
      </Field>
      <Field label="Deductible Amount" required>
        <input type="number" className={inputCls} placeholder="500" value={form.deductible} onChange={upd("deductible")} />
      </Field>
    </div>
  );
}

function PropertyFields({
  form,
  setForm,
}: {
  form: PropertyForm;
  setForm: (f: PropertyForm) => void;
}) {
  const upd =
    (k: keyof PropertyForm) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm({ ...form, [k]: e.target.value });
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label="Property Address" required>
          <input
            className={inputCls}
            placeholder="123 Oak Lane, Austin, TX"
            value={form.address}
            onChange={upd("address")}
          />
        </Field>
      </div>
      <Field label="Year Built">
        <input type="number" className={inputCls} placeholder="1995" value={form.yearBuilt} onChange={upd("yearBuilt")} />
      </Field>
      <Field label="Construction Type">
        <select className={inputCls} value={form.construction} onChange={upd("construction")}>
          <option>Brick</option>
          <option>Wood</option>
          <option>Concrete</option>
          <option>Mixed</option>
        </select>
      </Field>
      <Field label="Square Footage">
        <input type="number" className={inputCls} placeholder="2000" value={form.sqft} onChange={upd("sqft")} />
      </Field>
      <Field label="Damage Type">
        <select className={inputCls} value={form.damageType} onChange={upd("damageType")}>
          <option>Water Leak</option>
          <option>Fire</option>
          <option>Wind/Hail</option>
          <option>Theft</option>
          <option>Other</option>
        </select>
      </Field>
      <Field label="Estimated Property Value" required>
        <input type="number" className={inputCls} placeholder="350000" value={form.value} onChange={upd("value")} />
      </Field>
      <Field label="Deductible Amount" required>
        <input type="number" className={inputCls} placeholder="1000" value={form.deductible} onChange={upd("deductible")} />
      </Field>
    </div>
  );
}

function ResultsPanel({ result }: { result: ClaimResult }) {
  const badge =
    result.decision === "APPROVE"
      ? {
          cls: "bg-green-100 text-green-800 border-green-200",
          icon: <CheckCircle2 className="h-5 w-5" />,
          label: "APPROVE",
        }
      : result.decision === "ESCALATE"
        ? {
            cls: "bg-yellow-100 text-yellow-800 border-yellow-200",
            icon: <AlertTriangle className="h-5 w-5" />,
            label: "ESCALATE TO HUMAN",
          }
        : {
            cls: "bg-red-100 text-red-800 border-red-200",
            icon: <XCircle className="h-5 w-5" />,
            label: "DENY",
          };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${badge.cls}`}
        >
          {badge.icon}
          {result.decision === "APPROVE" ? "✅ " : result.decision === "ESCALATE" ? "⚠️ " : "❌ "}
          {badge.label}
        </span>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-slate-500">Estimated Payout</div>
          <div className="text-2xl font-bold text-slate-900">
            ${result.payout.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600">
          <span>Confidence Score</span>
          <span>{result.confidence}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#2563eb] transition-all"
            style={{ width: `${result.confidence}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <InfoBox label="Repair Cost Estimate">${result.repairCost.toLocaleString()}</InfoBox>
        <InfoBox label="Estimated Payout">${result.payout.toLocaleString()}</InfoBox>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-900">Reasoning</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">{result.reasoning}</p>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-900">Fraud Flags</h3>
        <ul className="mt-1 space-y-1 text-sm text-slate-700">
          {result.fraudFlags.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      </div>

      <div className="mt-5 rounded-md border border-blue-100 bg-blue-50 p-4">
        <h3 className="text-sm font-semibold text-blue-900">Next Steps</h3>
        <p className="mt-1 text-sm text-blue-800">{result.nextSteps}</p>
      </div>
    </div>
  );
}

function InfoBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-900">{children}</div>
    </div>
  );
}
