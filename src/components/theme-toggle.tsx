"use client";

import { MoonStar, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { useIsClient } from "@/lib/use-is-client";

export function ThemeToggle() {
  const isClient = useIsClient();
  const { theme, toggleTheme } = useTheme();
  if (!isClient) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label="Theme toggle"
        className="h-10 rounded-full border-border/70 bg-card/85 px-3 text-foreground"
      >
        <MoonStar className="size-4" />
        <span className="text-xs">Dark</span>
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label="Theme toggle"
      onClick={toggleTheme}
      className="h-10 rounded-full border-border/70 bg-card/85 px-3 text-foreground"
    >
      {isDark ? <Sun className="size-4" /> : <MoonStar className="size-4" />}
      <span className="text-xs">{isDark ? "Light" : "Dark"}</span>
    </Button>
  );
}
