"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  X,
  Send,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  Trash2,
  Minimize2,
  RefreshCw,
} from "lucide-react";
import { PredictResponse, URLAnalyzeResult, EmailAnalyzeResult, sendCopilotChat } from "@/lib/api";

interface Message {
  id: string;
  sender: "user" | "copilot";
  text: string;
  timestamp: string;
  provider?: string;
}

interface SecurityCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  currentRiskScore?: number;
  threatLevel?: string;
  textResult?: PredictResponse | null;
  urlResult?: URLAnalyzeResult | null;
  emailResult?: EmailAnalyzeResult | null;
  activeText?: string;
}

export default function SecurityCopilot({
  isOpen,
  onClose,
  currentRiskScore = 0,
  threatLevel = "SAFE",
  textResult,
  urlResult,
  emailResult,
  activeText = "",
}: SecurityCopilotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "copilot",
      text: "Hello! I am your SpamGuard Security Copilot powered by Google Gemini and local ML telemetry. I analyze the empirical findings from your scans to explain threat vectors, model weights, and defensive next steps. How can I assist your investigation?",
      timestamp: "Just now",
      provider: "Google Gemini 3.5 Flash",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Contextual answer generator grounded in active scan results (local fallback)
  const generateCopilotResponse = (query: string): string => {
    const q = query.toLowerCase();

    // 1. Why is this suspicious / why was it detected?
    if (q.includes("why is this suspicious") || q.includes("why was this detected") || q.includes("warning signs")) {
      if (textResult && textResult.is_spam) {
        const topWords = textResult.top_features.map((f) => `'${f.term}' (${f.weight > 0 ? "+" : ""}${f.weight})`).join(", ");
        const signals: string[] = [];
        if (textResult.linguistic_signals.urgency_detected) signals.push("artificial urgency triggers");
        if (textResult.linguistic_signals.financial_terms) signals.push("financial language");
        if (textResult.linguistic_signals.prize_language) signals.push("lottery/reward lure");
        if (textResult.linguistic_signals.has_urls) signals.push("embedded hyperlinks");

        return `This content was flagged with an Overall Risk of ${Math.round(textResult.spam_probability * 100)}/100.\n\n• Primary Driver: Strong TF-IDF correlation with known spam tokens: ${topWords || "unusual keyword density"}.\n• Linguistic Signals: ${signals.join(", ") || "None detected"}.\n• Model Certainty: ${(textResult.confidence * 100).toFixed(1)}% via ${textResult.model}.`;
      } else if (emailResult && emailResult.is_threat) {
        return `This email is categorized as ${emailResult.threat_level} (Risk ${emailResult.overall_risk_score}/100).\n\nKey reasons:\n• ${emailResult.reasons.join("\n• ")}`;
      } else if (urlResult && (urlResult.risk_level === "HIGH_RISK" || urlResult.risk_level === "CRITICAL")) {
        return `The target URL '${urlResult.url}' has a risk score of ${urlResult.risk_score}/100.\n\nFlagged signals:\n• ${urlResult.reasons.join("\n• ")}`;
      } else {
        return "The active content exhibits low threat markers (0-20 Risk). Our supervised models found conventional vocabulary distributions with no coercive manipulation signals.";
      }
    }

    // 2. What should I do?
    if (q.includes("what should i do") || q.includes("recommendation") || q.includes("how to respond")) {
      const risk = currentRiskScore;
      if (risk > 60) {
        return "Immediate Defensive Recommendations:\n1. Do NOT click any links or scan embedded QR codes.\n2. Do NOT provide passwords, bank account details, or OTPs.\n3. Do NOT reply directly to the sender.\n4. Mark this item as Junk/Phishing in your client.\n5. If the message claimed to be from your bank or work, verify by calling their official number independently.";
      } else if (risk > 30) {
        return "Precautionary Actions:\n1. Proceed with heightened vigilance.\n2. Check the sender's actual email domain, not just their display name.\n3. Verify requests for money or urgent favors out-of-band before taking action.";
      } else {
        return "The content appears benign. You can safely proceed with normal business, maintaining baseline email security hygiene.";
      }
    }

    // 3. Explain in simple language
    if (q.includes("simple language") || q.includes("simple words") || q.includes("explain simply")) {
      if (currentRiskScore > 50) {
        return "In plain terms: Whoever wrote this message is trying to trick or pressure you into giving away money or account access. They are creating fake urgency or pretending to be someone they are not. Ignore and delete it.";
      } else {
        return "In plain terms: This message looks like normal, everyday communication. There are no sneaky tricks or pressure tactics found in it.";
      }
    }

    // 4. Is the URL dangerous?
    if (q.includes("url") || q.includes("link") || q.includes("website")) {
      if (urlResult) {
        return `Inspected URL: ${urlResult.url}\nDomain: ${urlResult.domain}\nRisk Score: ${urlResult.risk_score}/100 (${urlResult.risk_level})\nReasons: ${urlResult.reasons.join(", ")}`;
      } else if (emailResult?.extracted_urls?.length) {
        const top = emailResult.extracted_urls[0];
        return `Found link in email: ${top.url}\nDomain: ${top.domain}\nRisk Score: ${top.risk_score}/100\nReasons: ${top.reasons.join(", ")}`;
      } else {
        return "No external URLs were detected in the currently analyzed payload.";
      }
    }

    // 5. Fallback context
    return `Current Session Context:\n• Active Threat Level: ${threatLevel}\n• Overall Risk Index: ${currentRiskScore}/100\n\nYou can ask me: 'Why is this suspicious?', 'What should I do?', 'Explain in simple language', or 'Is this URL dangerous?'`;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputValue;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: `${Date.now()}-u`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue("");
    setIsTyping(true);

    const scanContext = {
      risk_score: currentRiskScore,
      risk_level: threatLevel,
      classification: threatLevel.toLowerCase(),
      active_text: activeText,
      ml: textResult
        ? {
            risk_score: Math.round(textResult.spam_probability * 100),
            prediction: textResult.prediction,
            is_spam: textResult.is_spam,
            probability: textResult.spam_probability,
            model: textResult.model,
            top_features: textResult.top_features,
            linguistic_signals: textResult.linguistic_signals,
          }
        : { risk_score: currentRiskScore },
      email: emailResult
        ? {
            overall_risk: emailResult.overall_risk_score,
            threat_level: emailResult.threat_level,
            reasons: emailResult.reasons,
            header_analysis: emailResult.header_analysis,
          }
        : null,
      virustotal: urlResult
        ? {
            risk_score: urlResult.risk_score,
            url: urlResult.url,
            domain: urlResult.domain,
            reasons: urlResult.reasons,
          }
        : null,
    };

    try {
      const res = await sendCopilotChat(query, scanContext);
      const aiMsg: Message = {
        id: `${Date.now()}-ai`,
        sender: "copilot",
        text: res.response,
        provider: res.provider,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      // Graceful degradation: local grounded response
      const fallbackText = generateCopilotResponse(query);
      const aiMsg: Message = {
        id: `${Date.now()}-ai`,
        sender: "copilot",
        text: fallbackText,
        provider: "SpamGuard Offline Reasoning",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = [
    "Why is this suspicious?",
    "What should I do?",
    "Explain this in simple language.",
    "Is this URL dangerous?",
    "What are the strongest warning signs?",
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white border-l border-[#E8E6E1] shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">
      {/* Drawer Top Header */}
      <div className="px-5 py-4 border-b border-[#E8E6E1] flex items-center justify-between bg-[#FAF9F6]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white border border-[#E8E6E1] flex items-center justify-center text-[#6D5DFB] shadow-2xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#202124]">
              Security Copilot
            </h3>
            <span className="text-[10px] text-[#5F6368] flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38C9A7]" />
              <span>Grounded in Active Inference</span>
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-[#E8E6E1] text-[#5F6368] hover:text-[#202124] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Active Scan Indicator Strip */}
      <div className="px-5 py-2.5 bg-white border-b border-[#E8E6E1] flex items-center justify-between text-xs font-mono">
        <span className="text-[#5F6368]">Current Target:</span>
        <span className={`px-2 py-0.5 rounded-full font-bold border text-[11px] ${
          currentRiskScore > 60
            ? "bg-rose-50 text-rose-800 border-rose-200"
            : currentRiskScore > 30
            ? "bg-amber-50 text-amber-800 border-amber-200"
            : "bg-emerald-50 text-emerald-800 border-emerald-200"
        }`}>
          Risk {currentRiskScore}/100 &bull; {threatLevel}
        </span>
      </div>

      {/* Conversation Thread */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
        {messages.map((m) => {
          const isUser = m.sender === "user";
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-2xl whitespace-pre-line leading-relaxed ${
                  isUser
                    ? "bg-[#6D5DFB] text-white rounded-tr-xs"
                    : "bg-[#FAF9F6] border border-[#E8E6E1] text-[#202124] rounded-tl-xs shadow-2xs"
                }`}
              >
                {m.text}
              </div>
              <div className="flex items-center gap-2 mt-1 px-1">
                <span className="text-[10px] text-[#5F6368] font-mono">
                  {m.timestamp}
                </span>
                {m.provider && (
                  <span className="text-[9px] font-mono text-[#6D5DFB] bg-[#F2F0FF] px-1.5 py-0.5 rounded border border-[#E8E6E1]">
                    {m.provider}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1] text-[#5F6368] text-xs max-w-[80%] animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#6D5DFB]" />
            <span>Copilot is reasoning over scan context...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="p-3 border-t border-[#E8E6E1] bg-[#FAF9F6] space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#5F6368] block">
          Suggested Questions:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.slice(0, 3).map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 text-[11px] bg-white hover:bg-[#F2F0FF] hover:text-[#6D5DFB] border border-[#E8E6E1] rounded-lg text-[#202124] transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-[#E8E6E1] bg-white flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage();
          }}
          placeholder="Ask Copilot about this threat..."
          className="flex-1 p-2.5 bg-[#FAF9F6] border border-[#E8E6E1] rounded-xl text-xs text-[#202124] focus:bg-white focus:outline-none focus:border-[#6D5DFB]"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputValue.trim()}
          className="p-2.5 bg-[#6D5DFB] hover:bg-[#5B4CE0] text-white rounded-xl disabled:opacity-40 transition-colors cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
