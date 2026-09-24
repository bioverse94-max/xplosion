"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full p-8 rounded-2xl bg-surface border border-surface-border text-center space-y-6 shadow-2xl">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-accent-rose/10 border border-accent-rose/30 flex items-center justify-center text-accent-rose shadow-[0_0_25px_rgba(255,0,85,0.2)]">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white font-display">System Interruption</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            An unexpected error occurred while processing your request. All transactions remain cryptographically intact.
          </p>
        </div>
        <div className="pt-2 flex justify-center">
          <Button variant="primary" onClick={() => reset()} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Retry Request
          </Button>
        </div>
      </div>
    </div>
  );
}
