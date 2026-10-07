"use client";

import React, { useState } from "react";
import {
  BookOpen,
  ShieldAlert,
  Flame,
  Link2,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Info,
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  tag: string;
  tagColor: string;
  summary: string;
  anatomy: {
    label: string;
    example: string;
    dangerLevel: string;
    explanation: string;
  }[];
  defenseTips: string[];
  takeaway: string;
}

interface TrainingScenario {
  id: string;
  category: "Phishing" | "Bank Scam" | "Delivery Scam" | "Job Scam" | "Prize Scam" | "Safe Email" | "Normal Conversation";
  title: string;
  typeBadge: string;
  isThreat: boolean;
  sender: string;
  subject?: string;
  content: string;
  whyExplanation: string;
  warningSigns: string[];
  howToProtect: string[];
}

const LESSONS: Lesson[] = [
  {
    id: "phishing",
    title: "Understanding Phishing & Credential Harvesters",
    tag: "Phishing Attack",
    tagColor: "bg-rose-50 text-rose-800 border-rose-200",
    summary: "Phishing attacks use deceptive messages engineered to look like trusted organizations (banks, cloud services, streaming apps) to trick you into entering passwords or financial credentials.",
    anatomy: [
      {
        label: "Spoofed Sender",
        example: "service@paypa1-security-verify.com",
        dangerLevel: "High",
        explanation: "Uses lookalike characters (number '1' instead of letter 'l') or mismatched domains.",
      },
      {
        label: "Coercive Ultimatum",
        example: "Account will be restricted in 24 hours!",
        dangerLevel: "Critical",
        explanation: "Forces immediate emotional reaction to bypass rational skepticism.",
      },
      {
        label: "Harvesting Hyperlink",
        example: "http://verify-account-portal.xyz/login",
        dangerLevel: "Critical",
        explanation: "Points to a malicious form that logs your keystrokes and session cookies.",
      },
    ],
    defenseTips: [
      "Never click login links in unsolicited emails or SMS alerts.",
      "Navigate to the service independently by typing the official address in your browser.",
      "Enable multi-factor authentication (MFA) using authenticator apps, not SMS.",
      "Check the top-level domain carefully for .xyz, .top, or double domains.",
    ],
    takeaway: "Legitimate institutions will never threaten immediate account deletion without prior notice.",
  },
  {
    id: "urgency",
    title: "How Attackers Weaponize Urgency",
    tag: "Psychological Trigger",
    tagColor: "bg-amber-50 text-amber-800 border-amber-200",
    summary: "Attackers manufacture urgency to place victims in a cognitive fight-or-flight state, preventing them from consulting colleagues or verifying procedures.",
    anatomy: [
      {
        label: "Artificial Time Limit",
        example: "Act within 15 minutes or face legal action",
        dangerLevel: "High",
        explanation: "Forces hurried decision-making without consulting IT or family.",
      },
      {
        label: "Consequence Inflation",
        example: "Your tax ID is under active arrest warrant",
        dangerLevel: "High",
        explanation: "Uses extreme fear-based exaggerations that government agencies never broadcast.",
      },
      {
        label: "Secrecy Demand",
        example: "Do NOT discuss this wire transfer with anyone",
        dangerLevel: "Critical",
        explanation: "Isolates the target so peers cannot flag the fraudulent activity.",
      },
    ],
    defenseTips: [
      "Pause. Take 5 minutes before replying to any high-stress message.",
      "Verify via a separate out-of-band communication channel (phone call, official portal).",
      "Treat all demands for secrecy as an immediate security red flag.",
    ],
    takeaway: "If a communication demands frantic action, it is almost certainly malicious.",
  },
  {
    id: "urls",
    title: "How to Identify Suspicious URLs",
    tag: "Web Security",
    tagColor: "bg-violet-50 text-violet-800 border-violet-200",
    summary: "Malicious links often hide behind URL shorteners, multiple subdomains, typosquatting, or numeric IP addresses to evade basic user scrutiny.",
    anatomy: [
      {
        label: "Subdomain Masquerading",
        example: "https://apple.com.login-verify-account.com",
        dangerLevel: "Critical",
        explanation: "The true domain is login-verify-account.com, NOT apple.com.",
      },
      {
        label: "Direct Numeric IP",
        example: "http://192.168.1.100/auth",
        dangerLevel: "High",
        explanation: "Bypasses standard DNS registration; almost exclusively used in malicious payloads.",
      },
      {
        label: "High-Risk TLDs",
        example: "http://free-reward-giftcard.top",
        dangerLevel: "High",
        explanation: "Cheap or unmoderated top-level domains are frequently used for disposable campaigns.",
      },
    ],
    defenseTips: [
      "Read domains from right to left before the first forward slash (/)",
      "Avoid clicking shortened links (bit.ly, tinyurl) from unknown numbers.",
      "Check for valid HTTPS, but remember HTTPS only proves encryption, not trustworthiness.",
    ],
    takeaway: "The real domain is the word immediately preceding the final .com/.org/.net, not the subdomains at the start.",
  },
  {
    id: "sender",
    title: "How to Verify a Sender's True Identity",
    tag: "Email Forensics",
    tagColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    summary: "Display names can be set to anything. Attackers exploit this to impersonate your boss, your university, or your bank with zero technical effort.",
    anatomy: [
      {
        label: "Mismatched Display Name",
        example: "Display: 'PayPal Security' <hacker99@gmail.com>",
        dangerLevel: "High",
        explanation: "The display name says PayPal, but the actual sending mailbox is a free Gmail address.",
      },
      {
        label: "Disparate Reply-To",
        example: "From: admin@company.com -> Reply-To: collect@foreignhost.net",
        dangerLevel: "Critical",
        explanation: "Your reply bypasses the legitimate server and goes directly to the attacker.",
      },
    ],
    defenseTips: [
      "Always inspect the full email address inside the angle brackets <...>, not just the display name.",
      "Check the Reply-To header when responding to financial or payroll changes.",
      "Contact the sender via their internal phone extension or chat tool.",
    ],
    takeaway: "Never trust a display name alone without checking the domain inside the envelope header.",
  },
];

const TRAINING_SCENARIOS: TrainingScenario[] = [
  {
    id: "bank-scam",
    category: "Bank Scam",
    title: "Urgent Wire Suspension Alert",
    typeBadge: "SMS Alert",
    isThreat: true,
    sender: "SMS: +1 (833) 492-0199",
    content: "CHASE FRAUD ALERT: A debit transaction of $1,420.00 to CryptoMarket Corp is pending. If you DID NOT authorize this, reply NO or visit https://chase-security-cancel-wire.xyz/fraud immediately to prevent account lockdown.",
    whyExplanation: "The attacker manufactures panic over a large fictitious charge, pressuring you into clicking a phishing form that harvests your online banking credentials and OTP.",
    warningSigns: [
      "Spoofed domain ending in non-standard '.xyz' TLD rather than 'chase.com'",
      "Extreme urgency manufactured with threat of 'immediate account lockdown'",
      "Unsolicited request to intervene via external link rather than official mobile app",
    ],
    howToProtect: [
      "Never click links sent in SMS fraud alerts.",
      "Log into your bank independently by typing the official domain or opening the official bank app.",
      "Call the number printed on the physical back of your debit card to verify genuine alerts.",
    ],
  },
  {
    id: "delivery-scam",
    category: "Delivery Scam",
    title: "Package Address Incomplete Notice",
    typeBadge: "SMS Smishing",
    isThreat: true,
    sender: "SMS: alert@usps-tracking-dept.com",
    content: "USPS Notice: Your package #US984021 cannot be dispatched due to an incomplete street number. Update your delivery address within 12 hours or item will be returned to sender: https://usps-redirection-post.com/update",
    whyExplanation: "Known as a 'smishing delivery lure'. The link redirects to a card payment fee ($1.95) harvesting page that compromises credit card numbers.",
    warningSigns: [
      "Mismatched domain: 'usps-redirection-post.com' instead of official 'usps.com'",
      "Strict 12-hour ultimatum designed to bypass critical thinking",
      "Unsolicited package alert without recipient identification or tracking history",
    ],
    howToProtect: [
      "Track packages exclusively on the carrier's official website (usps.com, fedex.com, ups.com).",
      "Postal services do not require small fee payments via third-party SMS links to deliver existing packages.",
    ],
  },
  {
    id: "job-scam",
    category: "Job Scam",
    title: "High-Pay Remote Data Entry Offer",
    typeBadge: "Email Phish",
    isThreat: true,
    sender: "Email: recruitment@fastcareer-onboarding.xyz",
    subject: "Immediate Job Offer: Remote Operations Specialist ($55/hr)",
    content: "Dear Candidate, We reviewed your LinkedIn profile and are pleased to offer you the Remote Operations Specialist position at $55/hr. No interview needed! To receive your company equipment setup check of $2,500 and sign-on paperwork, reply with your full SSN, date of birth, and routing number.",
    whyExplanation: "Classic fake check / identity theft scam. Threat actors send a fraudulent check for 'equipment', ask the victim to wire a portion back, and vanish when the original check bounces.",
    warningSigns: [
      "Offer made without a live interview or screening process",
      "Unrealistically high hourly wage ($55/hr) for basic entry-level tasks",
      "Request for sensitive SSN and banking routing numbers over unencrypted email",
      "Disposable '.xyz' sender domain",
    ],
    howToProtect: [
      "Legitimate organizations never hire or extend offers without verifiable interviews.",
      "Never deposit unexpected checks requiring you to wire money back to third parties.",
      "Verify job postings on the employer's official careers site.",
    ],
  },
  {
    id: "prize-scam",
    category: "Prize Scam",
    title: "International Lottery Win",
    typeBadge: "SMS Lottery",
    isThreat: true,
    sender: "SMS: Winner-Notification",
    content: "FINAL NOTICE: Your phone number was selected as the 2nd prize winner in the Global Mobile Draw for £750,000! To claim your payout code #8821, reply CLAIM and wire a £150 legal processing fee via Western Union.",
    whyExplanation: "Advance-fee fraud (419 scam). You cannot win a lottery you never entered, and legitimate prizes never require you to wire an upfront 'release fee'.",
    warningSigns: [
      "Winning a lottery or contest you never purchased a ticket for",
      "Requirement to pay an upfront 'processing' or 'legal' fee to receive funds",
      "Wire transfers (Western Union, MoneyGram, Crypto) which are untraceable and irreversible",
    ],
    howToProtect: [
      "Remember: If you didn't enter a contest, you didn't win it.",
      "Never pay money to claim a prize — legitimate lotteries deduct taxes or fees from the winnings directly.",
    ],
  },
  {
    id: "phishing",
    category: "Phishing",
    title: "Cloud Storage Quota Exceeded",
    typeBadge: "Email Phish",
    isThreat: true,
    sender: "From: Workspace Team <admin-notice@google-drive-security-auth.net>",
    subject: "ACTION REQUIRED: Your Cloud Storage has reached 99.8% capacity",
    content: "Your Google Drive and Gmail storage is almost full. In accordance with service terms, all incoming emails and messages will be permanently rejected in 24 hours. Upgrade or verify your storage allocation immediately at: https://accounts-google.com.storage-auth-portal.net/login",
    whyExplanation: "Credential harvesting phishing attack engineered to compromise Google Workspace enterprise accounts and gain access to corporate files.",
    warningSigns: [
      "Lookalike domain: 'accounts-google.com.storage-auth-portal.net' where the actual host domain is 'storage-auth-portal.net'",
      "Emotional trigger: threat of losing incoming work emails within 24 hours",
      "Sender address from '.net' domain instead of official 'google.com'",
    ],
    howToProtect: [
      "Inspect the URL domain starting from right to left before the first single slash (/)",
      "Always navigate to cloud storage settings directly from the official portal.",
    ],
  },
  {
    id: "safe-email",
    category: "Safe Email",
    title: "Quarterly Engineering Roadmap Review",
    typeBadge: "Internal Email",
    isThreat: false,
    sender: "From: Sarah Lin <sarah.lin@internal-company.org>",
    subject: "Q3 Sprint Planning & Architectural Review Notes",
    content: "Hi David,\n\nThanks for sending over the benchmark data earlier today. I reviewed the performance traces and agree we should refactor the caching layer in sprint 4.\n\nLet's discuss the proposed schema migration during our scheduled 2 PM sync in Conference Room B.\n\nBest,\nSarah",
    whyExplanation: "This is a legitimate internal business communication. It references established shared context, contains no high-pressure ultimatums, has no suspicious external URLs or credential requests, and comes from a verified internal domain.",
    warningSigns: [
      "No suspicious links or redirects",
      "No manufactured urgency or coercive threats",
      "Natural conversational context matching normal workplace collaboration",
    ],
    howToProtect: [
      "Even with routine emails, maintain basic awareness of unexpected sender address changes or unusual attachment types (.exe, .scr, .iso).",
    ],
  },
  {
    id: "normal-conversation",
    category: "Normal Conversation",
    title: "Family Dinner Coordination",
    typeBadge: "SMS Chat",
    isThreat: false,
    sender: "SMS: Mom",
    content: "Hey honey, Dad and I are heading over to the Italian restaurant around 6:30 tonight. Grandma said she might join us too. Let us know if you want us to save you a seat or if you're running late from work!",
    whyExplanation: "This is a typical personal communication. It contains conversational language, zero manipulative pressure, no financial solicitation, and no hyperlinks.",
    warningSigns: [
      "Completely authentic personal message",
      "No links, attachments, or requests for sensitive information",
      "No coercive threats or artificial deadlines",
    ],
    howToProtect: [
      "Safe messages can be received with confidence. If an unknown number claims to be a relative in an emergency asking for money, always verify via a direct voice call.",
    ],
  },
];

export default function ThreatEducation() {
  const [activeTab, setActiveTab] = useState<"training" | "encyclopedia">("training");
  const [activeLessonId, setActiveLessonId] = useState<string>(LESSONS[0].id);
  const activeLesson = LESSONS.find((l) => l.id === activeLessonId) || LESSONS[0];

  // Training Mode State
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState<number>(0);
  const [userPrediction, setUserPrediction] = useState<"SAFE" | "THREAT" | null>(null);
  const [revealed, setRevealed] = useState<boolean>(false);
  const [scoreHistory, setScoreHistory] = useState<{ [scenarioId: string]: boolean }>({});

  const currentScenario = TRAINING_SCENARIOS[currentScenarioIndex];

  const handlePredict = (prediction: "SAFE" | "THREAT") => {
    setUserPrediction(prediction);
    setRevealed(true);
    const isCorrect = (prediction === "THREAT") === currentScenario.isThreat;
    setScoreHistory((prev) => ({
      ...prev,
      [currentScenario.id]: isCorrect,
    }));
  };

  const handleNextScenario = () => {
    setUserPrediction(null);
    setRevealed(false);
    setCurrentScenarioIndex((prev) => (prev + 1) % TRAINING_SCENARIOS.length);
  };

  const totalAnswered = Object.keys(scoreHistory).length;
  const totalCorrect = Object.values(scoreHistory).filter(Boolean).length;
  const accuracyPct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  return (
    <section id="education" className="py-14 md:py-20 bg-[#FAF9F6] border-b border-[#E8E6E1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E8E6E1] text-xs font-semibold text-[#6D5DFB] shadow-2xs mb-3">
            <BookOpen className="w-3.5 h-3.5 text-[#6D5DFB]" />
            <span>AI Threat Intelligence Education &bull; Interactive Labs</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#202124] tracking-tight">
            Security Training &amp; Threat Intelligence
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#5F6368] leading-relaxed">
            Strengthen your cyber defense reflexes with hands-on scenario simulations and in-depth attack anatomy breakdowns.
          </p>

          {/* Dual Mode Switcher */}
          <div className="inline-flex items-center p-1.5 bg-white rounded-2xl border border-[#E8E6E1] shadow-2xs mt-6">
            <button
              onClick={() => setActiveTab("training")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "training"
                  ? "bg-[#6D5DFB] text-white shadow-xs"
                  : "text-[#5F6368] hover:text-[#202124]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Security Training Mode</span>
              <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/20">
                {TRAINING_SCENARIOS.length} Cases
              </span>
            </button>
            <button
              onClick={() => setActiveTab("encyclopedia")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "encyclopedia"
                  ? "bg-[#6D5DFB] text-white shadow-xs"
                  : "text-[#5F6368] hover:text-[#202124]"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Threat Encyclopedia</span>
            </button>
          </div>
        </div>

        {/* MODE 1: Interactive Security Training Lab */}
        {activeTab === "training" && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Top Score & Progress Bar */}
            <div className="bg-white rounded-2xl border border-[#E8E6E1] p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#202124]">Training Progress:</span>
                <div className="flex items-center gap-1">
                  {TRAINING_SCENARIOS.map((s, idx) => {
                    const answered = scoreHistory[s.id] !== undefined;
                    const isPassed = scoreHistory[s.id] === true;
                    const isCurrent = idx === currentScenarioIndex;
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          setCurrentScenarioIndex(idx);
                          setUserPrediction(null);
                          setRevealed(false);
                        }}
                        className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center cursor-pointer ${
                          isCurrent
                            ? "bg-[#6D5DFB] text-white shadow-xs ring-2 ring-[#6D5DFB]/30"
                            : answered
                            ? isPassed
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-rose-100 text-rose-800 border border-rose-300"
                            : "bg-[#FAF9F6] text-[#5F6368] border border-[#E8E6E1] hover:border-[#D5D2CB]"
                        }`}
                        title={`${s.category}: ${s.title}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-[#5F6368]">Completed: </span>
                  <strong className="text-[#202124]">{totalAnswered} / {TRAINING_SCENARIOS.length}</strong>
                </div>
                <div className="h-4 w-px bg-[#E8E6E1]" />
                <div>
                  <span className="text-[#5F6368]">Accuracy: </span>
                  <strong className={`font-bold ${accuracyPct >= 70 ? "text-emerald-700" : "text-[#6D5DFB]"}`}>
                    {accuracyPct}% ({totalCorrect} Correct)
                  </strong>
                </div>
              </div>
            </div>

            {/* Scenario Card (DEMO / TRAINING DATA) */}
            <div className="bg-white rounded-3xl border border-[#E8E6E1] p-6 sm:p-8 shadow-xs space-y-6">
              {/* Card Meta Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#F0EFEA]">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-black uppercase bg-[#F2F0FF] text-[#6D5DFB] border border-[#E8E6E1]">
                    Scenario {currentScenarioIndex + 1} of {TRAINING_SCENARIOS.length}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-black uppercase bg-amber-50 text-amber-800 border border-amber-200">
                    DEMO / TRAINING DATA
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono text-[#5F6368] border border-[#E8E6E1]">
                    {currentScenario.category}
                  </span>
                </div>

                <span className="text-xs text-[#5F6368] font-mono">
                  {currentScenario.typeBadge}
                </span>
              </div>

              {/* Scenario Narrative */}
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[#202124]">
                  {currentScenario.title}
                </h3>
                <div className="mt-3 p-4 bg-[#FAF9F6] rounded-2xl border border-[#E8E6E1] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#5F6368]">
                    <span className="font-bold text-[#202124]">Sender:</span>
                    <span>{currentScenario.sender}</span>
                  </div>
                  {currentScenario.subject && (
                    <div className="flex items-center gap-2 text-xs font-mono text-[#5F6368]">
                      <span className="font-bold text-[#202124]">Subject:</span>
                      <span className="font-semibold text-[#202124]">{currentScenario.subject}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-[#E8E6E1]">
                    <pre className="text-xs sm:text-sm font-mono text-[#202124] whitespace-pre-wrap leading-relaxed">
                      {currentScenario.content}
                    </pre>
                  </div>
                </div>
              </div>

              {/* User Prediction Controls */}
              {!revealed ? (
                <div className="pt-4 border-t border-[#F0EFEA] space-y-3">
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#5F6368]">
                      Evaluate This Message: What is your verdict?
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    <button
                      onClick={() => handlePredict("SAFE")}
                      className="py-3 px-5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>PREDICT SAFE</span>
                    </button>
                    <button
                      onClick={() => handlePredict("THREAT")}
                      className="py-3 px-5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4 text-rose-700" />
                      <span>PREDICT THREAT</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Revealed Analysis & Defense Dossier */
                <div className="pt-4 border-t border-[#F0EFEA] space-y-5 animate-fadeIn">
                  {/* Verdict Status Banner */}
                  <div
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                      (userPrediction === "THREAT") === currentScenario.isThreat
                        ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                        : "bg-rose-50 border-rose-200 text-rose-950"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {(userPrediction === "THREAT") === currentScenario.isThreat ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                      )}
                      <div>
                        <h4 className="text-sm font-black">
                          {(userPrediction === "THREAT") === currentScenario.isThreat
                            ? "Correct Assessment! Sharp Security Reflexes."
                            : "Assessment Missed: Danger Overlooked."}
                        </h4>
                        <p className="text-xs mt-0.5">
                          Actual Verdict: <strong>{currentScenario.isThreat ? "THREAT / MALICIOUS" : "SAFE / BENIGN"}</strong> &bull; You predicted: <strong>{userPrediction}</strong>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleNextScenario}
                      className="px-4 py-2 rounded-xl bg-[#202124] text-white hover:bg-black font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                    >
                      <span>Next Case</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Why this is dangerous / safe */}
                  <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#E8E6E1] space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6368]">
                      Cognitive Explanation (Why):
                    </span>
                    <p className="text-xs sm:text-sm text-[#202124] leading-relaxed">
                      {currentScenario.whyExplanation}
                    </p>
                  </div>

                  {/* Warning Signs & Defense Rules Split */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Warning Signs */}
                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
                      <h5 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                        <span>Key Warning Indicators</span>
                      </h5>
                      <ul className="space-y-1.5 text-xs text-amber-950">
                        {currentScenario.warningSigns.map((sign, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                            <span>{sign}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* How to Protect */}
                    <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                      <h5 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Actionable Defense Protocol</span>
                      </h5>
                      <ul className="space-y-1.5 text-xs text-emerald-950">
                        {currentScenario.howToProtect.map((tip, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Bottom Try in Scanner link */}
                  <div className="pt-3 border-t border-[#F0EFEA] flex items-center justify-between text-xs">
                    <span className="text-[#5F6368]">
                      Want to run this sample through the 8-Stage Scanner?
                    </span>
                    <button
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent("load-workspace-text", {
                            detail: currentScenario.content,
                          })
                        );
                        const ws = document.getElementById("workspace");
                        if (ws) ws.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#F2F0FF] hover:bg-[#E8E4FF] text-[#6D5DFB] font-bold transition-colors cursor-pointer"
                    >
                      Scan Message in Workspace &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODE 2: Master Two-Column Threat Encyclopedia */}
        {activeTab === "encyclopedia" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT: Mini Lesson Directory (4 Cols) */}
            <div className="lg:col-span-4 bg-white rounded-3xl border border-[#E8E6E1] p-4 shadow-xs space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6368] px-3 py-1 block">
                Curated Threat Lessons
              </span>

              {LESSONS.map((lesson) => {
                const isSelected = lesson.id === activeLessonId;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLessonId(lesson.id)}
                    className={`w-full p-4 rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-[#FAF9F6] border border-[#6D5DFB] shadow-xs"
                        : "hover:bg-[#FAF9F6] border border-transparent"
                    }`}
                  >
                    <div className="space-y-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${lesson.tagColor}`}>
                        {lesson.tag}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-[#202124] leading-snug">
                        {lesson.title}
                      </h4>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? "text-[#6D5DFB] translate-x-0.5" : "text-[#5F6368]"}`} />
                  </button>
                );
              })}
            </div>

            {/* RIGHT: Selected Interactive Lesson Dossier (8 Cols) */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E8E6E1] p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${activeLesson.tagColor}`}>
                    {activeLesson.tag}
                  </span>
                  <span className="text-xs text-[#5F6368] font-mono">&bull; 3 min lesson</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#202124]">
                  {activeLesson.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-[#5F6368] leading-relaxed">
                  {activeLesson.summary}
                </p>
              </div>

              {/* Attack Anatomy Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#202124] uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#FF6B6B]" />
                  <span>Anatomy of this Threat Pattern</span>
                </h4>

                <div className="space-y-2.5">
                  {activeLesson.anatomy.map((item, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#202124]">{item.label}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          {item.dangerLevel} Danger
                        </span>
                      </div>
                      <code className="text-xs font-mono bg-white px-2.5 py-1.5 rounded-lg border border-[#E8E6E1] block text-[#FF6B6B] break-all">
                        {item.example}
                      </code>
                      <p className="text-[11px] text-[#5F6368] leading-relaxed">
                        {item.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Defensive Checklist */}
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Actionable Defensive Rules</span>
                </h4>
                <ul className="space-y-2 text-xs text-emerald-950">
                  {activeLesson.defenseTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom Key Takeaway Strip */}
              <div className="pt-4 border-t border-[#E8E6E1] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-[#5F6368]">
                  <Info className="w-4 h-4 text-[#6D5DFB] shrink-0" />
                  <span><strong>Rule of thumb:</strong> {activeLesson.takeaway}</span>
                </div>
                <button
                  onClick={() => {
                    const ws = document.getElementById("workspace");
                    if (ws) ws.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-4 py-2 rounded-xl bg-[#6D5DFB] text-white font-bold hover:bg-[#5B4CE0] text-xs transition-colors shrink-0 cursor-pointer"
                >
                  Scan a Message
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

