import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "success" | "error" | "warning" | "info";

interface AlertProps {
  variant: AlertVariant;
  title?: string;
  message: string;
  onClose?: () => void;
}

const variantStyles: Record<AlertVariant, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  success: {
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    text: "text-green-600 dark:text-green-400",
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  error: {
    bg: "bg-destructive/10",
    border: "border-destructive/20",
    text: "text-destructive",
    icon: <XCircle className="h-5 w-5" />,
  },
  warning: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    text: "text-yellow-600 dark:text-yellow-400",
    icon: <AlertCircle className="h-5 w-5" />,
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    icon: <Info className="h-5 w-5" />,
  },
};

export function Alert({ variant, title, message, onClose }: AlertProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border",
        styles.bg,
        styles.border
      )}
    >
      <div className={cn("mt-0.5", styles.text)}>
        {styles.icon}
      </div>
      <div className="flex-1 space-y-1">
        {title && (
          <p className={cn("text-sm font-medium", styles.text)}>
            {title}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {message}
        </p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={cn(
            "text-muted-foreground hover:text-foreground transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          )}
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
