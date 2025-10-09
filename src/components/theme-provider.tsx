import { useEffect, useState } from "react";
import { ThemeContext } from "./theme-context";

type Theme = "dark" | "light";

// Helper para aplicar la clase <html class="dark"> de forma segura
function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1) Intentar cargar de localStorage
    let saved: Theme | null = null;
    try {
      saved = (localStorage.getItem("theme") as Theme | null) ?? null;
    } catch {
      // ignore
    }

    // 2) Fallback a prefers-color-scheme si no hay saved
    const preferred: Theme =
      saved ??
      (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");

    setThemeState(preferred);
    applyThemeClass(preferred);
    setMounted(true);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("theme", newTheme);
    } catch {
      // ignore
    }
    applyThemeClass(newTheme);
  };

  if (!mounted) return null; // evita FOUC

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

