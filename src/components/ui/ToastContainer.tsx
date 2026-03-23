/**
 * ToastContainer.tsx
 * Fixed-position toast notification renderer.
 * Mount once in App.tsx — renders all active toasts.
 */
import React from "react";
import { useToastStore } from "@/stores/useToastStore";

const ICONS = {
  success: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  success: { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)",  icon: "#10b981" },
  error:   { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)",   icon: "#ef4444" },
  info:    { bg: "rgba(212,160,23,0.12)", border: "rgba(212,160,23,0.3)",  icon: "#D4A017" },
};

export const ToastContainer: React.FC = () => {
  const { toasts, remove } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => {
        const s = STYLES[t.type];
        return (
          <div
            key={t.id}
            className="flex items-center gap-3 px-4 py-3 rounded-xl pointer-events-auto
                       animate-fade-in shadow-xl max-w-sm"
            style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              backdropFilter: "blur(16px)",
              color: "#e5e5ea",
              boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${s.border}`,
            }}
            role="alert"
          >
            <span style={{ color: s.icon }}>{ICONS[t.type]}</span>
            <p className="text-sm font-medium flex-1">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="text-white/40 hover:text-white/80 transition-colors ml-1"
              aria-label="Dismiss"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
};
