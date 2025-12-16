"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const effectiveTheme = (theme === "system" ? resolvedTheme : theme) ?? "light";
  const isDark = effectiveTheme === "dark";

  return (
    <Button
      variant="secondary"
      size="sm"
      type="button"
      aria-label="Tema değiştir"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="px-2"
    >
      <Sun size={18} aria-hidden className="block dark:hidden" />
      <Moon size={18} aria-hidden className="hidden dark:block" />
    </Button>
  );
}
