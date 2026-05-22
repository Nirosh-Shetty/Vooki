"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle theme"
        className={cn(
          "text-[color:var(--vooki-app-text-soft)] hover:bg-[color:var(--vooki-app-surface-hover)] hover:text-[color:var(--vooki-app-text-strong)]",
          className
        )}
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      className={cn(
        "text-[color:var(--vooki-app-text-soft)] hover:bg-[color:var(--vooki-app-surface-hover)] hover:text-[color:var(--vooki-app-text-strong)]",
        className
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
