"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";

interface Scenario {
  id: string;
  category: string;
  sender: string;
  preview: string;
  isThreat: boolean;
  threatType?: string;
  why: string;
  redFlags: string[];
  howToSpot: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "bank-phish",
    category: "Bank Phishing",
    sender: "security@chase-auth-verification.com",
    preview: "URGENT: Suspicious debit transaction of $842.10 detected on your card. If this wasn't you, verify your identity immediately to block charges: https://chase.com.security-auth.xyz/verify",
    isThreat: true,
    threatType: "Credential Harvesting / Phishing",
    why: "Legitimate financial institutions never use newly-registered lookalike domains (.xyz) or demand immediate identity submission under panic ultimatums.",
    redFlags: [
      "Deceptive subdomain pretending to be Chase (chase.com.security-auth.xyz)",
      "Urgency panic induction ('verify immediately to block charges')",
      "Lookalike sender domain (chase-auth-verification.com)",
    ],
    howToSpot: "Always examine the true root domain immediately before the first slash. If in doubt, open your banking app directly without clicking message links.",
  },
  {
    id: "delivery-scam",
    category: "Delivery Scam",
    sender: "+1 (833) 492-0194",
    preview: "USPS Notification: Parcel #US82910 could not be delivered due to incorrect street number. Please update delivery fee ($1.50) within 12 hours: https://usps-tracking-parcel.site/redeliver",
    isThreat: true,
    threatType: "Smishing / Credit Card Theft",
    why: "Attackers use tiny redelivery fee pretexts ($1.50) to harvest full credit card numbers, CVVs, and billing addresses.",
    redFlags: [
      "Unofficial tracking URL (.site domain rather than usps.com)",
      "Vague parcel ID sent via generic SMS without your name",
      "Demands payment for address correction",
    ],
    howToSpot: "Visit the carrier's official website (usps.com, ups.com, fedex.com) and manually type the tracking code into their official search bar.",
  },
  {
    id: "job-scam",
    category: "Job Scam",
    sender: "hr-recruiting@global-careers-consulting.net",
    preview: "Congratulations! Your profile was selected for our Remote Data Specialist position ($65/hr). No experience needed, flexible hours. Contact hiring manager via Telegram @recruiter_karen to receive your equipment purchase check.",
    isThreat: true,
    threatType: "Advance Fee / Fake Check Scam",
    why: "High pay for zero experience and redirecting to Telegram or sending a 'check to buy office supplies' are universal markers of employment fraud.",
    redFlags: [
      "Unsolicited job offer without an application or interview",
      "Off-platform messaging migration (Telegram/WhatsApp)",
      "Fake check purchase advance-fee scheme",
    ],
    howToSpot: "Legitimate corporate recruiters never send checks for candidates to buy equipment from specified third-party vendors.",
  },
  {
    id: "prize-scam",
    category: "Prize Scam",
    sender: "claims@lottery-promo-uk.org",
    preview: "FINAL NOTICE: You have been chosen as the £50,000 sweepstakes runner-up. Call 09061701461 to claim before 5:00 PM today. Standard call charges apply. Ref #9921.",
    isThreat: true,
    threatType: "Premium Rate Number / Prize Fraud",
    why: "You cannot win a competition you never entered. The phone number provided is an extortionate premium-rate line that bills your carrier per minute.",
    redFlags: [
      "Prize claim for a lottery you never entered",
      "Short deadline ultimatum ('before 5:00 PM today')",
      "High-cost premium rate phone number",
    ],
    howToSpot: "If an offer requires you to pay fees or call premium numbers to collect winnings, it is always a scam.",
  },
  {
    id: "investment-scam",
    category: "Investment Scam",
    sender: "crypto-growth@telegram-bot-signals.io",
    preview: "Guaranteed 12% daily compounding returns using our AI automated arbitrage engine. Deposit 0.05 BTC to start earning today. Risk-free guarantee backed by liquidity pool.",
    isThreat: true,
    threatType: "Ponzi / Crypto Pig Butchering",
    why: "No legitimate investment can guarantee high daily compounding returns without risk. All deposited cryptocurrency is permanently lost.",
    redFlags: [
      "'Guaranteed' return promises in volatile markets",
      "Daily double-digit compounding claims",
      "Direct cryptocurrency wallet transfers",
    ],
    howToSpot: "Any scheme promising 'guaranteed' or 'risk-free' high yield is fraudulent. Regulated financial advisors never make such claims.",
  },
  {
    id: "safe-colleague",
    category: "Safe Message",
    sender: "sarah.jenkins@company.internal",
    preview: "Hey Mike, can you review the draft slides for the Q3 product roadmap before our sync at 3pm? I shared the link directly via our Google Drive folder.",
    isThreat: false,
    why: "Legitimate professional conversation with realistic context, expected sender, and no panic or credential harvesting.",
    redFlags: [],
    howToSpot: "Natural conversational tone, references established internal context, and instructs using existing trusted channels rather than suspicious attachments.",
  },
  {
    id: "normal-alert",
    category: "Normal Conversation",
    sender: "notifications@github.com",
    preview: "A new release (v2.4.0) has been published for your watched repository: 'facebook/react'. View the release notes on github.com.",
    isThreat: false,
    why: "Legitimate automated notification from a genuine domain (github.com) without urgent threats or password verification demands.",
    redFlags: [],
    howToSpot: "Sender domain matches the real organization, no coercive deadlines, and links point directly to the authentic platform domain.",
  },
];

export default function SecurityTraining() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userChoice, setUserChoice] = useState<boolean | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const scenario = SCENARIOS[currentIndex];
  const isAnswered = userChoice !== null;
  const isCorrect = isAnswered && userChoice === scenario.isThreat;

  const handleSelect = (choiceIsThreat: boolean) => {
    if (isAnswered) return;
    setUserChoice(choiceIsThreat);
    setScore((prev) => ({
      correct: choiceIsThreat === scenario.isThreat ? prev.correct + 1 : prev.correct,
      total: prev.total + 1,
    }));
  };

  const handleNext = () => {
    setUserChoice(null);
    setCurrentIndex((prev) => (prev + 1) % SCENARIOS.length);
  };

  return (
    <section id="training" className="py-14 bg-[#FAF9F6] border-b border-[#E8E6E1]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E8E6E1] text-xs font-semibold text-[#6D5DFB] mb-3 shadow-2xs">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Interactive Threat Education &bull; Training Center</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#202124] tracking-tight">
            Security Training: Would you trust this?
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#5F6368]">
            Test your intuition against real-world social engineering and legitimate communication samples.
          </p>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-mono font-bold">
            TRAINING DATA &bull; Score: {score.correct} / {score.total} completed
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-[#E8E6E1] p-6 sm:p-8 shadow-sm space-y-6">
          {/* Scenario Info */}
          <div className="flex items-center justify-between border-b border-[#E8E6E1] pb-3 text-xs">
            <span className="font-bold text-[#202124] uppercase tracking-wider flex items-center gap-1.5">
              <span>Scenario {currentIndex + 1} of {SCENARIOS.length}</span>
              <span className="text-[#5F6368]">&bull; {scenario.category}</span>
            </span>
            <span className="font-mono text-[#5F6368]">{scenario.sender}</span>
          </div>

          {/* Message Preview Box */}
          <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1] font-mono text-xs sm:text-sm text-[#202124] leading-relaxed break-words">
            {scenario.preview}
          </div>

          {/* User Decision Buttons */}
          {!isAnswered ? (
            <div className="space-y-3 text-center">
              <p className="text-xs font-bold text-[#202124]">Would you trust this communication?</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => handleSelect(false)}
                  className="px-6 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all shadow-2xs hover:shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>SAFE &bull; I would trust this</span>
                </button>
                <button
                  onClick={() => handleSelect(true)}
                  className="px-6 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold transition-all shadow-2xs hover:shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>THREAT &bull; Suspicious or Fraud</span>
                </button>
              </div>
            </div>
          ) : (
            /* Reveal Feedback */
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Verdict Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isCorrect
                    ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                    : "bg-rose-50 text-rose-900 border-rose-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <div>
                    <h4 className="text-sm font-bold">
                      {isCorrect ? "Correct assessment!" : "Careful! That was dangerous."}
                    </h4>
                    <p className="text-xs opacity-90">
                      Actual classification: <strong>{scenario.isThreat ? "THREAT" : "SAFE"}</strong>
                      {scenario.threatType ? ` (${scenario.threatType})` : ""}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-white rounded-xl text-xs font-bold text-[#202124] border border-[#E8E6E1] shadow-2xs hover:shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Next Scenario</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* WHY */}
              <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1] text-xs space-y-1.5">
                <span className="font-bold text-[#202124] uppercase tracking-wider text-[11px] block">
                  Why?
                </span>
                <p className="text-[#5F6368] leading-relaxed">{scenario.why}</p>
              </div>

              {/* RED FLAGS */}
              {scenario.redFlags.length > 0 && (
                <div className="p-4 rounded-2xl bg-white border border-[#E8E6E1] text-xs space-y-2">
                  <span className="font-bold text-rose-700 uppercase tracking-wider text-[11px] block">
                    Red Flags to Spot:
                  </span>
                  <ul className="space-y-1.5">
                    {scenario.redFlags.map((flag, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[#5F6368]">
                        <span className="text-rose-500 font-bold shrink-0">&bull;</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* HOW TO RECOGNIZE */}
              <div className="p-4 rounded-2xl bg-[#F2F0FF]/50 border border-[#6D5DFB]/20 text-xs space-y-1">
                <span className="font-bold text-[#6D5DFB] uppercase tracking-wider text-[11px] block">
                  How to recognize similar attacks:
                </span>
                <p className="text-[#202124] leading-relaxed">{scenario.howToSpot}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
