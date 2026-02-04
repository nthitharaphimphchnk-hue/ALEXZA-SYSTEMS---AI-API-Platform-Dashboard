import ProjectDashboardLayout from "@/components/ProjectDashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { isMockMode } from "@/_core/mock/mockMode";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Play,
  Settings2,
  Sparkles,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

interface PlaygroundResult {
  steps: {
    input: { text: string; timestamp: string };
    aiTranslation: {
      detected_language: string;
      intent: string;
      confidence: number;
      entities: { type: string; value: string; position: number }[];
      timestamp: string;
    };
    ruleEngine: {
      rules_applied: { rule: string; status: string }[];
      warnings: string[];
      suggestions: string[];
      timestamp: string;
    };
    result: {
      original_text: string;
      processed_text: string;
      typography_score: number;
      character_count: number;
      word_count: number;
      timestamp: string;
    };
  };
  metadata: {
    responseTimeMs: number;
    apiVersion: string;
  };
}

export default function Playground() {
  const params = useParams<{ id?: string }>();
  const projectId = params.id ? parseInt(params.id) : null;
  const isStandalone = !params.id; // Standalone mode when no project ID
  const [, setLocation] = useLocation();

  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<PlaygroundResult | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);

  const analyzeMutation = trpc.playground.analyze.useMutation({
    onSuccess: (data) => {
      setResult(data as PlaygroundResult);
      setActiveStep(4);
    },
    onError: (error) => {
      try {
        const code = error.data?.code as string | undefined;
        if (code === "TOO_MANY_REQUESTS") {
          toast.error("Rate limit exceeded. Please try again later.");
          return;
        }
        if (code === "BAD_REQUEST") {
          toast.error("Invalid request", { description: error.message ?? undefined });
          return;
        }
        if (code === "PRECONDITION_FAILED") {
          toast.error("TTI API not configured");
          return;
        }
        toast.error("Analysis failed", { description: error.message ?? "Something went wrong." });
      } catch {
        toast.error("Analysis failed", { description: "Something went wrong." });
      }
    },
  });

  const handleAnalyze = () => {
    if (!inputText.trim()) return;
    setResult(null);
    setActiveStep(1);
    // Use projectId if available, otherwise use 0 for demo mode
    analyzeMutation.mutate({ projectId: projectId || 0, text: inputText });
  };

  const steps = [
    { icon: FileText, label: "Input", description: "Text input received" },
    { icon: Brain, label: "AI Translation", description: "Analyzing intent" },
    { icon: Settings2, label: "Rule Engine", description: "Applying rules" },
    { icon: Sparkles, label: "Result", description: "Output generated" },
  ];

  const content = (
    <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Playground</h1>
          <p className="text-muted-foreground">
            Test the TTI API interactively. Enter Thai text to see the full processing pipeline.
          </p>
        </div>

        {result ? (
          <Card className="border-border/50 bg-card/50">
            <CardContent className="pt-6 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  This request will appear in <span className="text-foreground font-medium">Usage</span>
                  {isMockMode() ? " (mock data)" : ""}.
                </p>
                <div className="flex items-center gap-2">
                  {projectId ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setLocation(`/project/${projectId}/usage`)}
                      >
                        View Usage <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => setLocation(`/project/${projectId}/docs#endpoints`)}
                      >
                        Endpoint docs <ArrowRight className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setLocation("/quickstart")}
                    >
                      View quickstart <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                You can reuse the request example from API Keys or Documentation in your app.
              </p>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Section */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Input Text
              </CardTitle>
              <CardDescription>
                Enter Thai text to analyze through the TTI pipeline.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="พิมพ์ข้อความภาษาไทยที่นี่เพื่อทดสอบระบบ TTI API..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={8}
                className="resize-none font-mono text-sm"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {inputText.length} characters
                </span>
                <Button
                  onClick={handleAnalyze}
                  disabled={!inputText.trim() || analyzeMutation.isPending}
                  className="gap-2"
                >
                  {analyzeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Analyze
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pipeline Visualization */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Processing Pipeline
              </CardTitle>
              <CardDescription>
                Watch the text flow through each processing stage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const isActive = analyzeMutation.isPending && activeStep === index + 1;
                  const isComplete = activeStep > index + 1 || (result && activeStep === 4);
                  const Icon = step.icon;

                  return (
                    <div key={step.label} className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                          isComplete
                            ? "bg-muted/50 text-foreground"
                            : isActive
                            ? "bg-primary/20 text-primary animate-pulse"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : isActive ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-medium ${
                            isComplete || isActive ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                      {index < steps.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                      )}
                    </div>
                  );
                })}
              </div>

              {result && (
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Completed in {result.metadata.responseTimeMs}ms
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        {result && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* AI Translation Result */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  AI Intent Translation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Language</p>
                    <p className="font-medium">{result.steps.aiTranslation.detected_language.toUpperCase()}</p>
                  </div>
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                    <p className="font-medium">{(result.steps.aiTranslation.confidence * 100).toFixed(1)}%</p>
                  </div>
                </div>
                <div className="p-3 bg-secondary rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Intent</p>
                  <p className="font-medium">{result.steps.aiTranslation.intent}</p>
                </div>
                {result.steps.aiTranslation.entities.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Detected Entities</p>
                    <div className="flex flex-wrap gap-2">
                      {result.steps.aiTranslation.entities.map((entity, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md font-mono"
                        >
                          {entity.value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rule Engine Result */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-primary" />
                  Rule Engine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Rules Applied</p>
                  <div className="space-y-2">
                    {result.steps.ruleEngine.rules_applied.map((rule, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 bg-secondary rounded-lg"
                      >
                        <span className="text-sm font-mono">{rule.rule}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            rule.status === "applied"
                              ? "bg-muted/50 text-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {rule.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {result.steps.ruleEngine.suggestions.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Suggestions</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {result.steps.ruleEngine.suggestions.map((suggestion, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Final Result */}
            <Card className="border-border/50 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Final Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Processed Text</p>
                      <div className="p-4 bg-secondary rounded-lg font-mono text-sm">
                        {result.steps.result.processed_text}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-primary/10 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">Typography Score</p>
                      <p className="text-4xl font-bold text-primary">
                        {result.steps.result.typography_score}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-secondary rounded-lg text-center">
                        <p className="text-xs text-muted-foreground mb-1">Characters</p>
                        <p className="text-xl font-semibold">
                          {result.steps.result.character_count}
                        </p>
                      </div>
                      <div className="p-3 bg-secondary rounded-lg text-center">
                        <p className="text-xs text-muted-foreground mb-1">Words</p>
                        <p className="text-xl font-semibold">{result.steps.result.word_count}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sample Texts */}
        {!result && (
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Sample Texts</CardTitle>
              <CardDescription>Click to try these example inputs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  "สวัสดีครับ ยินดีต้อนรับสู่ระบบ TTI API",
                  "การออกแบบตัวอักษรไทยที่ดีต้องคำนึงถึงความสวยงามและความอ่านง่าย",
                  "ภาษาไทยมีวรรณยุกต์ 4 รูป และสระที่หลากหลาย ทำให้การจัดวางตัวอักษรมีความซับซ้อน",
                ].map((text, i) => (
                  <button
                    key={i}
                    onClick={() => setInputText(text)}
                    className="p-4 text-left bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-sm"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );

  // Standalone mode: render without ProjectDashboardLayout
  if (isStandalone) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
          <div className="container flex h-16 items-center justify-between">
            <a href="/" className="flex items-center">
              <img src="/alexza-logo.png" alt="ALEXZA" className="h-8 w-auto" />
            </a>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <a href="/">Back to Projects</a>
              </Button>
            </div>
          </div>
        </header>
        <div className="container py-8">
          {content}
        </div>
      </div>
    );
  }

  // Project mode: render with ProjectDashboardLayout
  return <ProjectDashboardLayout>{content}</ProjectDashboardLayout>;
}
