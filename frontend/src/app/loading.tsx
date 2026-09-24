import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="xl" />
        <p className="text-sm font-medium text-slate-400 tracking-wider uppercase animate-pulse">
          Loading Nightlife Platform...
        </p>
      </div>
    </div>
  );
}
