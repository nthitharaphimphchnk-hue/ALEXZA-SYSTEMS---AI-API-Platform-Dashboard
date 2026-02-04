import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

type CopyCodeBlockProps = {
  code: string;
  /**
   * Optional id for "copied" state grouping.
   * When omitted, a stable React id is used.
   */
  id?: string;
  /**
   * Optional label shown above code (e.g. "cURL", "Headers").
   */
  label?: string;
};

export function CopyCodeBlock({ code, id, label }: CopyCodeBlockProps) {
  const reactId = useId();
  const [copied, setCopied] = useState(false);
  const key = id ?? reactId;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="space-y-2">
      {label ? (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ) : null}
      <div className="relative group">
        <pre className="p-4 bg-secondary rounded-lg overflow-x-auto text-sm font-mono border border-border/30">
          <code>{code}</code>
        </pre>
        <Button
          aria-label="Copy code"
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
          data-copied={copied ? "true" : "false"}
        >
          {copied ? (
            <Check className="h-4 w-4 text-foreground" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

