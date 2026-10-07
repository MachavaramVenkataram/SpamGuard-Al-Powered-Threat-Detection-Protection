"use client";

import React, { useState } from "react";
import {
  AlertOctagon,
  X,
  ExternalLink,
  KeyRound,
  CreditCard,
  Download,
  Mail,
  ShieldAlert,
  CheckCircle2,
  PhoneCall,
  Lock,
  ArrowRight,
} from "lucide-react";

interface AlreadyClickedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type IncidentType = "link" | "password" | "financial" | "download" | "reply";

const INCIDENTS: Array<{
  id: IncidentType;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  urgency: "CRITICAL" | "HIGH" | "MEDIUM";
  steps: string[];
  doNots: string[];
  safeChannels: string;
}> = [
  {
    id: "link",
    title: "I clicked the link",
    icon: ExternalLink,
    description: "You opened an unverified link or QR destination in your browser.",
    urgency: "HIGH",
    steps: [
      "Immediately close the browser tab or window where the link opened.",
      "Do NOT enter any username, password, PIN, or verification code on that page.",
      "Clear your browser cookies and site cache for recently opened unverified sites.",
      "Check your downloads folder to verify no hidden file or script was silently downloaded.",
      "Ensure your device operating system and browser security updates are up to date.",
    ],
    doNots: [
      "Do not stay on the webpage or click any popups claiming 'Your system is infected'.",
      "Do not enter two-factor authentication (2FA) SMS codes.",
      "Do not grant permission if the site asks to 'Enable Notifications' or 'Install Extension'.",
    ],
    safeChannels: "If you expected an alert from an organization (e.g. PayPal, Bank, Courier), open their official mobile app or type their known URL into a fresh browser tab manually.",
  },
  {
    id: "password",
    title: "I entered my password / credentials",
    icon: KeyRound,
    description: "You submitted your username, password, or login credentials on a suspicious site.",
    urgency: "CRITICAL",
    steps: [
      "Navigate immediately to the GENUINE official service website on a clean tab.",
      "Change your password right away using a strong, unique passphrase (at least 14 characters).",
      "If you reuse this password on any other service (email, banking, shopping), change it there too.",
      "Revoke active login sessions and app permissions in your genuine account security settings.",
      "Enable hardware security keys or authenticator-app 2FA (TOTP) instead of SMS 2FA if supported.",
    ],
    doNots: [
      "Do not use variations of your old password.",
      "Do not communicate with the attackers or click 'Cancel' buttons on the fake login page.",
    ],
    safeChannels: "Always look for the genuine organization domain and bookmark your legitimate login pages for future access.",
  },
  {
    id: "financial",
    title: "I entered financial information / card / OTP",
    icon: CreditCard,
    description: "You typed debit/credit card numbers, CVV, bank routing, or one-time passcodes.",
    urgency: "CRITICAL",
    steps: [
      "Contact your bank or card issuer's fraud hotline immediately using the number on the back of your card.",
      "Request an immediate freeze or cancellation of the compromised card.",
      "Inform the fraud representative about any submitted OTPs or wire transfers so they can halt unauthorized clearances.",
      "Review your recent transaction history for unauthorized test micro-charges.",
      "File a formal report with your local cyber fraud authority (e.g. FTC at reportfraud.ftc.gov, or IC3).",
    ],
    doNots: [
      "Do not call phone numbers provided inside the suspicious email or message.",
      "Do not authorize any 'reversal' or 'refund' payment instructions over phone or chat.",
    ],
    safeChannels: "Only call the verified contact number printed on the back of your physical payment card or inside your official banking application.",
  },
  {
    id: "download",
    title: "I downloaded or ran a file",
    icon: Download,
    description: "You downloaded an email attachment, installer, archive, or script (.exe, .zip, .scr, .iso).",
    urgency: "CRITICAL",
    steps: [
      "Disconnect your device from Wi-Fi and ethernet immediately to prevent malware command-and-control communication.",
      "Do NOT open, run, or extract the downloaded file. Delete it from your Downloads folder and empty your Recycle Bin.",
      "Run a full system antimalware scan (Windows Defender or trusted endpoint protection).",
      "Check your browser extensions and recent Task Manager background processes for unfamiliar names.",
      "Reboot in Safe Mode if your device exhibits unexpected CPU spikes or popup windows.",
    ],
    doNots: [
      "Do not enable macros in Microsoft Office if prompted ('Enable Editing' / 'Enable Content').",
      "Do not connect external backup USB drives until the system is confirmed clean.",
    ],
    safeChannels: "Only download software and files from official vendor websites or verified app stores.",
  },
  {
    id: "reply",
    title: "I replied to the sender",
    icon: Mail,
    description: "You sent a response via email, SMS, or chat message to the suspicious sender.",
    urgency: "MEDIUM",
    steps: [
      "Stop all further communication immediately. Do not send follow-up apologies or confrontations.",
      "Mark the sender and thread as Phishing / Spam in your email or messaging client.",
      "Expect an increase in targeted follow-up social engineering attempts now that your address is flagged active.",
      "Warn family or colleagues if the attacker attempted corporate or personal impersonation.",
      "Set up email filters to block messages from that sender domain.",
    ],
    doNots: [
      "Do not negotiate or click links the sender sends in response.",
      "Do not share identity documents, photos, or personal schedules.",
    ],
    safeChannels: "Block the number or email address directly within your messaging client.",
  },
];

export default function AlreadyClickedModal({ isOpen, onClose }: AlreadyClickedModalProps) {
  const [activeTab, setActiveTab] = useState<IncidentType>("link");

  if (!isOpen) return null;

  const incident = INCIDENTS.find((i) => i.id === activeTab) || INCIDENTS[0];
  const Icon = incident.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202124]/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-[#E8E6E1] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#E8E6E1] bg-[#FFF8F8] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-[#202124]">
                  Incident Response: I Already Clicked
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  PROTECT MODE
                </span>
              </div>
              <p className="text-xs text-[#5F6368] mt-0.5">
                Stay calm. Follow practical, step-by-step containment instructions based on what happened.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#5F6368] hover:text-[#202124] hover:bg-white/80 transition-colors cursor-pointer"
            aria-label="Close Incident Response"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Incident Type Selector Tabs */}
        <div className="p-4 bg-[#FAF9F6] border-b border-[#E8E6E1] overflow-x-auto flex gap-2">
          {INCIDENTS.map((item) => {
            const ItemIcon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-[#202124] text-white shadow-xs"
                    : "bg-white text-[#5F6368] hover:text-[#202124] border border-[#E8E6E1]"
                }`}
              >
                <ItemIcon className="w-3.5 h-3.5" />
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Situation Summary */}
          <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-[#E8E6E1] flex items-center justify-center text-[#6D5DFB]">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#202124]">{incident.title}</h4>
                <p className="text-xs text-[#5F6368]">{incident.description}</p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border ${
                incident.urgency === "CRITICAL"
                  ? "bg-rose-50 text-rose-800 border-rose-300"
                  : incident.urgency === "HIGH"
                  ? "bg-amber-50 text-amber-800 border-amber-300"
                  : "bg-slate-50 text-slate-700 border-slate-300"
              }`}
            >
              URGENCY: {incident.urgency}
            </span>
          </div>

          {/* Action Steps */}
          <div>
            <h5 className="text-xs font-bold text-[#202124] uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Immediate Protective Steps</span>
            </h5>
            <ol className="space-y-2.5 text-xs text-[#202124]">
              {incident.steps.map((step, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#E8E6E1] shadow-2xs"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Things NOT to Do */}
          <div>
            <h5 className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>What NOT to Do</span>
            </h5>
            <ul className="space-y-1.5 text-xs text-[#5F6368]">
              {incident.doNots.map((d, idx) => (
                <li key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-[#FFF8F8] border border-rose-100">
                  <span className="text-rose-600 font-bold shrink-0">✕</span>
                  <span className="leading-snug">{d}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Safe Alternative / Independent Verification */}
          <div className="p-4 rounded-2xl bg-[#F2F0FF]/60 border border-[#6D5DFB]/20">
            <h5 className="text-xs font-bold text-[#6D5DFB] uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Safer Way to Verify</span>
            </h5>
            <p className="text-xs text-[#202124] leading-relaxed">
              {incident.safeChannels}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E8E6E1] bg-[#FAF9F6] flex items-center justify-between">
          <span className="text-[11px] text-[#5F6368]">
            SpamGuard provides safety guidance. For confirmed banking or identity theft, consult official institutions.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#202124] hover:bg-black text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
