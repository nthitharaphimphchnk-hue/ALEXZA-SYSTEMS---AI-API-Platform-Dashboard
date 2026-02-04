import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Copy, ArrowRight, Folder, Key, Zap } from "lucide-react";
import { toast } from "sonner";

export default function QuickStart() {
  const { t } = useLanguage();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const sampleText = t("examples.sampleText");
  const apiKeyPlaceholder = t("apiKeys.placeholderKey");

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    toast.success(t("common.copied"));
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const steps = [
    {
      id: 1,
      icon: Folder,
      title: t("quickstart.step1.title"),
      description: t("quickstart.step1.description"),
      time: t("quickstart.step1.time"),
    },
    {
      id: 2,
      icon: Key,
      title: t("quickstart.step2.title"),
      description: t("quickstart.step2.description"),
      time: t("quickstart.step2.time"),
    },
    {
      id: 3,
      icon: Zap,
      title: t("quickstart.step3.title"),
      description: t("quickstart.step3.description"),
      time: t("quickstart.step3.time"),
    },
  ];

  const curlExample = `curl -X POST https://api.alexza.systems/v1/tti/process \\
  -H "Authorization: Bearer ${apiKeyPlaceholder}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "${sampleText}",
    "options": {
      "apply_rules": true,
      "return_analysis": true
    }
  }'`;

  const pythonExample = `import requests

url = "https://api.alexza.systems/v1/tti/process"
headers = {
    "Authorization": "Bearer ${apiKeyPlaceholder}",
    "Content-Type": "application/json"
}
data = {
    "text": "${sampleText}",
    "options": {
        "apply_rules": True,
        "return_analysis": True
    }
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(result)`;

  const javascriptExample = `const response = await fetch('https://api.alexza.systems/v1/tti/process', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${apiKeyPlaceholder}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: '${sampleText}',
    options: {
      apply_rules: true,
      return_analysis: true
    }
  })
});

const result = await response.json();
console.log(result);`;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b border-border bg-card">
        <div className="container py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">{t("quickstart.title")}</h1>
            <p className="text-xl text-muted-foreground mb-8">
              {t("quickstart.subtitle")}
            </p>
            <div className="flex items-center gap-4">
              <Button size="lg" onClick={() => setCurrentStep(1)}>
                {t("quickstart.getStarted")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="/playground">{t("quickstart.tryPlayground")}</a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview: What You'll Build */}
      <div className="container py-12 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-2">{t("quickstart.preview.title")}</h2>
            <p className="text-muted-foreground">
              {t("quickstart.preview.description")}
            </p>
          </div>
          
          <Tabs defaultValue="curl" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="curl">{t("docs.examples.curl")}</TabsTrigger>
              <TabsTrigger value="python">{t("docs.examples.python")}</TabsTrigger>
              <TabsTrigger value="javascript">{t("docs.examples.javascript")}</TabsTrigger>
            </TabsList>

            <TabsContent value="curl" className="space-y-4">
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto border border-border">
                  <code>{curlExample}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(curlExample, "preview-curl")}
                >
                  {copiedCode === "preview-curl" ? (
                    <Check className="h-4 w-4 text-foreground" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="python" className="space-y-4">
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto border border-border">
                  <code>{pythonExample}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(pythonExample, "preview-python")}
                >
                  {copiedCode === "preview-python" ? (
                    <Check className="h-4 w-4 text-foreground" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="javascript" className="space-y-4">
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto border border-border">
                  <code>{javascriptExample}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(javascriptExample, "preview-javascript")}
                >
                  {copiedCode === "preview-javascript" ? (
                    <Check className="h-4 w-4 text-foreground" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t("quickstart.preview.followSteps")}
            </p>
          </div>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid lg:grid-cols-[300px_1fr] gap-8">
          {/* Steps Sidebar */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
              {t("quickstart.steps")}
            </h2>
            {steps.map((step) => {
              const Icon = step.icon;
              const isComplete = currentStep > step.id;
              const isActive = currentStep === step.id;

              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    isActive
                      ? "bg-muted border-foreground"
                      : isComplete
                      ? "bg-muted/50 border-border"
                      : "border-border hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isComplete
                          ? "bg-foreground text-background"
                          : isActive
                          ? "bg-foreground/20 text-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isComplete ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-medium text-sm">{step.title}</h3>
                        <span className="text-xs text-muted-foreground">{step.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Step 1: Create Project */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-foreground/20 text-foreground flex items-center justify-center">
                      <Folder className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>{t("quickstart.step1.title")}</CardTitle>
                      <CardDescription>{t("quickstart.step1.time")}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">{t("quickstart.step1.whatYouNeed")}</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{t("quickstart.step1.requirement1")}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{t("quickstart.step1.requirement2")}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-muted/50 p-6 rounded-lg border border-border">
                    <h3 className="font-semibold mb-4">{t("quickstart.step1.howTo")}</h3>
                    <ol className="space-y-3 text-sm">
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0">
                          1
                        </span>
                        <span>{t("quickstart.step1.instruction1")}</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0">
                          2
                        </span>
                        <span>{t("quickstart.step1.instruction2")}</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0">
                          3
                        </span>
                        <span>{t("quickstart.step1.instruction3")}</span>
                      </li>
                    </ol>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => setCurrentStep(2)}>
                      {t("quickstart.next")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Get API Key */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-foreground/20 text-foreground flex items-center justify-center">
                      <Key className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>{t("quickstart.step2.title")}</CardTitle>
                      <CardDescription>{t("quickstart.step2.time")}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-muted/50 p-6 rounded-lg border border-border">
                    <h3 className="font-semibold mb-4">{t("quickstart.step2.howTo")}</h3>
                    <ol className="space-y-3 text-sm">
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0">
                          1
                        </span>
                        <span>{t("quickstart.step2.instruction1")}</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0">
                          2
                        </span>
                        <span>{t("quickstart.step2.instruction2")}</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold shrink-0">
                          3
                        </span>
                        <span>{t("quickstart.step2.instruction3")}</span>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <span className="text-destructive">⚠</span>
                      {t("quickstart.step2.warning")}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {t("quickstart.step2.warningText")}
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(1)}>
                      {t("quickstart.back")}
                    </Button>
                    <Button onClick={() => setCurrentStep(3)}>
                      {t("quickstart.next")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Make Request */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-foreground/20 text-foreground flex items-center justify-center">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>{t("quickstart.step3.title")}</CardTitle>
                      <CardDescription>{t("quickstart.step3.time")}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">{t("quickstart.step3.chooseMethod")}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("quickstart.step3.methodDescription")}
                    </p>
                  </div>

                  <Tabs defaultValue="curl" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="curl">{t("docs.examples.curl")}</TabsTrigger>
                      <TabsTrigger value="python">{t("docs.examples.python")}</TabsTrigger>
                      <TabsTrigger value="javascript">{t("docs.examples.javascript")}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="curl" className="space-y-4">
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto border border-border">
                          <code>{curlExample}</code>
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(curlExample, "curl")}
                        >
                          {copiedCode === "curl" ? (
                            <Check className="h-4 w-4 text-foreground" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="python" className="space-y-4">
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto border border-border">
                          <code>{pythonExample}</code>
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(pythonExample, "python")}
                        >
                          {copiedCode === "python" ? (
                            <Check className="h-4 w-4 text-foreground" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="javascript" className="space-y-4">
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto border border-border">
                          <code>{javascriptExample}</code>
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(javascriptExample, "javascript")}
                        >
                          {copiedCode === "javascript" ? (
                            <Check className="h-4 w-4 text-foreground" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="bg-muted/50 p-6 rounded-lg border border-border">
                    <h3 className="font-semibold mb-3">{t("quickstart.step3.expectedResponse")}</h3>
                    <pre className="bg-background p-4 rounded text-sm overflow-x-auto border border-border">
                      <code>{`{
  "success": true,
  "data": {
    "original_text": "ข้อความภาษาไทยที่ต้องการประมวลผล",
    "processed_text": "ข้อความที่ประมวลผลแล้ว",
    "analysis": {
      "rules_applied": ["rule_1", "rule_2"],
      "confidence": 0.95
    }
  },
  "request_id": "req_abc123"
}`}</code>
                    </pre>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(2)}>
                      {t("quickstart.back")}
                    </Button>
                    <Button asChild>
                      <a href="/playground">{t("quickstart.tryPlayground")}</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>{t("quickstart.nextSteps.title")}</CardTitle>
                <CardDescription>{t("quickstart.nextSteps.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <a
                    href="/documentation"
                    className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <h3 className="font-semibold mb-2">{t("quickstart.nextSteps.docs")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("quickstart.nextSteps.docsDescription")}
                    </p>
                  </a>
                  <a
                    href="/playground"
                    className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <h3 className="font-semibold mb-2">{t("quickstart.nextSteps.playground")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("quickstart.nextSteps.playgroundDescription")}
                    </p>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
