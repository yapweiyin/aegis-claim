🚗🏠 Aegis Claims – Instant Triage
AI-powered auto and property claims assessment. Upload evidence and get a decision in seconds.

https://img.shields.io/badge/Built%2520with-Lovable-6C5CE7?style=flat-square
https://img.shields.io/badge/Powered%2520by-OpenAI-00A67E?style=flat-square
https://img.shields.io/badge/Powered%2520by-Gemini-4285F4?style=flat-square
https://img.shields.io/badge/License-Proprietary-red?style=flat-square

📖 Overview
Aegis Claims is a modern InsurTech application that leverages artificial intelligence to provide instant claims triage for auto and property insurance. Policyholders can upload photos and voice memos of damage, and receive AI-generated decisions with payout estimates, detailed reasoning, risk flags, and next steps – all within seconds.

🎯 The Problem We Solve
Traditional Claims Process	Aegis Claims
📞 Call center wait times	⚡ Instant submission
📧 Email back-and-forth	📸 Upload evidence once
⏳ Days to process	✅ Decision in seconds
🤷 No visibility	📊 Full transparency
📋 Manual paperwork	🤖 AI-powered automation
✨ Features

Core Functionality
Feature	Description
🔄 Dual Claim Types	Switch seamlessly between Auto and Property claims
📸 Multi-Modal Upload	Upload images and audio recordings as evidence
🤖 Real AI Pipeline	Powered by OpenAI Whisper (transcription) and Google Gemini (vision + adjudication)
⚡ Instant Decisions	Get AI-generated decisions with payout estimates in seconds

User Experience
Feature	Description
📊 Claims History Dashboard	View all past claims with detailed results
💾 Persistent Storage	Claims saved locally (localStorage) across sessions
📱 Responsive Design	Works on desktop, tablet, and mobile devices
🔄 Loading States	Sequential progress indicators during AI analysis
🧹 Clear All	Reset forms and uploads with one click
📋 View Past Claims	Review any previous claim's full details
🗑️ Clear History	Delete all claim history with confirmation

Security & Compliance
Feature	Description
🔒 Secure Architecture	No exposed API keys – uses Lovable AI Gateway
📜 Legal & Privacy Policy	Comprehensive legal page with AI disclaimer, terms, and privacy policy
🛡️ File Validation	Type and size restrictions with user-friendly error messages
⚠️ AI Disclaimer	Clear statement that AI decisions are preliminary and subject to review
🏗️ Architecture

System Flow Diagram
text
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
├─────────────────────────────────────────────────────────────────┤
│  /claims Page                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │  Auto/      │  │  Conditional │  │  File Upload        │   │
│  │  Property   │  │  Forms       │  │  (Images + Audio)   │   │
│  │  Toggle     │  │              │  │                     │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
│                            ▼                                    │
│               ┌─────────────────────────┐                      │
│               │  "Run AI Claim Analysis" │                     │
│               └─────────────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER FUNCTION (Secure)                     │
├─────────────────────────────────────────────────────────────────┤
│                    Lovable AI Gateway                          │
│                  (LOVALABLE_API_KEY)                           │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        AI PIPELINE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────────┐  │
│  │    Audio    │ →  │   Whisper   │ →  │    Transcript    │  │
│  │  (if any)   │    │  (OpenAI)   │    │                  │  │
│  └─────────────┘    └─────────────┘    └──────────────────┘  │
│                           │                                     │
│                           ▼                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────────┐  │
│  │   Images    │ →  │   Gemini    │ →  │  Damage Estimate │  │
│  │   (Vision)  │    │  (Google)   │    │  (Cost, Severity,│  │
│  └─────────────┘    └─────────────┘    │   Confidence)    │  │
│                                        └──────────────────┘  │
│                           │                                     │
│                           ▼                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────────┐  │
│  │  Form Data  │ +  │  Gemini     │ →  │  Final Decision  │  │
│  │  Transcript │    │  (Google)   │    │  (Approved/      │  │
│  │  Damage     │    │  (Adjudicate│    │   Denied/        │  │
│  │  Estimate   │    │   All Data) │    │   Pending)       │  │
│  └─────────────┘    └─────────────┘    └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        RESULTS PANEL                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐       │
│  │  ✅ Decision: Approved                              │       │
│  │  💰 Payout: $2,200                                 │       │
│  │  📝 Reasoning: Rear-end collision, moderate damage │       │
│  │  🚩 Flags: No anomalies detected                   │       │
│  │  📋 Next Steps: Visit approved body shop           │       │
│  └─────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CLAIMS HISTORY STORAGE                        │
├─────────────────────────────────────────────────────────────────┤
│                    localStorage (Browser)                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Claim #001 │ Auto │ Approved │ $2,200 │ 2026-07-20   │   │
│  │  Claim #002 │ Prop │ Pending  │ $0    │ 2026-07-19   │   │
│  │  Claim #003 │ Auto │ Denied   │ $0    │ 2026-07-18   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

Technology Stack
Layer	Technology
Frontend	React / TypeScript (Lovable Framework)
AI Gateway	Lovable AI Gateway (secure, server-side)
Transcription	OpenAI Whisper (gpt-4o-mini-transcribe)
Vision Analysis	Google Gemini 3 Flash Preview
Adjudication	Google Gemini (final decision)
Storage	localStorage (client-side persistence)
PDF Export	html2pdf.js (coming soon)
🎯 How It Works

Step-by-Step User Journey
1️⃣ Submit a Claim
text
┌─────────────────────────────────────────────────────────────┐
│  1. Select Claim Type                                       │
│     ┌─────────────────────────────────────────────────┐    │
│     │  🚗 Auto  │  🏠 Property                       │    │
│     └─────────────────────────────────────────────────┘    │
│                                                             │
│  2. Fill in Details                                        │
│     ┌─────────────────────────────────────────────────┐    │
│     │  VIN: 1HGCM82633A123456                        │    │
│     │  Make: Toyota                                  │    │
│     │  Model: Camry                                  │    │
│     │  Year: 2020                                    │    │
│     │  Location: Main St & 5th Ave, Austin, TX      │    │
│     │  Vehicle Value: $25,000                        │    │
│     │  Deductible: $500                              │    │
│     └─────────────────────────────────────────────────┘    │
│                                                             │
│  3. Upload Evidence                                        │
│     ┌─────────────────────────────────────────────────┐    │
│     │  📸 Drop images here or click to upload        │    │
│     │  🎤 Drop audio here or click to upload         │    │
│     └─────────────────────────────────────────────────┘    │
│                                                             │
│  4. Click "Run AI Claim Analysis"                          │
└─────────────────────────────────────────────────────────────┘
2️⃣ AI Processing (Real-Time)
text
┌─────────────────────────────────────────────────────────────┐
│  🔄 Processing...                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📸 Analyzing images...    [██████████░░░░] 80%   │   │
│  │  🎤 Transcribing audio...  [████████████░░] 90%   │   │
│  │  ⚖️ Generating decision... [██████████████] 100%  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ⏱️ Estimated time: 5-10 seconds                          │
└─────────────────────────────────────────────────────────────┘
3️⃣ View Results
text
┌─────────────────────────────────────────────────────────────┐
│  ✅ AI Decision                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Decision: Approved                                │   │
│  │  💰 Payout: $2,200                                │   │
│  │                                                    │   │
│  │  📝 Reasoning:                                     │   │
│  │  "Rear-end collision with moderate damage.        │   │
│  │   Estimated repair cost $2,700 – $500 deductible  │   │
│  │   = $2,200 payout. VIN matches vehicle details.   │   │
│  │   Location verified."                             │   │
│  │                                                    │   │
│  │  🚩 Flags: No anomalies detected                  │   │
│  │                                                    │   │
│  │  📋 Next Steps:                                    │   │
│  │  "Take vehicle to an approved body shop for       │   │
│  │   a formal quote."                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  💾 Claim automatically saved to history                   │
└─────────────────────────────────────────────────────────────┘
4️⃣ Track History
text
┌─────────────────────────────────────────────────────────────┐
│  📋 My Claims                                              │
│  ┌────────────┬──────────┬────────────┬────────┬───────┐ │
│  │    Date    │   Type   │   Status   │ Payout │ View  │ │
│  ├────────────┼──────────┼────────────┼────────┼───────┤ │
│  │ 2026-07-20 │   Auto   │ Approved   │ $2,200 │ 👁️   │ │
│  │ 2026-07-19 │ Property │  Pending   │   $0   │ 👁️   │ │
│  │ 2026-07-18 │   Auto   │  Denied    │   $0   │ 👁️   │ │
│  └────────────┴──────────┴────────────┴────────┴───────┘ │
│                                                             │
│  🔄 [Clear History]                                        │
└─────────────────────────────────────────────────────────────┘
