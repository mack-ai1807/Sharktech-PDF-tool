import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SearchPanel } from "@/components/SearchPanel";
import { PdfDocument } from "@/components/viewer/PdfDocument";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { UpdateToast } from "@/components/ui/UpdateToast";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { useViewerStore } from "@/stores/useViewerStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function App() {
  const isDarkMode = useViewerStore((s) => s.isDarkMode);

  // Keep <html> dark class in sync with store state
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  // Mount global keyboard shortcuts (Ctrl+F, Ctrl+O, arrows, etc.)
  useKeyboardShortcuts();

  return (
    <ErrorBoundary>
      <AppShell>
        {/* Search panel overlays the canvas when open */}
        <SearchPanel />
        {/* PDF renderer — PdfDocument handles empty/loading/error states */}
        <PdfDocument />
      </AppShell>
      {/* Auto-update toast — non-blocking, shows when update available */}
      <UpdateToast />
      {/* Global toast notifications */}
      <ToastContainer />
    </ErrorBoundary>
  );
}
