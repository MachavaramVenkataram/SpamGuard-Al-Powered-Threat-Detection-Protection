"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Command,
  Menu,
  X,
  Palette,
  Check,
  ChevronDown,
  Sliders,
  Bot,
  Sparkles,
} from "lucide-react";
import { checkHealth } from "@/lib/api";
import { useTheme, ThemeName, THEME_OPTIONS } from "@/components/ThemeContext";

interface NavbarProps {
  onOpenCommandPalette?: () => void;
  onOpenSettings?: () => void;
  onOpenCopilot?: () => void;
}

export default function Navbar({
  onOpenCommandPalette,
  onOpenSettings,
  onOpenCopilot,
}: NavbarProps) {
  const { theme, setTheme, options } = useTheme();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function verify() {
      try {
        const res = await checkHealth();
        if (isMounted) setApiOnline(res.status === "healthy");
      } catch {
        if (isMounted) setApiOnline(false);
      }
    }
    verify();
    const interval = setInterval(verify, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navLinks = [
    { label: "Overview", href: "#overview", id: "overview" },
    { label: "Scanner", href: "#workspace", id: "workspace", mode: "text" },
    { label: "Threat Map", href: "#threat-map", id: "threat-map" },
    { label: "Security Center", href: "#security-center", id: "security-center" },
    { label: "Training", href: "#training", id: "training" },
    { label: "Compare", href: "#compare", id: "compare" },
    { label: "Dataset Explorer", href: "#dataset", id: "dataset" },
    { label: "NLP Lab", href: "#pipeline", id: "pipeline" },
    { label: "Model Lab", href: "#models", id: "models" },
    { label: "Explainability", href: "#deepdive", id: "deepdive" },
    { label: "History", href: "#history", id: "history" },
    { label: "Privacy", href: "#privacy", id: "privacy" },
  ];

  // Scrollspy to highlight active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 140;
      for (let i = navLinks.length - 1; i >= 0; i--) {
        const section = document.getElementById(navLinks[i].id);
        if (section && section.offsetTop <= scrollPos) {
          setActiveSection(navLinks[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLinkClick = (link: typeof navLinks[0]) => {
    if (link.mode && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("switch-workspace-mode", { detail: link.mode }));
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8E6E1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <a href="#overview" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 rounded-xl bg-[#6D5DFB] flex items-center justify-center text-white shadow-md shadow-[#6D5DFB]/20 group-hover:bg-[#5B4CE0] transition-colors">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[#202124] text-base tracking-tight">SPAMGUARD</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wide uppercase bg-[#F2F0FF] text-[#6D5DFB] border border-[#DCD8FF] rounded">
                    AI SAAS
                  </span>
                </div>
                <p className="text-[10px] text-[#5F6368] hidden sm:block">
                  AI-Powered Threat Detection &amp; Protection
                </p>
              </div>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex items-center gap-0.5 overflow-x-auto py-1" aria-label="Main Navigation">
              {navLinks.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    onClick={() => handleLinkClick(link)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-[#FAF9F6] text-[#202124] border border-[#E8E6E1] shadow-2xs font-bold"
                        : "text-[#5F6368] hover:text-[#202124] hover:bg-[#FAF9F6]"
                    }`}
                  >
                    {link.label}
                  </a>
                );
              })}
            </nav>

            {/* Actions & Settings Toolbar */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Security Copilot Launcher */}
              {onOpenCopilot && (
                <button
                  onClick={onOpenCopilot}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#6D5DFB] bg-[#F2F0FF] hover:bg-[#E9E5FF] border border-[#DCD8FF] rounded-lg transition-colors shadow-2xs font-bold cursor-pointer"
                  title="Open AI Security Copilot"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copilot</span>
                </button>
              )}

              {/* Appearance / Theme Picker Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setThemeDropdownOpen((p) => !p)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#202124] bg-white hover:bg-[#FAF9F6] border border-[#E8E6E1] hover:border-[#D5D2CB] rounded-lg transition-colors shadow-2xs cursor-pointer"
                  title="Select Light Color Palette"
                >
                  <Palette className="w-3.5 h-3.5 text-[#6D5DFB]" />
                  <span className="hidden sm:inline capitalize font-medium">{theme}</span>
                  <ChevronDown className="w-3 h-3 text-[#5F6368]" />
                </button>

                {themeDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#E8E6E1] p-2 z-50 animate-in fade-in duration-100">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#5F6368] border-b border-[#E8E6E1] mb-1">
                      Light SaaS Themes
                    </div>
                    {options.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTheme(t.id);
                          setThemeDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          theme === t.id ? "bg-[#FAF9F6] text-[#202124] font-bold" : "text-[#5F6368] hover:bg-[#FAF9F6]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shadow-2xs"
                            style={{ backgroundColor: t.primaryColor }}
                          />
                          <span>{t.name}</span>
                        </div>
                        {theme === t.id && <Check className="w-3.5 h-3.5 text-[#202124]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Platform Settings Button */}
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-[#FAF9F6] rounded-lg border border-[#E8E6E1] transition-colors cursor-pointer"
                  title="Platform Settings"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              )}

              {/* Command Palette Trigger */}
              <button
                onClick={onOpenCommandPalette}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#5F6368] bg-[#FAF9F6] hover:bg-white hover:text-[#202124] rounded-lg border border-[#E8E6E1] transition-colors cursor-pointer shadow-2xs"
                title="Command Palette (Ctrl+K)"
              >
                <Command className="w-3.5 h-3.5" />
                <kbd className="px-1 py-0.2 text-[9px] font-mono bg-white rounded border border-[#E8E6E1] text-[#5F6368]">
                  Ctrl+K
                </kbd>
              </button>

              {/* API Live Status Badge */}
              <div
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                  apiOnline === true
                    ? "bg-[#EDFBF7] text-[#38C9A7] border-[#BCEFE3]"
                    : apiOnline === false
                    ? "bg-[#FFF0F0] text-[#FF6B6B] border-[#FFD4D4]"
                    : "bg-[#FAF9F6] text-[#5F6368] border-[#E8E6E1]"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    apiOnline === true
                      ? "bg-[#38C9A7] animate-pulse"
                      : apiOnline === false
                      ? "bg-[#FF6B6B]"
                      : "bg-[#5F6368]"
                  }`}
                />
                <span className="font-mono">
                  {apiOnline === true ? "API 8008" : apiOnline === false ? "Offline" : "Checking"}
                </span>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen((p) => !p)}
                className="p-1.5 xl:hidden text-[#5F6368] hover:text-[#202124] hover:bg-[#FAF9F6] rounded-lg border border-[#E8E6E1]"
                aria-label="Toggle Navigation"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-white border-b border-[#E8E6E1] px-4 pt-3 pb-5 space-y-1 animate-in slide-in-from-top-2 duration-150">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={() => handleLinkClick(link)}
                className="block px-3 py-2 text-xs font-semibold text-[#5F6368] hover:text-[#202124] hover:bg-[#FAF9F6] rounded-lg"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </header>
    </>
  );
}
