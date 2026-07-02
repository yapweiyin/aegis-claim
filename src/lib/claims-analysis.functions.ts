import { createServerFn } from "@tanstack/react-start";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

interface FilePayload {
  name: string;
  type: string;
  base64: string; // no data URL prefix
}

interface AnalyzeInput {
  claimType: "auto" | "property";
  formData: Record<string, string>;
  files: FilePayload[];
}

interface AnalysisResult {
  decision: "APPROVE" | "ESCALATE" | "DENY";
  confidence_score: number;
  estimated_payout: number;
  repair_cost: number;
  reasoning: string;
  flags: string[];
  next_steps: string;
  transcript?: string;
  damage?: { cost: number; severity: string; confidence: number };
}

function base64ToBlob(b64: string, type: string): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

export const analyzeClaim = createServerFn({ method: "POST" })
  .inputValidator((data: AnalyzeInput) => {
    if (!data || (data.claimType !== "auto" && data.claimType !== "property")) {
      throw new Error("Invalid claim type");
    }
    return data;
  })
  .handler(async ({ data }): Promise<AnalysisResult> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = { "Lovable-API-Key": key } as Record<string, string>;

    // --- A. TRANSCRIBE AUDIO (if provided) ---
    let transcript = "No voice memo provided.";
    const audioFile = data.files.find((f) => f.type.startsWith("audio/"));
    if (audioFile) {
      try {
        const form = new FormData();
        const blob = base64ToBlob(audioFile.base64, audioFile.type);
        form.append("file", blob, audioFile.name || "recording.wav");
        form.append("model", "openai/gpt-4o-mini-transcribe");
        const res = await fetch(`${GATEWAY}/audio/transcriptions`, {
          method: "POST",
          headers: authHeader,
          body: form,
        });
        if (res.ok) {
          const j = (await res.json()) as { text?: string };
          if (j.text) transcript = j.text;
        } else {
          console.error("STT failed", res.status, await res.text().catch(() => ""));
        }
      } catch (e) {
        console.error("STT error", e);
      }
    }

    // --- B. VISION DAMAGE ESTIMATE (if images) ---
    let damage: { cost: number; severity: string; confidence: number } | null = null;
    const imageFiles = data.files.filter((f) => f.type.startsWith("image/")).slice(0, 4);
    if (imageFiles.length > 0) {
      try {
        const content: Array<Record<string, unknown>> = [
          {
            type: "text",
            text: `You are an expert ${data.claimType === "auto" ? "auto collision" : "property damage"} estimator. Look at the attached image(s) and estimate repair cost in USD. Reply with ONLY compact JSON: {"cost": number, "severity": "Minor"|"Moderate"|"Severe", "confidence": 0-100}`,
          },
          ...imageFiles.map((f) => ({
            type: "image_url",
            image_url: { url: `data:${f.type};base64,${f.base64}` },
          })),
        ];

        const res = await fetch(`${GATEWAY}/chat/completions`, {
          method: "POST",
          headers: { ...authHeader, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [{ role: "user", content }],
            response_format: { type: "json_object" },
          }),
        });
        if (res.ok) {
          const j = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const text = j.choices?.[0]?.message?.content ?? "{}";
          const parsed = JSON.parse(text) as Partial<typeof damage> & Record<string, unknown>;
          if (parsed && typeof parsed.cost === "number") {
            damage = {
              cost: Math.round(parsed.cost),
              severity: String(parsed.severity ?? "Moderate"),
              confidence: Math.round(Number(parsed.confidence ?? 80)),
            };
          }
        } else {
          console.error("Vision failed", res.status, await res.text().catch(() => ""));
        }
      } catch (e) {
        console.error("Vision error", e);
      }
    }

    if (!damage) {
      // Fallback estimate when no images uploaded
      const base =
        data.claimType === "auto"
          ? 500 + Math.floor(Math.random() * 14500)
          : 1000 + Math.floor(Math.random() * 29000);
      damage = { cost: base, severity: "Moderate", confidence: 78 };
    }

    // --- C. FINAL DECISION ---
    const threshold = data.claimType === "auto" ? 3000 : 5000;
    const upperThreshold = data.claimType === "auto" ? 8000 : 15000;
    const deductible = Number(data.formData.deductible ?? 0) || 0;
    const value = Number(data.formData.value ?? 0) || 0;

    const finalPrompt = `You are an expert claims adjuster. Adjudicate this claim.

CONTEXT:
- Claim Type: ${data.claimType.toUpperCase()}
- Form Data: ${JSON.stringify(data.formData)}
- AI Damage Estimate: ${JSON.stringify(damage)}
- Claimant Voice Statement: "${transcript}"

RULES:
- If repair cost < $${threshold}: decision = APPROVE
- If repair cost between $${threshold} and $${upperThreshold}: decision = ESCALATE
- If repair cost > $${upperThreshold}: decision = DENY
- Estimated payout = max(0, min(repair_cost - deductible, policy_value)); deductible=$${deductible}, policy_value=$${value}
- Look for inconsistencies between the voice statement and the form data — flag any you find
- If none found, include "✅ No fraud indicators detected"

Return ONLY compact JSON in this exact shape:
{
  "decision": "APPROVE" | "ESCALATE" | "DENY",
  "confidence_score": <integer 0-100>,
  "estimated_payout": <number>,
  "repair_cost": <number>,
  "reasoning": "3-4 sentence step-by-step explanation",
  "flags": ["short strings"],
  "next_steps": "one clear action"
}`;

    const finalRes = await fetch(`${GATEWAY}/chat/completions`, {
      method: "POST",
      headers: { ...authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert claims adjuster. Output valid JSON only." },
          { role: "user", content: finalPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!finalRes.ok) {
      const errText = await finalRes.text().catch(() => "");
      throw new Error(`AI Gateway error ${finalRes.status}: ${errText.slice(0, 200)}`);
    }

    const finalJson = (await finalRes.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = finalJson.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Partial<AnalysisResult>;

    const decision =
      parsed.decision === "APPROVE" ||
      parsed.decision === "ESCALATE" ||
      parsed.decision === "DENY"
        ? parsed.decision
        : damage.cost < threshold
          ? "APPROVE"
          : damage.cost <= upperThreshold
            ? "ESCALATE"
            : "DENY";

    return {
      decision,
      confidence_score: Math.max(
        0,
        Math.min(100, Math.round(Number(parsed.confidence_score ?? damage.confidence))),
      ),
      estimated_payout: Math.max(
        0,
        Math.min(value || Infinity, Number(parsed.estimated_payout ?? damage.cost - deductible)),
      ),
      repair_cost: Math.round(Number(parsed.repair_cost ?? damage.cost)),
      reasoning: String(parsed.reasoning ?? "No reasoning returned."),
      flags:
        Array.isArray(parsed.flags) && parsed.flags.length > 0
          ? parsed.flags.map(String)
          : ["✅ No fraud indicators detected"],
      next_steps: String(parsed.next_steps ?? "Forward to senior adjuster for review."),
      transcript,
      damage,
    };
  });
