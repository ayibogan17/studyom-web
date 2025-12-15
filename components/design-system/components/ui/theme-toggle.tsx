"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted] = useState(() => typeof window !== "undefined");
  const current = theme === "system" ? resolvedTheme : theme;

  return (
    <Button
      variant="secondary"
      size="sm"
      type="button"
      aria-label="Tema değiştir"
      onClick={() => setTheme(current === "dark" ? "light" : "dark")}
      className="px-2"
    >
      {mounted && current === "dark" ? (
        <Moon size={18} aria-hidden />
      ) : (
        <Sun size={18} aria-hidden />
      )}
    </Button>
  );
}
