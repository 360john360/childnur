"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return (
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
                <div className="w-8 h-8" />
            </div>
        );
    }

    const themes = [
        { value: "light", icon: Sun, label: "Light" },
        { value: "dark", icon: Moon, label: "Dark" },
        { value: "system", icon: Monitor, label: "System" },
    ];

    return (
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
            {themes.map(({ value, icon: Icon, label }) => (
                <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`p-2 rounded-md transition-all ${theme === value
                            ? "bg-background shadow-sm text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        }`}
                    title={label}
                >
                    <Icon className="h-4 w-4" />
                </button>
            ))}
        </div>
    );
}
