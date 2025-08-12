import React from "react";
import { useTheme } from "../ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      title="Przełącz motyw"
      style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
    >
      <div
        style={{
          width: 56,
          height: 28,
          borderRadius: 999,
          position: "relative",
          background: isDark ? "#0A0C10" : "#E5E7EB",
          border: "1px solid var(--border)",
          boxShadow: isDark ? "inset 0 0 0 1px #000" : "inset 0 0 0 1px #fff",
          transition: "background .2s ease, box-shadow .2s ease"
        }}
      >
        <span style={{
          position: "absolute", left: 8, top: 4, fontSize: 14,
          opacity: isDark ? 0.35 : 1, transition: "opacity .2s ease"
        }}>☀</span>
        <span style={{
          position: "absolute", right: 8, top: 4, fontSize: 14,
          opacity: isDark ? 1 : 0.35, transition: "opacity .2s ease"
        }}>🌙</span>
        <div
          style={{
            position: "absolute", top: 2, left: 2, width: 24, height: 24, borderRadius: "50%",
            background: isDark ? "linear-gradient(145deg, var(--accent), #d9feb0)" : "white",
            boxShadow: "0 6px 16px #00000022",
            transform: isDark ? "translateX(28px)" : "translateX(0)",
            transition: "transform .2s ease, background .2s ease"
          }}
        />
      </div>
    </button>
  );
}
