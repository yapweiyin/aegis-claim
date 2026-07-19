import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Aegis Claims – Legal & Privacy Policy" },
      {
        name: "description",
        content:
          "Legal terms, privacy policy, and AI disclaimer for the Aegis Claims triage platform.",
      },
      { property: "og:title", content: "Aegis Claims – Legal & Privacy Policy" },
      {
        property: "og:description",
        content:
          "Legal terms, privacy policy, and AI disclaimer for the Aegis Claims triage platform.",
      },
    ],
  }),
  component: LegalPage,
});

function LegalPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Aegis Claims</h1>
              <p className="text-xs text-slate-500">Legal & Privacy Policy</p>
            </div>
          </div>
          <Link
            to="/claims"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Claims
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Legal & Privacy Policy
          </h2>
          <p className="mt-2 text-sm text-slate-500">Last updated: 2026</p>
        </div>

        <div className="space-y-8">
          <Section title="A. AI Disclaimer">
            <p className="rounded-md border-l-4 border-blue-600 bg-blue-50 p-4 text-sm text-slate-800">
              This platform provides an instant, AI-generated assessment only. Final claim
              decisions are made by licensed insurance professionals after full review.
            </p>
            <p>
              Aegis Claims is an AI-powered triage tool. It is not a final claims decision and
              should not be treated as one. All AI-generated outputs — including decisions,
              confidence scores, payout estimates, reasoning, and fraud flags — are preliminary
              and subject to human review by a qualified claims professional.
            </p>
            <p>
              To the fullest extent permitted by law, Aegis Claims disclaims all liability for
              errors, omissions, inaccuracies, or adverse outcomes arising from use of the
              platform, including any reliance placed on AI-generated results.
            </p>
          </Section>

          <Section title="B. Terms of Use">
            <p>By using Aegis Claims, you agree that:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                You accept full responsibility for the accuracy and completeness of any
                information you submit, including form inputs and uploaded files.
              </li>
              <li>
                You grant Aegis Claims permission to process your uploaded files (images, audio,
                and related evidence) solely for the purpose of assessing your claim.
              </li>
              <li>
                You agree not to upload fraudulent, misleading, defamatory, or illegal content,
                or content that infringes any third-party rights.
              </li>
              <li>
                Aegis Claims reserves the right to refuse service, remove content, or terminate
                access at its sole discretion, with or without notice.
              </li>
            </ul>
            <p>
              <strong>Governing law.</strong> These terms are governed by the laws of [Your
              Jurisdiction], without regard to conflict-of-law principles. Any dispute arising
              out of or relating to these terms will be resolved in the courts of that
              jurisdiction.
            </p>
          </Section>

          <Section title="C. Privacy Policy">
            <p className="rounded-md border-l-4 border-blue-600 bg-blue-50 p-4 text-sm text-slate-800">
              Your privacy matters to us. We only collect information necessary to process your
              claim.
            </p>
            <p>
              <strong>What we collect.</strong> Information you enter into claim forms (vehicle
              or property details, incident location, valuations), files you upload (images and
              audio memos), and your locally stored claim history.
            </p>
            <p>
              <strong>How we use it.</strong> Submitted information is used solely to generate
              your AI claim assessment and to improve the underlying AI system. We do not sell
              your data to third parties.
            </p>
            <p>
              <strong>Where it lives.</strong> Your claim history is stored locally in your
              browser using <code>localStorage</code> on your own device. AI processing is
              handled server-side through the Lovable AI Gateway over a secure connection.
            </p>
            <p>
              <strong>Retention.</strong> You can remove your locally stored claim history at
              any time using the "Clear History" button on the claims page, or by clearing your
              browser storage.
            </p>
          </Section>

          <Section title="D. No Legal or Financial Advice">
            <p>
              Aegis Claims does not provide legal, financial, insurance coverage, or
              professional advice of any kind. Information presented by the platform is for
              informational purposes only.
            </p>
            <p>
              You should consult with a licensed attorney, financial advisor, or qualified
              insurance professional before making any legal or financial decisions based on
              information from this platform.
            </p>
          </Section>
        </div>

        <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
          © 2026 Aegis Claims. All rights reserved. |{" "}
          <Link to="/claims" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
            Back to Claims
          </Link>
        </footer>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h3 className="mb-4 text-xl font-semibold text-slate-900">{title}</h3>
      <div className="space-y-4 text-sm leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}
