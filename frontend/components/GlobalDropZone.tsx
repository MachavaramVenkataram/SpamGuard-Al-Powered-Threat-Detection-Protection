"use client";

import React, { useState, useEffect } from "react";
import { Upload, Sparkles, Image as ImageIcon, FileText, Mail } from "lucide-react";
import { useToast } from "./ToastContext";

interface GlobalDropZoneProps {
  onFileDropped?: (file: File) => void;
}

export default function GlobalDropZone({ onFileDropped }: GlobalDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer && e.dataTransfer.types.includes("Files")) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        setIsDragging(false);
        dragCounter = 0;
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      dragCounter = 0;

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const file = files[0];

      // Auto route by mime / extension
      if (file.type.startsWith("image/")) {
        toast(`Image file dropped: ${file.name}. Routing to Image Analyzer...`, "info");
        window.dispatchEvent(new CustomEvent("switch-workspace-mode", { detail: "image" }));
        onFileDropped?.(file);
      } else if (
        file.name.endsWith(".txt") ||
        file.name.endsWith(".eml") ||
        file.name.endsWith(".csv") ||
        file.type === "text/plain"
      ) {
        try {
          const content = await file.text();
          toast(`Text file loaded: ${file.name}. Routing to Text Analyzer...`, "info");
          window.dispatchEvent(new CustomEvent("switch-workspace-mode", { detail: "text" }));
          window.dispatchEvent(new CustomEvent("load-workspace-text", { detail: content }));
        } catch (err) {
          toast("Failed to read text file contents", "error");
        }
      } else {
        toast(`File format detected: ${file.name}. Routing to Universal Workspace...`, "info");
        onFileDropped?.(file);
      }

      const ws = document.getElementById("workspace");
      if (ws) ws.scrollIntoView({ behavior: "smooth" });
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [onFileDropped, toast]);

  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-8 bg-white/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl p-12 rounded-3xl border-4 border-dashed border-[#6D5DFB] bg-[#FAF9F6] text-center shadow-2xl space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-white border border-[#E8E6E1] text-[#6D5DFB] flex items-center justify-center mx-auto shadow-md animate-bounce">
          <Upload className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-[#202124]">
            Release to Analyze Payload
          </h2>
          <p className="text-sm text-[#5F6368] mt-1">
            Universal Ingress: Images, Screenshots, Raw Text, .EML, and .CSV files automatically routed to the threat engine
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 pt-3 text-xs font-mono text-[#5F6368]">
          <span className="flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-[#6D5DFB]" />
            <span>OCR Extraction</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-[#FF6B6B]" />
            <span>MIME Forensics</span>
          </span>
          <span className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#38C9A7]" />
            <span>NLP Inference</span>
          </span>
        </div>
      </div>
    </div>
  );
}
