import { cn } from "@/lib/utils";

type ApiStatus = "healthy" | "degraded" | "down";

interface ApiStatusIndicatorProps {
  status: ApiStatus;
  showLabel?: boolean;
  className?: string;
}

const statusConfig: Record<ApiStatus, { label: string; color: string; pulse: boolean }> = {
  healthy: {
    label: "Operational",
    color: "bg-green-500",
    pulse: false,
  },
  degraded: {
    label: "Degraded",
    color: "bg-yellow-500",
    pulse: true,
  },
  down: {
    label: "Down",
    color: "bg-destructive",
    pulse: true,
  },
};

export function ApiStatusIndicator({ status, showLabel = true, className }: ApiStatusIndicatorProps) {
  const config = statusConfig[status];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <div className={cn("h-2 w-2 rounded-full", config.color)} />
        {config.pulse && (
          <div className={cn("absolute inset-0 h-2 w-2 rounded-full animate-ping", config.color, "opacity-75")} />
        )}
      </div>
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          {config.label}
        </span>
      )}
    </div>
  );
}
