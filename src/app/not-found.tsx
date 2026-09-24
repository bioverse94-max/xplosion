import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full p-8 rounded-2xl bg-surface border border-surface-border text-center space-y-6 shadow-2xl">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-neon">
          <Compass className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white font-display">404 - Page Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The page you are looking for does not exist or has been relocated within the event network.
          </p>
        </div>
        <div className="pt-2 flex justify-center">
          <Link href="/">
            <Button variant="primary" leftIcon={<Home className="h-4 w-4" />}>
              Return to Main Stage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
