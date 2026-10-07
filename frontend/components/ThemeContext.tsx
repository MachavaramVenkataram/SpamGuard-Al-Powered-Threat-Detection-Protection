"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ThemeName = "violet" | "coral" | "mint" | "amber" | "rose" | "indigo";

export interface ThemeOption {
  id: ThemeName;
  name: string;
  palette: string;
  primaryColor: string;
  badgeBg: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: "violet", name: "Ivory + Violet", palette: "Electric Violet & Lavender", primaryColor: "#6D5DFB", badgeBg: "#F2F0FF" },
  { id: "coral", name: "White + Coral", palette: "Warm Coral & Rose", primaryColor: "#FF6B6B", badgeBg: "#FFF0F0" },
  { id: "mint", name: "Pearl + Mint", palette: "Emerald & Crisp Mint", primaryColor: "#38C9A7", badgeBg: "#EDFBF7" },
  { id: "amber", name: "Cream + Amber", palette: "Security Gold & Ochre", primaryColor: "#F5A623", badgeBg: "#FEF7EC" },
  { id: "rose", name: "White + Rose", palette: "Ruby & Soft Blossom", primaryColor: "#E96A9A", badgeBg: "#FDF0F5" },
  { id: "indigo", name: "Lavender + Indigo", palette: "Deep Periwinkle & Iris", primaryColor: "#4F46E5", badgeBg: "#EEF2FF" },
];

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  options: ThemeOption[];
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "violet",
  setTheme: () => {},
  options: THEME_OPTIONS,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("violet");

  useEffect(() => {
    const saved = localStorage.getItem("spamguard_theme") as ThemeName;
    if (saved && ["violet", "coral", "mint", "amber", "rose", "indigo"].includes(saved)) {
      setThemeState(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    localStorage.setItem("spamguard_theme", t);
    if (t === "violet") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", t);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, options: THEME_OPTIONS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
