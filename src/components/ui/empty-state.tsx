import React from "react";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";
import { Button } from "./button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-surface-border bg-surface/30 backdrop-blur-sm",
        className
      )}
    >
      <div className="h-14 w-14 rounded-2xl bg-surface-border/60 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
        {icon || <Inbox className="h-7 w-7 text-slate-400" />}
      </div>
      <h3 className="text-lg font-bold text-white mb-1.5 font-display">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
