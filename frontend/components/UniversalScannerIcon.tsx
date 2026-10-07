"use client";

import React from "react";

export type ScannerIconState =
  | "idle"
  | "hover"
  | "scanning"
  | "safe"
  | "warning"
  | "critical";

interface UniversalScannerIconProps {
  state?: ScannerIconState;
  size?: number;
  className?: string;
  variant?: "compact" | "hero" | "shield";
}

/**
 * UniversalScannerIcon
 * Premium, bespoke vector icon combining:
 * Security Shield + Precision Scanning Reticle + AI Spark + Magnifying Glass Geometry
 * Supports idle float, scanning rotation, and result states (safe, warning, critical).
 */
export default function UniversalScannerIcon({
  state = "idle",
  size = 24,
  className = "",
  variant = "compact",
}: UniversalScannerIconProps) {
  const isScanning = state === "scanning";
  const isSafe = state === "safe";
  const isWarning = state === "warning";
  const isCritical = state === "critical";

  // Dynamic color accents based on state
  const primaryStroke = isSafe
    ? "#10B981"
    : isWarning
    ? "#F59E0B"
    : isCritical
    ? "#E11D48"
    : "#6D5DFB";

  const secondaryStroke = isSafe
    ? "#34D399"
    : isWarning
    ? "#FBBF24"
    : isCritical
    ? "#F87171"
    : "#A78BFA";

  const accentCyan = isSafe ? "#059669" : isWarning ? "#D97706" : isCritical ? "#BE123C" : "#06B6D4";

  if (variant === "hero") {
    return (
      <div
        className={`relative inline-flex items-center justify-center select-none ${className}`}
        style={{ width: size, height: size }}
      >
        {/* Soft Ambient Radial Glow */}
        <div
          aria-hidden="true"
          className={`absolute inset-0 rounded-2xl filter blur-xl opacity-60 transition-all duration-700 pointer-events-none ${
            isSafe
              ? "bg-emerald-400/30"
              : isWarning
              ? "bg-amber-400/30"
              : isCritical
              ? "bg-rose-500/30"
              : isScanning
              ? "bg-cyan-400/40 animate-pulse"
              : "bg-[#6D5DFB]/25 group-hover:bg-[#6D5DFB]/40"
          }`}
        />

        {/* Outer Rotating Scan Ring (Active during scanning or subtle idle drift) */}
        <div
          className={`absolute inset-[-4px] rounded-3xl pointer-events-none border border-dashed transition-all duration-500 ${
            isScanning
              ? "border-cyan-400/70 animate-spin"
              : "border-[#6D5DFB]/20 group-hover:border-[#6D5DFB]/40"
          }`}
          style={{ animationDuration: isScanning ? "3s" : "20s" }}
        />

        {/* Base SVG Container */}
        <svg
          width={size}
          height={size}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`relative z-10 transition-transform duration-300 ${
            isScanning
              ? "scale-105"
              : "group-hover:scale-105 group-hover:-rotate-2"
          }`}
        >
          <defs>
            {/* Primary Gradient */}
            <linearGradient id="usi-grad-primary" x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={primaryStroke} />
              <stop offset="60%" stopColor={secondaryStroke} />
              <stop offset="100%" stopColor={accentCyan} />
            </linearGradient>

            {/* Shield Fill Glass Gradient */}
            <linearGradient id="usi-grad-fill" x1="24" y1="4" x2="24" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={primaryStroke} stopOpacity="0.12" />
              <stop offset="100%" stopColor={secondaryStroke} stopOpacity="0.04" />
            </linearGradient>

            {/* Sweep Beam Gradient */}
            <linearGradient id="usi-grad-sweep" x1="12" y1="24" x2="36" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={accentCyan} stopOpacity="0" />
              <stop offset="50%" stopColor={accentCyan} stopOpacity="0.9" />
              <stop offset="100%" stopColor={accentCyan} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Shield Outline Path */}
          <path
            d="M24 4L9 9.5V22C9 32.5 15.5 41.2 24 44C32.5 41.2 39 32.5 39 22V9.5L24 4Z"
            fill="url(#usi-grad-fill)"
            stroke="url(#usi-grad-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Inner Geometric Grid Accent */}
          <path
            d="M24 10V38M14 24H34"
            stroke="url(#usi-grad-primary)"
            strokeWidth="1"
            strokeOpacity="0.25"
            strokeDasharray="2 2"
          />

          {/* Precision Magnifying Scanner Lens */}
          <circle
            cx="23"
            cy="23"
            r="8.5"
            stroke="url(#usi-grad-primary)"
            strokeWidth="2"
            strokeOpacity="0.9"
            fill="white"
            fillOpacity="0.5"
          />

          {/* Magnifier Handle / Diagonal Sensor */}
          <path
            d="M29 29L35 35"
            stroke="url(#usi-grad-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Center State Icon */}
          {isSafe ? (
            // Checkmark
            <path
              d="M19.5 23L22 25.5L26.5 20.5"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : isWarning ? (
            // Exclamation Warning
            <g>
              <path d="M23 19V23.5" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="23" cy="26.5" r="1.2" fill="#F59E0B" />
            </g>
          ) : isCritical ? (
            // Critical Alert
            <g>
              <path d="M20.5 20.5L25.5 25.5M25.5 20.5L20.5 25.5" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          ) : isScanning ? (
            // Radar Reticle / Scanning Arc
            <g>
              <circle
                cx="23"
                cy="23"
                r="4.5"
                stroke={accentCyan}
                strokeWidth="1.5"
                strokeDasharray="4 3"
                className="animate-spin"
                style={{ transformOrigin: "23px 23px", animationDuration: "1.8s" }}
              />
              <circle cx="23" cy="23" r="1.5" fill={accentCyan} />
            </g>
          ) : (
            // Central Radar Core + Spark
            <g>
              <circle cx="23" cy="23" r="2.5" fill="url(#usi-grad-primary)" />
              <circle cx="23" cy="23" r="5" stroke="url(#usi-grad-primary)" strokeWidth="1" strokeOpacity="0.4" />
            </g>
          )}

          {/* AI 4-Point Diamond Spark (Top Right) */}
          <path
            d="M36 6L37.2 9.8L41 11L37.2 12.2L36 16L34.8 12.2L31 11L34.8 9.8L36 6Z"
            fill={accentCyan}
            className="animate-pulse"
          />

          {/* Secondary AI Micro Spark (Lower Left) */}
          <path
            d="M12 30L12.7 32.3L15 33L12.7 33.7L12 36L11.3 33.7L9 33L11.3 32.3L12 30Z"
            fill={secondaryStroke}
            opacity="0.8"
          />
        </svg>
      </div>
    );
  }

  // Compact Variant (Ideal for Buttons and Badges)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 transition-transform duration-200 ${
        isScanning ? "animate-pulse" : ""
      } ${className}`}
    >
      <defs>
        <linearGradient id="usi-compact-grad" x1="2" y1="2" x2="18" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={primaryStroke} />
          <stop offset="100%" stopColor={accentCyan} />
        </linearGradient>
      </defs>

      {/* Modern Shield Silhouette */}
      <path
        d="M10 2L3.5 4.5V9.8C3.5 14.2 6.3 17.8 10 19C13.7 17.8 16.5 14.2 16.5 9.8V4.5L10 2Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="url(#usi-compact-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Internal Magnifier Lens Reticle */}
      <circle
        cx="9.5"
        cy="9.5"
        r="3.5"
        stroke="url(#usi-compact-grad)"
        strokeWidth="1.3"
      />
      <path
        d="M12 12L14.5 14.5"
        stroke="url(#usi-compact-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* State Indicator in Lens Center */}
      {isSafe ? (
        <path
          d="M8 9.5L9 10.5L11 8.5"
          stroke="#10B981"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : isWarning ? (
        <circle cx="9.5" cy="9.5" r="1.2" fill="#F59E0B" />
      ) : isCritical ? (
        <circle cx="9.5" cy="9.5" r="1.2" fill="#E11D48" />
      ) : (
        <circle cx="9.5" cy="9.5" r="1" fill={accentCyan} />
      )}

      {/* 4-Point AI Spark in Corner */}
      <path
        d="M15.5 2.5L16 4L17.5 4.5L16 5L15.5 6.5L15 5L13.5 4.5L15 4L15.5 2.5Z"
        fill={accentCyan}
      />
    </svg>
  );
}
