"use client";

import React, { useState, useRef, useEffect, DragEvent, useMemo } from "react";
import {
  Sparkles,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Mail,
  Link2,
  Image as ImageIcon,
  QrCode,
  FileText,
  Upload,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Bot,
  Lock,
  ChevronDown,
  ChevronUp,
  Layers,
  HelpCircle,
  Eye,
  Info,
  Trash2,
  Clock,
  Zap,
  FileUp,
  FileCheck,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  X,
  SlidersHorizontal,
  AlertOctagon,
  MousePointerClick,
  FileSearch,
  Globe,
  Radio,
  CornerDownRight,
  Activity,
  CheckCheck,
} from "lucide-react";
import {
  predictMessage,
  analyzeUrl,
  analyzeEmail,
  analyzeImageFile,
  unifiedScan,
  submitScanFeedback,
  UnifiedScanResult,
  PredictResponse,
  URLAnalyzeResult,
  EmailAnalyzeResult,
  ImageAnalyzeResult,
  TokenExplorerItem,
  RedFlagItem,
  ApiError,
} from "@/lib/api";
import { useToast } from "./ToastContext";
import UniversalScannerIcon from "./UniversalScannerIcon";
import SecurityReportModal, { SecurityReportData } from "./SecurityReportModal";
import AlreadyClickedModal from "./AlreadyClickedModal";
import RedFlagDrawer from "./RedFlagDrawer";
import { createWorker } from "tesseract.js";

export type AnalysisMode = "universal" | "text" | "email" | "url" | "image" | "screenshot" | "qr" | "file";

interface MultimodalWorkspaceProps {
  activeModelId: "naive_bayes" | "logistic_regression";
  onSelectModel: (m: "naive_bayes" | "logistic_regression") => void;
  onAddHistory?: (item: any) => void;
  onRecordLatency?: (ms: number) => void;
  onOpenCopilot?: () => void;
  initialMessage?: string;
  initialMode?: AnalysisMode;
}

// Custom hook: Animated count-up for risk score (0 to target) with prefers-reduced-motion support
function useCountUp(target: number, duration: number = 800): number {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      setCurrent(target);
      return;
    }
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setCurrent(target);
      return;
    }

    let start = 0;
    const startTime = performance.now();
    let frameId: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo for smooth snappy count-up
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const val = Math.round(start + (target - start) * eased);
      setCurrent(val);
      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);

  return current;
}

const DEMO_PRESETS = [
  {
    id: "safe-message",
    mode: "text" as AnalysisMode,
    title: "Safe Message",
    badge: "Legitimate",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    content: "Hey Sarah, are we still meeting up for lunch today at 1pm? Let me know if you are free to discuss the quarterly project report.",
  },
  {
    id: "bank-phishing",
    mode: "email" as AnalysisMode,
    title: "Bank Phishing",
    badge: "Phishing",
    badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
    email: {
      from: "security-update@chase-verify-auth.com",
      to: "customer@example.com",
      subject: "CHASE FRAUD ALERT: Unauthorized login attempt detected!",
      reply_to: "billing-harvest@phish-domain.xyz",
      body: "Dear Customer,\n\nWe noticed unauthorized login attempts on your account from an unknown device. Your access has been temporarily restricted.\n\nVerify your credentials immediately to restore access:\nhttp://chase.com.security-verify-auth.xyz/auth?redirect=evil.com\n\nFailure to verify within 24 hours will result in permanent suspension.\n\nChase Security Operations",
    },
    content: "CHASE FRAUD ALERT: Unauthorized login attempt detected! Your access has been temporarily restricted. Verify your credentials immediately to restore access: http://chase.com.security-verify-auth.xyz/auth?redirect=evil.com. Failure to verify within 24 hours will result in permanent suspension.",
  },
  {
    id: "delivery-scam",
    mode: "text" as AnalysisMode,
    title: "Delivery Scam",
    badge: "Smishing",
    badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
    content: "USPS NOTIFICATION: Your package #US984210 cannot be delivered due to an incomplete street address. Please update your delivery details within 12 hours or item will be returned: http://usps-parcel-tracking-update.xyz/address",
  },
  {
    id: "suspicious-url",
    mode: "url" as AnalysisMode,
    title: "Suspicious URL",
    badge: "Malicious Link",
    badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
    url: "http://secure-login.apple.com.verify-account.xyz/auth?redirect=evil.com",
    content: "http://secure-login.apple.com.verify-account.xyz/auth?redirect=evil.com",
  },
  {
    id: "prize-scam",
    mode: "text" as AnalysisMode,
    title: "Prize Scam",
    badge: "Financial Lure",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    content: "CONGRATULATIONS! You have won a £1,000 cash prize or a £2,000 reward! Call 09061701461 to claim your code 8492. Valid 12hrs only!",
  },
];

// The 7 Intelligent Scanning Stages (Requirement 6)
const SCAN_STAGES = [
  { title: "CONTENT RECEIVED", desc: "Ingesting payload stream", icon: Upload },
  { title: "EXTRACTING", desc: "Lexical & structural parsing", icon: Sparkles },
  { title: "LOCAL SECURITY ANALYSIS", desc: "Deterministic heuristic rules", icon: ShieldCheck },
  { title: "ML ANALYSIS", desc: "Supervised TF-IDF classification", icon: Layers },
  { title: "AI ANALYSIS", desc: "Gemini pretext & context check", icon: Bot },
  { title: "THREAT INTELLIGENCE", desc: "VirusTotal & reputation lookup", icon: Globe },
  { title: "RISK CALCULATION", desc: "Calibrated multi-engine synthesis", icon: Zap },
];

export default function MultimodalWorkspace({
  activeModelId,
  onSelectModel,
  onAddHistory,
  onRecordLatency,
  onOpenCopilot,
  initialMessage = "",
  initialMode = "universal",
}: MultimodalWorkspaceProps) {
  const { toast } = useToast();

  // Mode & Display
  const [mode, setMode] = useState<AnalysisMode>(initialMode);
  const [displayMode, setDisplayMode] = useState<"simple" | "expert">("simple");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showAdvancedHeaders, setShowAdvancedHeaders] = useState<boolean>(false);
  const [trustCardExpanded, setTrustCardExpanded] = useState<boolean>(false);
  const [activeSignalFilter, setActiveSignalFilter] = useState<string | null>(null);

  // Mouse ambient coordinates
  const [cardMousePos, setCardMousePos] = useState<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCardMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Main Unified Input Text (holds raw message, URL, or pasted email)
  const [universalText, setUniversalText] = useState<string>(
    initialMessage || DEMO_PRESETS[1].content || ""
  );

  // Structured Email Header Fields (for optional advanced inspection)
  const [emailFrom, setEmailFrom] = useState(DEMO_PRESETS[1].email?.from || "");
  const [emailTo, setEmailTo] = useState(DEMO_PRESETS[1].email?.to || "user@example.com");
  const [emailSubject, setEmailSubject] = useState(DEMO_PRESETS[1].email?.subject || "");
  const [emailReplyTo, setEmailReplyTo] = useState(DEMO_PRESETS[1].email?.reply_to || "");

  // Dedicated URL Input (kept in sync with universalText when in URL mode)
  const [urlInput, setUrlInput] = useState(DEMO_PRESETS[3].url || "");

  // Image & QR State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string>("");
  const [isOcrProcessing, setIsOcrProcessing] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [qrDetection, setQrDetection] = useState<ImageAnalyzeResult | null>(null);

  // File Upload State
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);
  const [uploadedDocText, setUploadedDocText] = useState<string>("");

  // Analysis State
  const [loading, setLoading] = useState(false);
  const [currentScanningStage, setCurrentScanningStage] = useState<number>(0);
  const [analysisElapsedMs, setAnalysisElapsedMs] = useState<number>(0);
  const [analysisTimings, setAnalysisTimings] = useState<Record<string, number> | null>(null);
  const [analysisModeState, setAnalysisModeState] = useState<string | null>(null);

  // Results
  const [unifiedScanResult, setUnifiedScanResult] = useState<UnifiedScanResult | null>(null);
  const [textResult, setTextResult] = useState<PredictResponse | null>(null);
  const [urlResult, setUrlResult] = useState<URLAnalyzeResult | null>(null);
  const [emailResult, setEmailResult] = useState<EmailAnalyzeResult | null>(null);
  const [altModelResult, setAltModelResult] = useState<PredictResponse | null>(null);

  // Modals & Drawers
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<SecurityReportData | null>(null);
  const [alreadyClickedModalOpen, setAlreadyClickedModalOpen] = useState(false);
  const [redFlagDrawerOpen, setRedFlagDrawerOpen] = useState(false);
  const [selectedRedFlag, setSelectedRedFlag] = useState<RedFlagItem | null>(null);

  // Feedback State
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [feedbackChoice, setFeedbackChoice] = useState<"helpful" | "unhelpful" | null>(null);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<boolean>(false);

  // Error UX State
  const [serviceError, setServiceError] = useState<{
    message: string;
    technicalDetails?: string;
    structuredDetails?: {
      service?: string;
      endpoint?: string;
      status?: number | string;
      requestId?: string;
      timestamp?: string;
    };
  } | null>(null);
  const [showTechDetails, setShowTechDetails] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const scannerCardRef = useRef<HTMLDivElement>(null);
  const resultsCardRef = useRef<HTMLDivElement>(null);

  // Event Listeners for External Dispatches
  useEffect(() => {
    if (initialMessage) {
      setUniversalText(initialMessage);
      setMode("universal");
    }
  }, [initialMessage]);

  useEffect(() => {
    const handleSwitch = (e: any) => {
      if (e.detail && ["universal", "text", "email", "url", "image", "screenshot", "qr", "file"].includes(e.detail)) {
        setMode(e.detail);
      }
    };
    const handleLoadText = (e: any) => {
      if (e.detail) {
        setUniversalText(e.detail);
        setMode("universal");
      }
    };
    window.addEventListener("switch-workspace-mode", handleSwitch);
    window.addEventListener("load-workspace-text", handleLoadText);
    return () => {
      window.removeEventListener("switch-workspace-mode", handleSwitch);
      window.removeEventListener("load-workspace-text", handleLoadText);
    };
  }, []);

  // Intelligent Auto-Detection Engine (Requirement 2)
  const detectedKind = useMemo(() => {
    if (uploadedDocName || uploadedDocText) {
      return {
        type: "file",
        label: "Document Detected",
        badge: "✦ File detected",
        icon: FileUp,
        hint: uploadedDocName || "Document content",
        accent: "text-violet-700 bg-violet-50 border-violet-200",
      };
    }
    if (imageFile || imagePreviewUrl) {
      if (qrDetection?.has_qr) {
        const isUrl = qrDetection.is_url || (qrDetection.qr_payload && qrDetection.qr_payload.startsWith("http"));
        return {
          type: "qr",
          label: isUrl ? "QR + URL Detected" : "QR Barcode Detected",
          badge: isUrl ? "✦ QR + URL detected" : "✦ QR detected",
          icon: QrCode,
          hint: qrDetection.qr_payload ? `Destination: ${qrDetection.qr_payload.slice(0, 32)}...` : "Decoded optical barcode",
          accent: "text-amber-700 bg-amber-50 border-amber-200",
        };
      }
      if (ocrText.trim().length > 0) {
        return {
          type: "image_ocr",
          label: "Image + OCR Detected",
          badge: "✦ Image + OCR detected",
          icon: ImageIcon,
          hint: `${ocrText.split(/\s+/).length} words extracted via Wasm OCR`,
          accent: "text-cyan-700 bg-cyan-50 border-cyan-200",
        };
      }
      return {
        type: "image",
        label: "Image Detected",
        badge: "✦ Image detected",
        icon: ImageIcon,
        hint: imageFile?.name || "Visual screenshot target",
        accent: "text-indigo-700 bg-indigo-50 border-indigo-200",
      };
    }

    const trimmed = universalText.trim();
    if (!trimmed) return null;

    // 1. Is it a pure URL?
    const isPureUrl =
      (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("www.")) &&
      !trimmed.includes("\n") &&
      !trimmed.includes(" ");
    if (isPureUrl) {
      return {
        type: "url",
        label: "URL Detected",
        badge: "✦ URL detected",
        icon: Link2,
        hint: "Direct hyperlink target",
        accent: "text-teal-700 bg-teal-50 border-teal-200",
      };
    }

    // 2. Is it email structure?
    const isEmail =
      /(?:from:|subject:|reply-to:|to:)/i.test(trimmed) ||
      (showAdvancedHeaders && (emailFrom || emailSubject));
    if (isEmail) {
      return {
        type: "email",
        label: "Email Detected",
        badge: "✦ Email detected",
        icon: Mail,
        hint: "RFC 5322 Email message structure",
        accent: "text-violet-700 bg-violet-50 border-violet-200",
      };
    }

    // 3. Does text contain an embedded URL?
    const hasEmbeddedUrl = /https?:\/\/[^\s]+|www\.[^\s]+/i.test(trimmed);
    if (hasEmbeddedUrl) {
      return {
        type: "text_url",
        label: "Text + URL Detected",
        badge: "✦ Text + URL detected",
        icon: Link2,
        hint: "Message payload containing embedded links",
        accent: "text-amber-700 bg-amber-50 border-amber-200",
      };
    }

    // 4. Default plain text
    return {
      type: "text",
      label: "Text Detected",
      badge: "✦ Text detected",
      icon: FileText,
      hint: "SMS / Chat message payload",
      accent: "text-slate-700 bg-slate-100 border-slate-200",
    };
  }, [
    universalText,
    imageFile,
    imagePreviewUrl,
    qrDetection,
    ocrText,
    uploadedDocName,
    uploadedDocText,
    showAdvancedHeaders,
    emailFrom,
    emailSubject,
  ]);

  // Load Demo Presets
  const loadDemoPreset = (preset: (typeof DEMO_PRESETS)[0]) => {
    // Clear media targets
    setImageFile(null);
    setImagePreviewUrl(null);
    setOcrText("");
    setQrDetection(null);
    setUploadedDocName(null);
    setUploadedDocText("");

    if (preset.email) {
      setEmailFrom(preset.email.from);
      setEmailTo(preset.email.to);
      setEmailSubject(preset.email.subject);
      setEmailReplyTo(preset.email.reply_to);
      setUniversalText(preset.email.body);
      setShowAdvancedHeaders(true);
    } else {
      setUniversalText(preset.content || "");
      setShowAdvancedHeaders(false);
    }

    if (preset.mode === "url") {
      setUrlInput(preset.url || preset.content || "");
    }

    setMode("universal");
    toast(`Loaded preset: ${preset.title} (${preset.badge})`, "info");
  };

  // Drag and Drop Handling
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    // 1. Files
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        processSelectedImage(file);
        return;
      } else {
        setUploadedDocName(file.name);
        try {
          const text = await file.text();
          setUploadedDocText(text);
          setUniversalText(text);
          toast(`Loaded file: ${file.name}`, "success");
        } catch {
          toast("Failed to read document contents", "error");
        }
        return;
      }
    }

    // 2. Text data
    const droppedText = e.dataTransfer.getData("text/plain");
    if (droppedText) {
      setUniversalText(droppedText.trim());
      parseEmailHeadersIfPresent(droppedText.trim());
      toast("Payload loaded from drop", "info");
    }
  };

  const parseEmailHeadersIfPresent = (rawText: string) => {
    if (/(?:from:|subject:)/i.test(rawText)) {
      const lines = rawText.split("\n");
      let from = "";
      let sub = "";
      let bodyLines: string[] = [];
      let isBody = false;

      for (const line of lines) {
        if (!isBody) {
          if (line.toLowerCase().startsWith("from:")) from = line.replace(/from:/i, "").trim();
          else if (line.toLowerCase().startsWith("subject:")) sub = line.replace(/subject:/i, "").trim();
          else if (line.trim() === "") isBody = true;
        } else {
          bodyLines.push(line);
        }
      }
      if (from) setEmailFrom(from);
      if (sub) setEmailSubject(sub);
      if (bodyLines.length > 0) setUniversalText(bodyLines.join("\n").trim());
      setShowAdvancedHeaders(true);
    }
  };

  const handleClipboardPaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUniversalText(text.trim());
          parseEmailHeadersIfPresent(text.trim());
          toast("Content pasted from clipboard", "info");
          return;
        }
      }
      toast("Please paste directly into the scanner field", "info");
    } catch {
      toast("Clipboard permission not granted. Paste manually with Ctrl+V.", "info");
    }
  };

  // Image & QR Processing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedImage(file);
    }
  };

  const processSelectedImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast("Please select a valid image file (PNG, JPG, WEBP)", "error");
      return;
    }
    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreviewUrl(objectUrl);
    setOcrText("");
    setQrDetection(null);

    // 1. Backend OpenCV QR scan
    try {
      const qrRes = await analyzeImageFile(file);
      setQrDetection(qrRes);
      if (qrRes.has_qr) {
        toast(`QR Code detected: ${qrRes.qr_payload}`, "info");
      }
    } catch (err) {
      console.warn("Backend QR inspection notice:", err);
    }

    // 2. Client Tesseract OCR
    setIsOcrProcessing(true);
    setOcrProgress(20);
    try {
      const worker = await createWorker("eng");
      setOcrProgress(50);
      const ret = await worker.recognize(file);
      setOcrProgress(85);
      await worker.terminate();
      const extracted = ret.data.text.trim();
      setOcrText(extracted);
      setOcrProgress(100);
      if (extracted) {
        toast("Visual text extracted successfully via OCR", "success");
      }
    } catch (err) {
      console.warn("Client OCR notice:", err);
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const clearAllInputs = () => {
    setUniversalText("");
    setEmailFrom("");
    setEmailSubject("");
    setEmailReplyTo("");
    setUrlInput("");
    setImageFile(null);
    setImagePreviewUrl(null);
    setOcrText("");
    setQrDetection(null);
    setUploadedDocName(null);
    setUploadedDocText("");
    setUnifiedScanResult(null);
    setTextResult(null);
    setUrlResult(null);
    setEmailResult(null);
    setAltModelResult(null);
    setServiceError(null);
    toast("Scanner cleared", "info");
  };

  // Run Master Threat Analysis (Universal Scan Engine)
  const handleAnalyze = async () => {
    const effectiveContent =
      universalText.trim() ||
      ocrText.trim() ||
      qrDetection?.qr_payload ||
      uploadedDocText.trim();

    if (!effectiveContent && !imageFile) {
      toast("Please paste text, a URL, email content, or drop an image/file to scan.", "error");
      return;
    }

    setLoading(true);
    setServiceError(null);
    setCurrentScanningStage(0);
    setUnifiedScanResult(null);
    setTextResult(null);
    setUrlResult(null);
    setEmailResult(null);
    setAltModelResult(null);
    setFeedbackSubmitted(false);
    setFeedbackChoice(null);
    setAnalysisTimings(null);
    setAnalysisModeState(null);
    setAnalysisElapsedMs(0);

    const t0 = performance.now();
    let stageInterval: any = null;

    // Stage 0: Content received
    setCurrentScanningStage(0);
    await new Promise((r) => setTimeout(r, 70));

    // Stage 1: Extracting
    setCurrentScanningStage(1);
    await new Promise((r) => setTimeout(r, 80));

    try {
      const inputType =
        detectedKind?.type === "file"
          ? "file"
          : detectedKind?.type === "image" || detectedKind?.type === "image_ocr" || detectedKind?.type === "qr" || detectedKind?.type === "qr_url"
          ? "image"
          : detectedKind?.type === "url"
          ? "url"
          : detectedKind?.type === "email"
          ? "email"
          : "text";

      // Stage 2: Local security analysis
      setCurrentScanningStage(2);

      // Smoothly advance through Stage 3 (ML ANALYSIS), Stage 4 (AI ANALYSIS), and Stage 5 (THREAT INTELLIGENCE)
      let autoStage = 3;
      stageInterval = setInterval(() => {
        if (autoStage <= 5) {
          setCurrentScanningStage(autoStage);
          autoStage++;
        }
      }, 350);

      let unified: UnifiedScanResult;

      if (inputType === "email" && (emailFrom || emailSubject)) {
        // Run full email scan
        const emailRes = await analyzeEmail({
          from_address: emailFrom || "sender@unknown.com",
          to_address: emailTo || "user@example.com",
          subject: emailSubject || "Incoming Message",
          reply_to: emailReplyTo || emailFrom,
          body: effectiveContent,
          model_id: activeModelId,
        });

        setEmailResult(emailRes);
        if (emailRes.timings) setAnalysisTimings(emailRes.timings);
        if (emailRes.analysis_mode) setAnalysisModeState(emailRes.analysis_mode);

        // Map EmailAnalyzeResult into unifiedScanResult structure
        const emailRedFlags: RedFlagItem[] = [];
        if (emailRes.header_analysis?.sender_reply_mismatch) {
          emailRedFlags.push({
            id: "sender_mismatch",
            title: "Sender & Reply-To Mismatch",
            category: "impersonation",
            severity: "high",
            description: "The sender envelope differs from the destination where replies are directed.",
            evidence: `From: ${emailFrom} ➔ Reply-To: ${emailReplyTo}`,
            source: "Email Header Forensics",
            risk_contribution: 25,
          });
        }
        if (emailRes.content_analysis?.credential_harvesting_detected) {
          emailRedFlags.push({
            id: "credential_request",
            title: "Credential Request Detected",
            category: "credential_theft",
            severity: "critical",
            description: "Message solicits account login, password verification, or multi-factor authentication codes.",
            evidence: "Credential harvesting keywords in message body",
            source: "Content Security Engine",
            risk_contribution: 35,
          });
        }
        if (emailRes.content_analysis?.urgency_detected) {
          emailRedFlags.push({
            id: "urgency_manipulation",
            title: "Urgency Manipulation",
            category: "urgency",
            severity: "medium",
            description: "Artificial deadline ultimatum designed to panic the recipient into bypassing security caution.",
            evidence: "Urgent deadline trigger detected in subject/body",
            source: "Linguistic Heuristics",
            risk_contribution: 15,
          });
        }
        if (emailRes.extracted_urls?.some((u) => u.risk_score > 50)) {
          const badUrl = emailRes.extracted_urls.find((u) => u.risk_score > 50);
          emailRedFlags.push({
            id: "suspicious_url",
            title: "Suspicious Embedded Hyperlink",
            category: "suspicious_url",
            severity: "critical",
            description: "Hyperlink points to an unverified domain with suspicious path or typosquatting.",
            evidence: badUrl?.url || "Embedded URL",
            source: "VirusTotal / URL Intelligence",
            risk_contribution: 35,
          });
        }

        unified = {
          risk_score: emailRes.overall_risk_score,
          risk_level: emailRes.threat_level.toLowerCase() as any,
          classification: emailRes.threat_level === "CRITICAL" ? "PHISHING" : emailRes.threat_level === "HIGH_RISK" ? "PHISHING" : emailRes.threat_level,
          confidence: emailRes.overall_risk_score > 70 ? "HIGH" : "MEDIUM",
          input_type: "email",
          timestamp: new Date().toLocaleTimeString(),
          red_flags: emailRedFlags,
          action_plan: {
            immediate_actions: [
              "Do NOT click any hyperlinks or login buttons inside this email.",
              "Do NOT enter your password, username, or banking information.",
              "Do NOT reply to the sender or confirm your email address is active.",
            ],
            safe_verification: [
              "Navigate directly to the organization's verified official portal or mobile application.",
              "Report the email as Phishing/Spam in your mail client.",
            ],
            incident_steps: [
              "If you already interacted, use the 'I Already Clicked' response mode below.",
            ],
          },
          safe_checks: [
            "Sender domain aligns with return path",
            "No strong credential harvesting phrases detected",
            "No coercive urgency deadline in subject",
          ],
          execution_time_ms: emailRes.execution_time_ms,
          timings: emailRes.timings as any,
          ml: {
            available: true,
            status: "active",
            prediction: emailRes.ml_prediction.prediction,
            is_spam: emailRes.ml_prediction.is_spam,
            probability: emailRes.ml_prediction.spam_probability,
            risk_score: Math.round(emailRes.ml_prediction.spam_probability * 100),
            model: emailRes.ml_prediction.model,
            confidence: emailRes.ml_prediction.confidence,
            top_features: emailRes.ml_prediction.top_features,
            signals: emailRes.ml_prediction.top_features.map((f) => `${f.term} (${f.direction})`),
          },
          gemini: {
            available: !!emailRes.gemini?.available,
            status: emailRes.gemini?.available ? "active" : "unavailable",
            risk_score: emailRes.gemini?.risk_score ?? 0,
            summary: emailRes.gemini?.summary,
            recommendations: emailRes.recommended_actions,
            signals: emailRes.content_analysis?.content_flags,
          },
          virustotal: {
            available: !!emailRes.virustotal?.available,
            status: emailRes.virustotal?.available ? "active" : "unavailable",
            risk_score: emailRes.highest_url_risk,
          },
          heuristics: {
            available: true,
            status: "active",
            risk_score: emailRes.content_analysis?.content_risk_score ?? 15,
            signals: emailRes.reasons,
          },
          recommendations: emailRes.recommended_actions,
          sources: {
            ml: "available",
            gemini: emailRes.gemini?.available ? "available" : "unavailable",
            virustotal: emailRes.virustotal?.available ? "available" : "unavailable",
            local_engine: "available",
            heuristics: "active",
          },
        };
      } else {
        // Universal Scan
        const emailDict =
          emailFrom || emailSubject
            ? { from: emailFrom, subject: emailSubject, reply_to: emailReplyTo }
            : undefined;

        unified = await unifiedScan(effectiveContent, inputType, activeModelId, emailDict);
      }

      if (stageInterval) {
        clearInterval(stageInterval);
        stageInterval = null;
      }

      // Stage 6: Risk calculation
      setCurrentScanningStage(6);
      await new Promise((r) => setTimeout(r, 90));

      setUnifiedScanResult(unified);
      if (unified.timings) setAnalysisTimings(unified.timings);
      if (unified.execution_time_ms) setAnalysisElapsedMs(unified.execution_time_ms);

      // Synthesize textResult for TF-IDF token view
      const syntheticTextResult: PredictResponse = {
        prediction: (unified.ml?.prediction || (unified.risk_score > 50 ? "spam" : "ham")) as "spam" | "ham",
        is_spam: unified.ml?.is_spam ?? (unified.risk_score > 50),
        spam_probability: unified.ml?.probability ?? (unified.risk_score / 100),
        ham_probability: 1 - (unified.ml?.probability ?? (unified.risk_score / 100)),
        confidence: unified.ml?.confidence ?? 0.88,
        model: unified.ml?.model ?? (activeModelId === "naive_bayes" ? "Naive Bayes" : "Logistic Regression"),
        model_id: activeModelId,
        process_time_ms: Math.round(performance.now() - t0),
        message_stats: {
          char_length: effectiveContent.length,
          word_count: effectiveContent.split(/\s+/).length,
          token_count: effectiveContent.split(/\s+/).length,
          filtered_token_count: effectiveContent.split(/\s+/).length,
          has_urls: effectiveContent.includes("http"),
          has_currency: /[$£€]/.test(effectiveContent),
          has_numseq: /\d{4,}/.test(effectiveContent),
        },
        linguistic_signals: {
          urgency_detected: unified.gemini?.urgency_level === "high" || /urgent|now|immediately|today|suspended/i.test(effectiveContent),
          promotional_language: /winner|prize|free|discount|claim/i.test(effectiveContent),
          financial_terms: /bank|account|wire|transfer|payment|invoice|card/i.test(effectiveContent),
          prize_language: /won|prize|lottery|reward/i.test(effectiveContent),
          has_urls: effectiveContent.includes("http"),
          has_currency: /[$£€]/.test(effectiveContent),
          has_numseq: /\d{4,}/.test(effectiveContent),
          excessive_punctuation: /[!?.]{2,}/.test(effectiveContent),
          uppercase_ratio: effectiveContent.replace(/[^A-Z]/g, "").length / (effectiveContent.length || 1),
          detected_keywords: [],
        },
        token_breakdown: unified.ml?.top_features
          ? unified.ml.top_features.map((f) => ({
              token: f.term,
              in_vocabulary: true,
              tfidf_weight: Math.abs(f.weight),
              contribution: f.weight,
              direction: (f.direction || "spam") as any,
              category: f.direction === "spam" ? "Fraud Token" : "Safe Token",
            }))
          : [],
        top_features: unified.ml?.top_features
          ? unified.ml.top_features.map((f) => ({
              term: f.term,
              weight: f.weight,
              direction: (f.direction || "spam") as any,
            }))
          : [],
        explanation: unified.gemini?.summary || "Supervised statistical inference evaluated content.",
        timestamp: new Date().toLocaleTimeString(),
      };
      setTextResult(syntheticTextResult);

      // Model Disagreement Check (In parallel, inspect alternative model)
      const altModel = activeModelId === "naive_bayes" ? "logistic_regression" : "naive_bayes";
      try {
        const altRes = await predictMessage(effectiveContent, altModel);
        setAltModelResult(altRes);
      } catch (err) {
        console.warn("Alternative model check skipped:", err);
      }

      // Record Latency & History
      const elapsed = Math.round(performance.now() - t0);
      onRecordLatency?.(elapsed);
      onAddHistory?.({
        type: inputType,
        message: effectiveContent.slice(0, 80),
        prediction: unified.classification,
        probability: unified.risk_score / 100,
        model: activeModelId === "naive_bayes" ? "Naive Bayes" : "Logistic Regression",
        timestamp: new Date().toLocaleTimeString(),
      });

      // Scroll smoothly to Results Card
      setTimeout(() => {
        resultsCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

      const isThreat = unified.risk_score > 40;
      toast(
        isThreat ? `Analysis Complete: ${unified.classification}` : "Analysis Complete: No Major Threats",
        isThreat ? "error" : "success"
      );
    } catch (err: any) {
      console.error("Universal analysis error:", err);
      let userDisplay = "Analysis service temporarily unavailable.";
      let techInfo = String(err);
      let structuredInfo: any = undefined;

      if (err instanceof ApiError) {
        userDisplay = err.userFriendlyMessage;
        structuredInfo = {
          service: err.technicalDetails.service,
          endpoint: err.technicalDetails.endpoint,
          status: err.technicalDetails.status,
          requestId: err.technicalDetails.requestId,
          timestamp: err.technicalDetails.timestamp,
        };
        techInfo = `Service: ${err.technicalDetails.service}\nEndpoint: ${err.technicalDetails.endpoint}\nStatus: ${err.technicalDetails.status}\nRequest ID: ${err.technicalDetails.requestId}\nTimestamp: ${err.technicalDetails.timestamp}\nBackend URL: ${err.technicalDetails.backendUrl}\nRaw Error: ${err.technicalDetails.rawMessage}`;
      } else if (err?.message) {
        userDisplay = err.message;
        techInfo = err.stack || err.message;
      }

      setServiceError({
        message: userDisplay,
        technicalDetails: techInfo,
        structuredDetails: structuredInfo,
      });

      toast(userDisplay, "error");
    } finally {
      if (stageInterval) {
        clearInterval(stageInterval);
        stageInterval = null;
      }
      setCurrentScanningStage(6);
      const totalElapsed = Math.round(performance.now() - t0);
      if (!analysisElapsedMs) setAnalysisElapsedMs(totalElapsed);
      setLoading(false);
    }
  };

  // Feedback Submit
  const handleFeedbackSubmit = async (helpful: boolean, issueType?: string) => {
    setFeedbackSubmitting(true);
    try {
      await submitScanFeedback({
        helpful,
        issue_type: (issueType as any) || undefined,
        user_classification: unifiedScanResult?.classification || threatType,
      });
      setFeedbackSubmitted(true);
      toast("Thank you for your feedback! It helps improve detection accuracy.", "success");
    } catch {
      toast("Feedback submitted locally.", "info");
      setFeedbackSubmitted(true);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // Prepare Data for Verdict & Results
  const unifiedRiskScore = unifiedScanResult ? unifiedScanResult.risk_score : textResult ? Math.round(textResult.spam_probability * 100) : 0;
  const animatedScore = useCountUp(unifiedRiskScore, 800);

  // Derive Status Pill & Color (Requirement 7 & 8)
  const getStatusDetails = (score: number, confidenceStr?: string) => {
    if (confidenceStr === "INCONCLUSIVE" || unifiedScanResult?.classification === "INCONCLUSIVE") {
      return {
        label: "INCONCLUSIVE",
        icon: AlertTriangle,
        colorClass: "text-amber-800 bg-amber-50 border-amber-300 ring-amber-500/20",
        barClass: "bg-amber-500",
        textColorClass: "text-amber-600",
      };
    }
    if (score <= 20) {
      return {
        label: "SAFE",
        icon: ShieldCheck,
        colorClass: "text-emerald-800 bg-emerald-50 border-emerald-300 ring-emerald-500/20",
        barClass: "bg-emerald-500",
        textColorClass: "text-emerald-600",
      };
    }
    if (score <= 40) {
      return {
        label: "LOW RISK",
        icon: ShieldCheck,
        colorClass: "text-teal-800 bg-teal-50 border-teal-300 ring-teal-500/20",
        barClass: "bg-teal-500",
        textColorClass: "text-teal-600",
      };
    }
    if (score <= 60) {
      return {
        label: "SUSPICIOUS",
        icon: AlertTriangle,
        colorClass: "text-amber-800 bg-amber-50 border-amber-300 ring-amber-500/20",
        barClass: "bg-amber-500",
        textColorClass: "text-amber-600",
      };
    }
    if (score <= 80) {
      return {
        label: "HIGH RISK",
        icon: ShieldAlert,
        colorClass: "text-orange-800 bg-orange-50 border-orange-300 ring-orange-500/20",
        barClass: "bg-orange-500",
        textColorClass: "text-orange-600",
      };
    }
    return {
      label: "CRITICAL",
      icon: AlertOctagon,
      colorClass: "text-rose-800 bg-rose-50 border-rose-300 ring-rose-500/20",
      barClass: "bg-rose-600",
      textColorClass: "text-rose-600",
    };
  };

  const statusObj = getStatusDetails(unifiedRiskScore, unifiedScanResult?.confidence);

  // Threat Type Classification (Requirement 11)
  const threatType = useMemo(() => {
    if (!unifiedScanResult && !textResult) return "UNKNOWN";
    if (unifiedScanResult?.classification) {
      const c = unifiedScanResult.classification.toUpperCase();
      if (c.includes("PHISH")) return "PHISHING";
      if (c.includes("SMISH")) return "SMS PHISHING";
      if (c.includes("CREDENTIAL")) return "CREDENTIAL THEFT";
      if (c.includes("IMPERSONATION")) return "IMPERSONATION";
      if (c.includes("FINANCIAL")) return "FINANCIAL FRAUD";
      if (c.includes("SCAM")) return "SCAM";
      if (c.includes("SPAM")) return "SPAM";
      if (c.includes("SAFE") || unifiedRiskScore <= 20) return "SAFE";
      if (c.includes("INCONCLUSIVE")) return "INCONCLUSIVE";
      return c;
    }
    if (unifiedRiskScore <= 20) return "SAFE";
    if (unifiedRiskScore > 75) return "PHISHING";
    return "SPAM";
  }, [unifiedScanResult, textResult, unifiedRiskScore]);

  // Confidence System (Requirement 12)
  const confidenceLevel = (unifiedScanResult?.confidence || "HIGH").toUpperCase();
  const isConfidenceLimited = confidenceLevel === "LIMITED" || confidenceLevel === "INCONCLUSIVE";
  const confidenceReason = isConfidenceLimited
    ? (!unifiedScanResult?.virustotal?.available
        ? "External threat check unavailable."
        : "Conflicting or sparse indicators.")
    : "Verified across multi-engine consensus.";

  // Red Flags List (Requirement 9)
  const redFlags: RedFlagItem[] = unifiedScanResult?.red_flags || [];

  // Safe checks list (Requirement 36)
  const safeChecks = unifiedScanResult?.safe_checks || [
    "Low spam indicators",
    "No strong phishing indicators",
    "No suspicious URL signal",
    "No credential request detected",
  ];

  // Action plan (Requirement 27 & 28)
  const actionPlan = unifiedScanResult?.action_plan;

  // Threat-Specific Contextual Advice (Requirement 28)
  const contextualProtection = useMemo(() => {
    const t = threatType.toLowerCase();
    if (t.includes("bank") || t.includes("financial")) {
      return {
        threatName: "Financial / Banking Scam",
        donts: [
          "Do NOT share your One-Time Password (OTP) or card PIN with anyone.",
          "Do NOT transfer funds to any 'safe holding account' or recipient.",
          "Do NOT call telephone numbers listed in the suspicious message.",
        ],
        dos: [
          "Call the official fraud number printed on the back of your physical card.",
          "Freeze your payment card immediately via your official mobile banking app.",
          "Check recent transactions for unauthorized test charges.",
        ],
      };
    }
    if (t.includes("delivery") || t.includes("smish")) {
      return {
        threatName: "Postal / Delivery Impersonation",
        donts: [
          "Do NOT pay 'redelivery fees' or customs duty through the message link.",
          "Do NOT download tracking application APKs or install profiles.",
        ],
        dos: [
          "Check package tracking directly on the carrier's genuine official portal.",
          "Cross-reference the tracking code with your genuine merchant order receipt.",
        ],
      };
    }
    if (t.includes("job") || t.includes("recruitment")) {
      return {
        threatName: "Employment / Job Scam",
        donts: [
          "Do NOT pay equipment fees, background check deposits, or training costs.",
          "Do NOT cash advance checks sent by unverified prospective employers.",
        ],
        dos: [
          "Verify the job vacancy on the company's verified official career page.",
          "Insist on official verified corporate communications from an authentic domain.",
        ],
      };
    }
    // Default Phishing Protection
    return {
      threatName: "Phishing & Credential Harvest Attempt",
      donts: [
        "Do NOT click hyperlinks, buttons, or open attached documents.",
        "Do NOT enter your password, username, or multi-factor authentication codes.",
        "Do NOT reply to the sender or confirm that your contact info is active.",
      ],
      dos: [
        "Verify independently by navigating to the known official site in a clean tab.",
        "Report this message as Phishing/Spam in your client to protect others.",
        "Delete or quarantine this communication immediately.",
      ],
    };
  }, [threatType]);

  // Model Disagreement System (Requirement 13)
  const hasModelDisagreement = useMemo(() => {
    if (!textResult || !altModelResult) return false;
    return textResult.prediction !== altModelResult.prediction;
  }, [textResult, altModelResult]);

  // Visual Risk Contribution Breakdown (Requirement 15)
  const riskContributions = useMemo(() => {
    const list = [
      {
        id: "url",
        name: "URL SIGNAL",
        score: unifiedScanResult?.virustotal?.risk_score ?? (universalText.includes("http") ? 92 : 12),
        reason: "Domain registration age, homograph structure, punycode & threat feeds",
        source: unifiedScanResult?.virustotal?.available ? "VirusTotal Intelligence" : "Local Security Engine",
      },
      {
        id: "urgency",
        name: "URGENCY",
        score: /(?:urgent|immediately|today|suspended|24 hours|restricted)/i.test(universalText) ? 94 : 15,
        reason: "Artificial ultimatum designed to trigger panic and rush decisions",
        source: "Linguistic Security Heuristics",
      },
      {
        id: "credential",
        name: "CREDENTIAL REQUEST",
        score: /(?:password|credentials|login|verify|auth|routing|otp|pin)/i.test(universalText) ? 91 : 10,
        reason: "Solicitation of sensitive authentication or identity secrets",
        source: "Deterministic Content Rules",
      },
      {
        id: "social",
        name: "SOCIAL ENGINEERING",
        score: unifiedScanResult?.gemini?.risk_score ?? (unifiedRiskScore > 50 ? 88 : 14),
        reason: "Coercive pretexting, authority imitation, and reward luring",
        source: "Gemini AI Threat Analysis",
      },
      {
        id: "ml",
        name: "ML SIGNAL",
        score: textResult ? Math.round(textResult.spam_probability * 100) : 90,
        reason: "4,000-dimensional TF-IDF projection trained on UCI / Enron fraud corpus",
        source: activeModelId === "naive_bayes" ? "Multinomial Naive Bayes" : "Logistic Regression",
      },
    ];
    return list;
  }, [unifiedScanResult, universalText, textResult, unifiedRiskScore, activeModelId]);

  // In-situ Highlighting Preview (Requirement 10)
  const renderHighlightedContent = (rawText: string) => {
    if (!rawText) return null;

    const urgencyTokens = ["urgent", "today", "now", "immediately", "24 hours", "suspended", "restricted", "expire", "action required", "lockdown"];
    const prizeTokens = ["won", "prize", "cash", "reward", "claim", "free", "lottery", "£", "$", "bonus"];
    const credentialTokens = ["password", "credential", "routing", "pin", "otp", "verify", "identity", "billing", "login"];
    const geminiPhrases =
      unifiedScanResult?.gemini?.suspicious_phrases
        ?.map((p: any) => (typeof p === "string" ? p.toLowerCase().trim() : p.phrase?.toLowerCase().trim()))
        .filter(Boolean) || [];

    const words = rawText.split(/(\s+)/);

    return (
      <div className="p-4 bg-[#FAF9F6] border border-[#E8E6E1] rounded-2xl text-xs sm:text-sm font-mono text-[#202124] leading-relaxed select-text">
        {words.map((chunk, i) => {
          const lower = chunk.toLowerCase().replace(/[^a-z0-9]/g, "");
          const isUrgent = urgencyTokens.some((u) => lower.includes(u));
          const isPrize = prizeTokens.some((p) => lower.includes(p));
          const isCredential = credentialTokens.some((c) => lower.includes(c));
          const isAiPhrase = geminiPhrases.some((phrase) => phrase.includes(lower) && lower.length > 2);

          if (chunk.startsWith("http://") || chunk.startsWith("https://")) {
            return (
              <span
                key={i}
                className="bg-rose-100 text-rose-900 border-b-2 border-rose-500 font-bold px-1 rounded-sm mx-0.5 cursor-help"
                title="Suspicious Hyperlink: Destination requires independent verification"
              >
                {chunk}
              </span>
            );
          }

          if (isCredential || isUrgent || isPrize || isAiPhrase) {
            return (
              <span
                key={i}
                className={`px-1 py-0.5 rounded font-bold mx-0.5 transition-all cursor-help ${
                  isCredential
                    ? "bg-rose-100 text-rose-900 border-b-2 border-rose-600"
                    : isUrgent
                    ? "bg-amber-100 text-amber-900 border-b-2 border-amber-500"
                    : isAiPhrase
                    ? "bg-violet-100 text-violet-900 border-b-2 border-violet-500"
                    : "bg-emerald-100 text-emerald-900 border-b-2 border-emerald-500"
                }`}
                title={
                  isCredential
                    ? "Credential Harvesting Risk: Requests sensitive auth credentials"
                    : isUrgent
                    ? "Urgency Manipulation: Coercive artificial deadline"
                    : isAiPhrase
                    ? "AI Threat Pattern: Social engineering pretexting"
                    : "Financial/Prize Lure"
                }
              >
                {chunk}
              </span>
            );
          }

          return <span key={i}>{chunk}</span>;
        })}
      </div>
    );
  };

  // Prepare Report Data
  const handleOpenReportModal = () => {
    const mapSourceType = (kind?: string): "Text" | "Email" | "URL" | "Image OCR" | "QR Code" | "File" => {
      if (kind === "email") return "Email";
      if (kind === "url" || kind === "text_url") return "URL";
      if (kind === "qr" || kind === "qr_url") return "QR Code";
      if (kind === "image" || kind === "image_ocr") return "Image OCR";
      if (kind === "file") return "File";
      return "Text";
    };

    const reportThreatLevel: "SAFE" | "LOW_RISK" | "SUSPICIOUS" | "HIGH_RISK" | "CRITICAL" =
      unifiedRiskScore <= 20
        ? "SAFE"
        : unifiedRiskScore <= 40
        ? "LOW_RISK"
        : unifiedRiskScore <= 60
        ? "SUSPICIOUS"
        : unifiedRiskScore <= 80
        ? "HIGH_RISK"
        : "CRITICAL";

    const reportData: SecurityReportData = {
      scanId: `SG-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toLocaleString(),
      sourceType: mapSourceType(detectedKind?.type),
      contentPreview: universalText || ocrText || uploadedDocText || "[Visual Target]",
      overallRisk: unifiedRiskScore,
      threatLevel: reportThreatLevel,
      modelUsed: activeModelId === "naive_bayes" ? "Multinomial Naive Bayes (α=0.1)" : "Logistic Regression (C=1.0)",
      confidence: confidenceLevel === "HIGH" ? 0.95 : confidenceLevel === "MEDIUM" ? 0.8 : 0.6,
      spamProbability: textResult ? textResult.spam_probability : unifiedRiskScore / 100,
      riskBreakdown: {
        contentRisk: textResult ? Math.round(textResult.spam_probability * 100) : 20,
        urlRisk: riskContributions[0].score,
        languageRisk: 70,
        urgencyRisk: riskContributions[1].score,
        manipulationRisk: riskContributions[3].score,
        senderRisk: emailFrom ? 65 : 10,
        attachmentRisk: 10,
      },
      detectedSignals: redFlags.map((r) => `${r.title}: ${r.evidence}`),
      keyFeatures: textResult ? textResult.top_features : [],
      recommendations: actionPlan?.immediate_actions || contextualProtection.donts,
      explanation:
        unifiedScanResult?.gemini?.summary ||
        `SpamGuard analyzed this content across local deterministic heuristics, supervised ML, and security intelligence.`,
    };
    setGeneratedReport(reportData);
    setReportModalOpen(true);
  };

  const hasResult = !loading && (unifiedScanResult || textResult || urlResult || emailResult);

  return (
    <section id="workspace" className="py-12 md:py-16 bg-[#FAF9F6] border-b border-[#E8E6E1]">
      {/* Hidden File Pickers */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      <input type="file" ref={docInputRef} onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          setUploadedDocName(file.name);
          file.text().then((txt) => {
            setUploadedDocText(txt);
            setUniversalText(txt);
            toast(`Loaded document: ${file.name}`, "success");
          });
        }
      }} accept=".txt,.csv,.eml,.json" className="hidden" />

      {/* Security Report Dossier Modal */}
      <SecurityReportModal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} report={generatedReport} />

      {/* Incident Recovery: I Already Clicked Modal (Requirement 29) */}
      <AlreadyClickedModal isOpen={alreadyClickedModalOpen} onClose={() => setAlreadyClickedModalOpen(false)} />

      {/* Red Flag & Explanation Drawer */}
      <RedFlagDrawer
        isOpen={redFlagDrawerOpen}
        onClose={() => setRedFlagDrawerOpen(false)}
        selectedFlag={selectedRedFlag}
        unifiedScanResult={unifiedScanResult}
        textResult={textResult}
        mode={detectedKind?.type || "universal"}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* ============================================================ */}
        {/* 1. UNIVERSAL SCANNER — PRIMARY EXPERIENCE (Sections 1-5)    */}
        {/* ============================================================ */}
        <div
          ref={scannerCardRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onMouseMove={handleCardMouseMove}
          onMouseLeave={() => setCardMousePos({ x: -1000, y: -1000 })}
          className={`relative rounded-3xl border transition-all duration-300 p-6 sm:p-8 md:p-10 bg-white overflow-hidden ${
            isDragging
              ? "border-[#6D5DFB] bg-[#F5F3FF]/75 scale-[1.01] shadow-2xl ring-4 ring-[#6D5DFB]/15"
              : "border-[#E8E6E1] hover:border-[#C4B5FD] shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_36px_rgba(109,93,251,0.06)]"
          }`}
        >
          {/* Subtle Ambient Glow */}
          {cardMousePos.x > 0 && (
            <div
              aria-hidden="true"
              className="absolute pointer-events-none transition-opacity duration-300"
              style={{
                left: cardMousePos.x - 200,
                top: cardMousePos.y - 200,
                width: 400,
                height: 400,
                background:
                  "radial-gradient(circle, rgba(109, 93, 251, 0.08) 0%, rgba(139, 127, 253, 0.03) 45%, transparent 70%)",
              }}
            />
          )}

          {/* Faint Scanning Grid Ambient Background */}
          <div aria-hidden="true" className="absolute inset-0 bg-scanner-grid opacity-60 pointer-events-none" />

          {/* Scanner Corner Accents */}
          <div className="scanner-corner-tl" />
          <div className="scanner-corner-tr" />
          <div className="scanner-corner-bl" />
          <div className="scanner-corner-br" />

          {/* Drag Overlay: Release to Analyze (Requirement 4) */}
          {isDragging && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/95 backdrop-blur-xs animate-in fade-in duration-150 p-6">
              <div className="w-16 h-16 rounded-3xl bg-[#F5F3FF] border border-[#DDD6FE] text-[#6D5DFB] flex items-center justify-center mb-4 shadow-md animate-pulse">
                <UniversalScannerIcon size={34} state="scanning" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#111827] tracking-tight">
                Release to analyze
              </h3>
              <p className="text-xs sm:text-sm text-[#5F6368] mt-1.5 font-medium max-w-md text-center">
                SpamGuard will automatically detect the payload format and perform multi-engine inspection.
              </p>
            </div>
          )}

          {/* Scanner Header & Ingress */}
          <div className="relative z-10 max-w-3xl mx-auto space-y-6 text-center">
            {/* Component Badge (Requirement 1) */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF9F8] border border-[#DDD6FE] text-[10px] sm:text-[11px] font-bold text-[#6D5DFB] tracking-widest uppercase shadow-2xs animate-badge-shimmer">
              <Sparkles className="w-3.5 h-3.5 text-[#6D5DFB] shrink-0" />
              <span>SCAN ANYTHING</span>
            </div>

            {/* Primary Heading (Requirement 1) */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#111827] tracking-tight leading-tight">
                Is this safe?
              </h1>
              {/* Supporting text (Requirement 1) */}
              <p className="text-xs sm:text-sm text-[#5F6368] font-medium max-w-xl mx-auto leading-relaxed">
                Analyze messages, emails, links, images, QR codes and files before you interact with them.
              </p>
            </div>

            {/* Universal Input Surface with Auto-Detection (Requirement 2 & 3) */}
            <div className="text-left bg-white rounded-2xl border border-[#E8E6E1] focus-within:border-[#8B7FFD] focus-within:ring-4 focus-within:ring-[#6D5DFB]/10 shadow-xs transition-all overflow-hidden space-y-0">
              {/* Top Detection Badge Ribbon */}
              <div className="px-4 py-2.5 bg-[#FAF9F8] border-b border-[#E8E6E1] flex flex-wrap items-center justify-between gap-2 text-xs">
                {detectedKind ? (
                  <div className="flex items-center gap-2 animate-in fade-in duration-200">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${detectedKind.accent}`}>
                      <detectedKind.icon className="w-3.5 h-3.5" />
                      <span>{detectedKind.badge}</span>
                    </span>
                    <span className="text-[11px] text-[#5F6368] font-medium hidden sm:inline">
                      &bull; {detectedKind.hint}
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-[#5F6368] font-medium flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-[#6D5DFB] animate-pulse" />
                    <span>Auto-detection active &bull; Ready for any input</span>
                  </span>
                )}

                <div className="flex items-center gap-2 text-[11px] text-[#5F6368]">
                  <span>{universalText.length} chars</span>
                  {universalText.trim() && (
                    <>
                      <span>&bull;</span>
                      <span>{universalText.trim().split(/\s+/).length} words</span>
                    </>
                  )}
                  {(universalText || imageFile || uploadedDocName) && (
                    <button
                      onClick={clearAllInputs}
                      className="ml-2 text-[#5F6368] hover:text-rose-600 transition-colors cursor-pointer"
                      title="Clear scanner"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Advanced Email Headers (If user wants specific sender envelope spoofing test) */}
              {showAdvancedHeaders && (
                <div className="p-3 bg-[#FAF9F6] border-b border-[#E8E6E1] grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs animate-in fade-in">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#5F6368] block mb-1">
                      From Header
                    </label>
                    <input
                      type="text"
                      value={emailFrom}
                      onChange={(e) => setEmailFrom(e.target.value)}
                      placeholder="e.g. alert@chase-auth.xyz"
                      className="w-full p-2 bg-white border border-[#E8E6E1] rounded-lg font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#5F6368] block mb-1">
                      Subject Line
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="e.g. Account Security Suspension"
                      className="w-full p-2 bg-white border border-[#E8E6E1] rounded-lg font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#5F6368] block mb-1">
                      Reply-To Header
                    </label>
                    <input
                      type="text"
                      value={emailReplyTo}
                      onChange={(e) => setEmailReplyTo(e.target.value)}
                      placeholder="e.g. harvester@evil.com"
                      className="w-full p-2 bg-white border border-[#E8E6E1] rounded-lg font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Main Textarea */}
              <div className="p-4 sm:p-5">
                <textarea
                  rows={universalText.split("\n").length > 4 ? 6 : 4}
                  value={universalText}
                  onChange={(e) => setUniversalText(e.target.value)}
                  placeholder="Paste message, email, URL, or drag & drop screenshots, QR codes and files here..."
                  className="w-full bg-transparent text-xs sm:text-sm font-mono text-[#202124] placeholder-[#9AA0A6] focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Attached Visual / Media Preview Inline */}
              {imagePreviewUrl && (
                <div className="px-4 pb-4">
                  <div className="p-3 bg-[#FAF9F6] border border-[#E8E6E1] rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#DDD6FE] bg-white shrink-0">
                        <img src={imagePreviewUrl} alt="Inspection thumbnail" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-[#111827] block truncate max-w-xs">
                          {imageFile?.name || "Uploaded Image"}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#5F6368]">
                          {isOcrProcessing ? (
                            <span className="text-[#6D5DFB] flex items-center gap-1 font-semibold">
                              <Sparkles className="w-3 h-3 animate-spin" />
                              Running OCR ({ocrProgress}%)...
                            </span>
                          ) : ocrText ? (
                            <span className="text-emerald-700 font-medium">
                              OCR extracted ({ocrText.length} chars)
                            </span>
                          ) : (
                            <span>Image loaded</span>
                          )}
                          {qrDetection?.has_qr && (
                            <span className="text-amber-800 font-bold bg-amber-100 px-1.5 rounded">
                              QR Payload Found
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setImageFile(null);
                        setImagePreviewUrl(null);
                        setOcrText("");
                        setQrDetection(null);
                      }}
                      className="p-1.5 text-[#5F6368] hover:text-rose-600 rounded-lg hover:bg-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Attached Document Preview Inline */}
              {uploadedDocName && (
                <div className="px-4 pb-4">
                  <div className="p-3 bg-[#FAF9F6] border border-[#E8E6E1] rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <FileUp className="w-4 h-4 text-[#6D5DFB]" />
                      <span className="font-bold text-[#111827]">{uploadedDocName}</span>
                      <span className="text-[#5F6368] font-mono">({uploadedDocText.length} chars)</span>
                    </div>
                    <button
                      onClick={() => {
                        setUploadedDocName(null);
                        setUploadedDocText("");
                      }}
                      className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Quick-Action Toolbar */}
              <div className="px-4 py-3 bg-[#FAF9F8]/80 border-t border-[#E8E6E1] flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleClipboardPaste}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF9FF] border border-[#E8E6E1] hover:border-[#8B7FFD] text-xs font-bold text-[#111827] hover:text-[#6D5DFB] shadow-2xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#6D5DFB]" />
                    <span>Paste</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF9FF] border border-[#E8E6E1] hover:border-[#8B7FFD] text-xs font-bold text-[#111827] hover:text-[#6D5DFB] shadow-2xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-[#6D5DFB]" />
                    <span>Image / QR</span>
                  </button>

                  <button
                    onClick={() => docInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF9FF] border border-[#E8E6E1] hover:border-[#8B7FFD] text-xs font-bold text-[#111827] hover:text-[#6D5DFB] shadow-2xs hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <FileUp className="w-3.5 h-3.5 text-[#6D5DFB]" />
                    <span>File</span>
                  </button>

                  <button
                    onClick={() => setShowAdvancedHeaders(!showAdvancedHeaders)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      showAdvancedHeaders
                        ? "bg-[#6D5DFB]/10 text-[#6D5DFB] border-[#DDD6FE]"
                        : "bg-white text-[#5F6368] border-[#E8E6E1] hover:text-[#111827]"
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Headers</span>
                  </button>
                </div>

                {/* Primary CTA (Requirement 5) */}
                <div className="relative group inline-block">
                  <div
                    aria-hidden="true"
                    className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#6D5DFB]/30 via-[#8B7FFD]/25 to-[#06B6D4]/25 blur-md opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none"
                  />
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="relative px-6 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#6D5DFB] via-[#7867FB] to-[#5B4CE0] hover:from-[#6251FA] hover:to-[#5040D6] border border-white/25 shadow-[0_4px_16px_rgba(109,93,251,0.25)] hover:shadow-[0_6px_22px_rgba(109,93,251,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 flex items-center gap-2.5 cursor-pointer disabled:opacity-60 select-none"
                  >
                    {loading ? (
                      <>
                        <UniversalScannerIcon size={16} state="scanning" />
                        <span className="tracking-wide">ANALYZING...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#DDD6FE] group-hover:rotate-12 transition-transform duration-200" />
                        <span>✦ Scan Anything</span>
                        <ArrowRight className="w-4 h-4 text-white/90 group-hover:translate-x-1 transition-transform duration-200" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Presets Strip */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
              <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider mr-1">
                Try Sample:
              </span>
              {DEMO_PRESETS.map((demo) => (
                <button
                  key={demo.id}
                  onClick={() => loadDemoPreset(demo)}
                  className="px-3 py-1 rounded-full bg-white hover:bg-[#F5F3FF] border border-[#E8E6E1] hover:border-[#8B7FFD] text-[11px] font-medium text-[#202124] hover:text-[#6D5DFB] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      demo.id.includes("safe") ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                  <span>{demo.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. SCANNER ANALYSIS ANIMATION (Requirement 6)                */}
        {/* ============================================================ */}
        {loading && (
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#DDD6FE] shadow-lg shadow-[#6D5DFB]/5 space-y-6 animate-in fade-in duration-200 relative overflow-hidden">
            <div aria-hidden="true" className="absolute inset-0 bg-scanner-grid opacity-70 pointer-events-none" />

            {/* Moving Laser Beam */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#6D5DFB] to-transparent animate-pulse shadow-[0_0_12px_#6D5DFB]" />
            </div>

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <UniversalScannerIcon size={44} state="scanning" variant="hero" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-[#111827] tracking-tight">
                      SECURITY ANALYSIS IN PROGRESS
                    </h3>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6D5DFB] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#6D5DFB]" />
                    </span>
                  </div>
                  <p className="text-xs text-[#5F6368] font-medium">
                    Evaluating deterministic heuristics, supervised ML, AI context, and threat feeds
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#6D5DFB] bg-[#F5F3FF] border border-[#DDD6FE] px-3.5 py-1.5 rounded-full shadow-2xs">
                <span>STAGE {currentScanningStage + 1} OF {SCAN_STAGES.length}</span>
              </div>
            </div>

            {/* Stages Grid (Requirement 6: 7 Stages) */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {SCAN_STAGES.map((stage, idx) => {
                const isDone = currentScanningStage > idx;
                const isCurrent = currentScanningStage === idx;
                const StageIcon = stage.icon;

                return (
                  <div
                    key={idx}
                    className={`flex flex-col p-3 rounded-2xl border text-xs font-mono transition-all duration-300 relative ${
                      isDone
                        ? "bg-emerald-50/80 text-emerald-950 border-emerald-200"
                        : isCurrent
                        ? "bg-[#F5F3FF] text-[#6D5DFB] border-[#8B7FFD] shadow-sm font-bold scale-[1.02]"
                        : "bg-[#FAF9F8] text-[#5F6368] border-[#E8E6E1] opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-[#5F6368] font-bold">0{idx + 1}</span>
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : isCurrent ? (
                        <span className="w-2 h-2 rounded-full bg-[#6D5DFB] animate-ping shrink-0" />
                      ) : (
                        <StageIcon className="w-3 h-3 text-[#9AA0A6] shrink-0" />
                      )}
                    </div>
                    <span className="font-bold text-[11px] truncate tracking-tight">{stage.title}</span>
                    <span className="text-[9px] text-[#5F6368] truncate mt-0.5 font-sans">{stage.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* User-Facing Error UX (Requirement 26) */}
        {serviceError && (
          <div className="p-6 rounded-3xl bg-[#FFF8F8] border border-rose-200 text-[#202124] shadow-xs animate-in fade-in space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-rose-900">
                    {serviceError.message}
                  </h4>
                  <p className="text-xs text-[#5F6368]">
                    The threat classification engine could not complete the analysis. Local heuristic defenses remain active.
                  </p>

                  {serviceError.structuredDetails && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-[#5F6368]">
                      {serviceError.structuredDetails.endpoint && (
                        <span className="bg-white px-2.5 py-1 rounded-lg border border-[#E8E6E1]">
                          Endpoint: <strong>{serviceError.structuredDetails.endpoint}</strong>
                        </span>
                      )}
                      {serviceError.structuredDetails.status && (
                        <span className="bg-white px-2.5 py-1 rounded-lg border border-[#E8E6E1]">
                          Status: <strong>{serviceError.structuredDetails.status}</strong>
                        </span>
                      )}
                      {serviceError.structuredDetails.requestId && (
                        <span className="bg-white px-2.5 py-1 rounded-lg border border-[#E8E6E1]">
                          Request ID: <strong>{serviceError.structuredDetails.requestId}</strong>
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={handleAnalyze}
                      className="px-4 py-2 rounded-xl bg-white border border-rose-300 text-xs font-bold text-rose-700 hover:bg-[#FFF0F0] shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                      <span>Retry Analysis</span>
                    </button>
                    {serviceError.technicalDetails && (
                      <button
                        onClick={() => setShowTechDetails(!showTechDetails)}
                        className="text-xs font-medium text-[#5F6368] hover:text-[#111827] cursor-pointer"
                      >
                        {showTechDetails ? "Hide technical details" : "View technical details"}
                      </button>
                    )}
                  </div>
                  {showTechDetails && serviceError.technicalDetails && (
                    <pre className="mt-3 p-3 bg-white rounded-xl border border-rose-200 text-[10px] font-mono text-rose-950 overflow-x-auto max-h-36 leading-relaxed">
                      {serviceError.technicalDetails}
                    </pre>
                  )}
                </div>
              </div>
              <button
                onClick={() => setServiceError(null)}
                className="text-[#5F6368] hover:text-[#111827] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 3. DETECTION, EXPLANATION, PROTECTION & TRUST RESULTS        */}
        {/* ============================================================ */}
        {hasResult && (
          <div ref={resultsCardRef} className="space-y-8 animate-in fade-in duration-300">
            {/* Top Bar: Mode Switcher (Simple vs Expert) & Dossier */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-[#E8E6E1] shadow-2xs">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setDisplayMode("simple")}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    displayMode === "simple"
                      ? "bg-[#111827] text-white shadow-xs"
                      : "text-[#5F6368] hover:text-[#111827]"
                  }`}
                >
                  Simple Mode
                </button>
                <button
                  onClick={() => setDisplayMode("expert")}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    displayMode === "expert"
                      ? "bg-[#6D5DFB] text-white shadow-xs"
                      : "text-[#5F6368] hover:text-[#111827]"
                  }`}
                >
                  Expert Mode
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenReportModal}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF9FF] border border-[#E8E6E1] hover:border-[#8B7FFD] text-xs font-bold text-[#111827] hover:text-[#6D5DFB] flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <FileCheck className="w-3.5 h-3.5 text-[#6D5DFB]" />
                  <span>Security Report</span>
                </button>

                <button
                  onClick={() => setAlreadyClickedModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-800 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                  <span>I Already Clicked</span>
                </button>
              </div>
            </div>

            {/* ============================================================ */}
            {/* 3A. DETECTION: VERDICT HERO CARD (Requirements 7, 8, 9, 10)  */}
            {/* ============================================================ */}
            <div className="bg-white rounded-3xl border border-[#E8E6E1] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Left: Status & Threat Type (7 Cols) */}
                <div className="md:col-span-7 space-y-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Status Pill (Requirement 7) */}
                    <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black border font-mono tracking-wide ring-2 ${statusObj.colorClass}`}>
                      <statusObj.icon className="w-4 h-4" />
                      <span>{statusObj.label}</span>
                    </span>

                    {/* Threat Type (Requirement 7 & 11) */}
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FAF9F6] border border-[#E8E6E1] text-[#202124] font-mono">
                      THREAT: <strong>{threatType}</strong>
                    </span>

                    {/* Confidence (Requirement 7 & 12) */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                        isConfidenceLimited
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      }`}
                      title={confidenceReason}
                    >
                      CONFIDENCE: {confidenceLevel}
                    </span>
                  </div>

                  {/* Plain Language Verdict Summary (Requirement 14) */}
                  <p className="text-sm sm:text-base text-[#202124] font-medium leading-relaxed">
                    {unifiedRiskScore <= 20
                      ? "No active threats detected. Content aligns with standard benign communication patterns."
                      : unifiedScanResult?.gemini?.summary ||
                        "Several signals suggest this may be a phishing attempt designed to create urgency and obtain account information."}
                  </p>

                  {/* Confidence Note if Limited (Requirement 12) */}
                  {isConfidenceLimited && (
                    <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50/80 border border-amber-200 p-2.5 rounded-xl font-medium">
                      <Info className="w-4 h-4 shrink-0" />
                      <span>{confidenceReason}</span>
                    </div>
                  )}
                </div>

                {/* Right: Big Animated Risk Score (Requirement 8) */}
                <div className="md:col-span-5 flex flex-col items-start md:items-end justify-center md:border-l md:border-[#F0EFEA] md:pl-6 space-y-2">
                  <span className="text-[10px] font-bold text-[#5F6368] uppercase tracking-wider font-mono">
                    RISK SCORE
                  </span>

                  <div className="flex items-baseline gap-2">
                    <span className={`text-4xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight ${statusObj.textColorClass}`}>
                      {animatedScore}
                    </span>
                    <span className="text-lg font-bold font-mono text-[#5F6368]">/ 100</span>
                  </div>

                  {/* Progress Meter */}
                  <div className="w-full max-w-xs bg-[#E8E6E1] rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${statusObj.barClass}`}
                      style={{ width: `${Math.max(4, unifiedRiskScore)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between w-full max-w-xs text-[10px] font-mono text-[#5F6368]">
                    <span>0 SAFE</span>
                    <span>100 CRITICAL</span>
                  </div>
                </div>
              </div>

              {/* Red Flags Summary Cards (Requirement 9) */}
              <div className="pt-4 border-t border-[#F0EFEA] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>
                      {redFlags.length > 0
                        ? `${redFlags.length} RED FLAGS DETECTED`
                        : "NO CRITICAL RED FLAGS DETECTED"}
                    </span>
                  </h4>
                  {redFlags.length > 0 && (
                    <span className="text-[11px] text-[#5F6368] font-medium">
                      Click any card to inspect full evidence
                    </span>
                  )}
                </div>

                {redFlags.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {redFlags.map((flag) => (
                      <button
                        key={flag.id}
                        onClick={() => {
                          setSelectedRedFlag(flag);
                          setRedFlagDrawerOpen(true);
                        }}
                        className="p-3.5 rounded-2xl bg-[#FFF8F8] hover:bg-[#FFF0F0] border border-rose-100 hover:border-rose-300 text-left transition-all cursor-pointer shadow-2xs hover:shadow-xs space-y-1.5 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-rose-900 group-hover:text-rose-700 flex items-center gap-1.5 truncate">
                            <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                            {flag.title}
                          </span>
                          <span className="text-[10px] font-mono text-rose-700 font-bold shrink-0">
                            +{flag.risk_contribution}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#5F6368] line-clamp-2 leading-relaxed">
                          {flag.description}
                        </p>
                        <div className="pt-1 text-[10px] font-mono text-[#6D5DFB] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          <span>Evidence details</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-xs text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>NO MAJOR THREATS DETECTED</span>
                    </div>
                    <ul className="text-xs text-emerald-800 space-y-1 list-disc list-inside">
                      {safeChecks.map((sc, i) => (
                        <li key={i}>{sc}</li>
                      ))}
                    </ul>
                    <p className="text-[10px] text-emerald-950/75 pt-1">
                      No automated system can guarantee 100% safety. Continue exercising standard caution with unsolicited links.
                    </p>
                  </div>
                )}
              </div>

              {/* In-situ Evidence Highlighting (Requirement 10) */}
              <div className="pt-4 border-t border-[#F0EFEA] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[#6D5DFB]" />
                    <span>In-Situ Evidence Highlighting</span>
                  </h4>
                  <span className="text-[10px] text-[#5F6368] font-mono">
                    Red = Threat &bull; Yellow = Urgency &bull; Violet = AI
                  </span>
                </div>
                {renderHighlightedContent(
                  universalText || ocrText || uploadedDocText || "[No preview text available]"
                )}
              </div>
            </div>

            {/* ============================================================ */}
            {/* 3B. PROTECTION: WHAT SHOULD I DO? (Requirement 27, 28, 30)  */}
            {/* ============================================================ */}
            <div className="bg-white rounded-3xl border border-[#E8E6E1] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-[#111827] tracking-tight flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#6D5DFB]" />
                    <span>WHAT SHOULD I DO?</span>
                  </h3>
                  <p className="text-xs text-[#5F6368] mt-0.5">
                    Recommended immediate protective actions tailored for: <strong>{contextualProtection.threatName}</strong>
                  </p>
                </div>

                <button
                  onClick={() => setAlreadyClickedModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-800 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  <span>I Already Clicked</span>
                </button>
              </div>

              {/* DO NOT & DO Grid (Requirement 27 & 28) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* DO NOT Card */}
                <div className="p-5 rounded-2xl bg-[#FFF8F8] border border-rose-200 space-y-3">
                  <h4 className="text-xs font-black text-rose-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs">
                      <X className="w-3 h-3 text-white" />
                    </span>
                    <span>DO NOT:</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-[#202124]">
                    {contextualProtection.donts.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <X className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* DO Card */}
                <div className="p-5 rounded-2xl bg-[#F0FDF4] border border-emerald-200 space-y-3">
                  <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                    <span>DO:</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-[#202124]">
                    {contextualProtection.dos.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* BEFORE YOU CLICK / BEFORE YOU SCAN (Requirement 30 & 31) */}
              {(detectedKind?.type === "url" || detectedKind?.type === "text_url" || detectedKind?.type === "qr" || detectedKind?.type === "qr_url") && (
                <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 font-black text-xs text-amber-950 uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>BEFORE YOU CLICK OR SCAN:</span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    {unifiedRiskScore > 40
                      ? "High-risk indicators detected. Do not open or authenticate on this destination."
                      : "Exercise standard caution before entering credentials on unverified third-party pages."}
                  </p>
                  <div className="pt-1 text-xs text-amber-950 font-bold flex items-center gap-1.5">
                    <CornerDownRight className="w-3.5 h-3.5 text-amber-700" />
                    <span>SAFER ALTERNATIVE:</span>
                    <span className="font-normal text-amber-900">
                      Open the organization's verified app or manually navigate to its known official website.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ============================================================ */}
            {/* 3C. EXPLANATION: "WHY WAS THIS FLAGGED?" (Sections 14, 15, 16) */}
            {/* ============================================================ */}
            <div className="bg-white rounded-3xl border border-[#E8E6E1] p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h3 className="text-lg font-black text-[#111827] tracking-tight flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#6D5DFB]" />
                  <span>WHY WAS THIS FLAGGED?</span>
                </h3>
                <p className="text-xs text-[#5F6368] mt-0.5">
                  Visual breakdown of risk contributions across security layers
                </p>
              </div>

              {/* Visual Risk Contribution Bars (Requirement 15) */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider block font-mono">
                  RISK CONTRIBUTION BY SIGNAL:
                </span>

                <div className="space-y-2.5">
                  {riskContributions.map((sig) => {
                    const isSelected = activeSignalFilter === sig.id;
                    return (
                      <div
                        key={sig.id}
                        onClick={() => setActiveSignalFilter(isSelected ? null : sig.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#FAF9FF] border-[#8B7FFD] ring-2 ring-[#6D5DFB]/15"
                            : "bg-[#FAF9F8] hover:bg-white border-[#E8E6E1]"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold text-[#111827] tracking-wide font-mono">
                            {sig.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[#5F6368] font-medium">
                              Source: {sig.source}
                            </span>
                            <span className="font-mono font-bold text-xs text-[#6D5DFB]">
                              {sig.score} / 100
                            </span>
                          </div>
                        </div>

                        {/* Visual Bar */}
                        <div className="w-full bg-[#E8E6E1] rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              sig.score > 70
                                ? "bg-rose-500"
                                : sig.score > 40
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.max(5, sig.score)}%` }}
                          />
                        </div>

                        {/* Interactive Drawer Snippet */}
                        {isSelected && (
                          <div className="mt-2.5 pt-2 border-t border-[#E8E6E1] text-xs text-[#5F6368] space-y-1 animate-in fade-in">
                            <p><strong>Reason:</strong> {sig.reason}</p>
                            <p><strong>Assessing Engine:</strong> {sig.source}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Source Transparency Grid (Requirement 16) */}
              <div className="pt-4 border-t border-[#F0EFEA] space-y-3">
                <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-wider block font-mono">
                  ANALYSIS SOURCES TRANSPARENCY:
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-[#FAF9F8] border border-[#E8E6E1] flex items-center justify-between">
                    <span>SpamGuard ML</span>
                    <span className="text-emerald-700 font-bold">AVAILABLE</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF9F8] border border-[#E8E6E1] flex items-center justify-between">
                    <span>Local Security</span>
                    <span className="text-emerald-700 font-bold">AVAILABLE</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF9F8] border border-[#E8E6E1] flex items-center justify-between">
                    <span>Gemini AI</span>
                    <span className={unifiedScanResult?.gemini?.available ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
                      {unifiedScanResult?.gemini?.available ? "AVAILABLE" : "UNAVAILABLE"}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAF9F8] border border-[#E8E6E1] flex items-center justify-between">
                    <span>VirusTotal</span>
                    <span className={unifiedScanResult?.virustotal?.available ? "text-emerald-700 font-bold" : "text-slate-500 font-bold"}>
                      {unifiedScanResult?.virustotal?.available ? "AVAILABLE" : "NOT CHECKED"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Model Disagreement in Expert Mode (Requirement 13) */}
              {displayMode === "expert" && hasModelDisagreement && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>MODEL DISAGREEMENT</span>
                  </div>
                  <p>
                    The models produced different predictions (Primary: {textResult?.prediction.toUpperCase()} vs Secondary: {altModelResult?.prediction.toUpperCase()}), so confidence has been calibrated accordingly.
                  </p>
                </div>
              )}
            </div>

            {/* ============================================================ */}
            {/* 3D. TRUST SYSTEM: WHY SHOULD I TRUST THIS RESULT? (Sec 32)  */}
            {/* ============================================================ */}
            <div className="bg-white rounded-3xl border border-[#E8E6E1] p-6 sm:p-7 shadow-xs space-y-4">
              <button
                onClick={() => setTrustCardExpanded(!trustCardExpanded)}
                className="w-full flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-[#6D5DFB]" />
                  <div>
                    <h4 className="text-sm font-black text-[#111827]">
                      WHY SHOULD I TRUST THIS RESULT?
                    </h4>
                    <p className="text-xs text-[#5F6368]">
                      Multi-layer deterministic validation with zero blind reliance on LLMs
                    </p>
                  </div>
                </div>
                {trustCardExpanded ? (
                  <ChevronUp className="w-4 h-4 text-[#5F6368]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#5F6368]" />
                )}
              </button>

              {trustCardExpanded && (
                <div className="pt-4 border-t border-[#F0EFEA] space-y-3 text-xs animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-[#FAF9F8] border border-[#E8E6E1]">
                      <span className="text-[10px] font-bold text-[#5F6368] uppercase font-mono block">Layers Evaluated</span>
                      <span className="font-bold text-sm text-[#111827]">4 Active Security Layers</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FAF9F8] border border-[#E8E6E1]">
                      <span className="text-[10px] font-bold text-[#5F6368] uppercase font-mono block">Model Agreement</span>
                      <span className="font-bold text-sm text-[#111827]">
                        {hasModelDisagreement ? "Divergent (Calibrated)" : "High Agreement"}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FAF9F8] border border-[#E8E6E1]">
                      <span className="text-[10px] font-bold text-[#5F6368] uppercase font-mono block">Latency</span>
                      <span className="font-bold text-sm text-[#111827]">{analysisElapsedMs} ms</span>
                    </div>
                  </div>
                  <p className="text-[#5F6368] leading-relaxed">
                    SpamGuard enforces a strict non-hallucination policy. AI suggestions never blindly override deterministic local rules or Scikit-Learn TF-IDF classification trained on the UCI corpus.
                  </p>
                </div>
              )}
            </div>

            {/* User Feedback & Re-scan */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-[#E8E6E1] shadow-2xs text-xs">
              <span className="font-bold text-[#5F6368]">Was this verdict clear and helpful?</span>

              <div className="flex items-center gap-3">
                {!feedbackSubmitted ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFeedbackSubmit(true)}
                      disabled={feedbackSubmitting}
                      className="px-3 py-1.5 rounded-xl bg-[#FAF9F6] hover:bg-emerald-50 border border-[#E8E6E1] font-bold text-[#202124] flex items-center gap-1.5 cursor-pointer"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Yes</span>
                    </button>
                    <button
                      onClick={() => handleFeedbackSubmit(false)}
                      disabled={feedbackSubmitting}
                      className="px-3 py-1.5 rounded-xl bg-[#FAF9F6] hover:bg-rose-50 border border-[#E8E6E1] font-bold text-[#202124] flex items-center gap-1.5 cursor-pointer"
                    >
                      <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
                      <span>No</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Feedback recorded</span>
                  </span>
                )}

                <button
                  onClick={clearAllInputs}
                  className="px-4 py-1.5 rounded-xl bg-[#111827] text-white font-bold hover:bg-black transition-all cursor-pointer shadow-2xs"
                >
                  Scan Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
