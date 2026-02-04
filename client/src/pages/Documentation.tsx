import ProjectDashboardLayout from "@/components/ProjectDashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyCodeBlock } from "@/components/CopyCodeBlock";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Documentation() {
  const { t } = useLanguage();
  const params = useParams<{ id: string }>();
  const projectId = params.id ? parseInt(params.id) : null;
  const [, setLocation] = useLocation();

  const baseUrl =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
    "https://api.alexza.systems";
  const sampleText = t("examples.sampleText");

  const playgroundPath = projectId ? `/project/${projectId}/playground` : "/playground";

  const apiReference = [
    {
      id: "decide-font",
      method: "POST",
      path: "/tti/decide-font",
      title: t("docs.endpoint.decideFont.title"),
      description: t("docs.endpoint.decideFont.description"),
      headers: `Authorization: Bearer ${t("apiKeys.placeholderKey")}\nContent-Type: application/json`,
      requestBody: `{\n  "text": "${sampleText}"\n}`,
      responseBody: `{\n  "font": "Inter",\n  "score": 0.92,\n  "reason": "…"\n}`,
      example: `curl -X POST "${baseUrl}/tti/decide-font" \\\n  -H "Authorization: Bearer ${t("apiKeys.placeholderKey")}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"text":"${sampleText}"}'`,
      errors: [
        { code: "401", description: t("errors.unauthorized") },
        { code: "403", description: t("errors.forbidden") },
        { code: "429", description: t("errors.rateLimit") },
        { code: "500", description: t("errors.server") },
      ],
    },
  ];

  const [referenceQuery, setReferenceQuery] = useState("");
  const [activeRefId, setActiveRefId] = useState(apiReference[0]?.id ?? "");

  const filteredReference = useMemo(() => {
    const q = referenceQuery.trim().toLowerCase();
    if (!q) return apiReference;
    return apiReference.filter((item) =>
      [item.title, item.path, item.description].some((val) =>
        val.toLowerCase().includes(q)
      )
    );
  }, [referenceQuery]);

  const activeReference =
    filteredReference.find((item) => item.id === activeRefId) ??
    filteredReference[0] ??
    apiReference[0];

  const body = (
    <div className="space-y-6">
        {/* Hero Section with Branding */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img src="/alexza-logo-full.png" alt={t("brand.name")} className="h-10 w-auto" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{t("docs.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("docs.subtitle")}</p>
            </div>
          </div>
          <p className="text-muted-foreground">{t("docs.tagline")}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar Navigation */}
          <Card className="border-border/50 lg:col-span-1 h-fit sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{t("docs.contents")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { label: t("docs.apiReferenceTitle"), href: "#api-reference" },
                { label: t("docs.quickstartTitle"), href: "#quickstart" },
                { label: t("docs.errorsTitleShort"), href: "#errors" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  {item.label}
                </a>
              ))}
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* API Reference */}
            <section id="api-reference">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>{t("docs.apiReferenceTitle")}</CardTitle>
                  <CardDescription>{t("docs.apiReferenceDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 lg:grid-cols-[280px,1fr]">
                  <div className="space-y-3">
                    <Input
                      placeholder={t("docs.searchPlaceholder")}
                      value={referenceQuery}
                      onChange={(e) => setReferenceQuery(e.target.value)}
                    />
                    <div className="space-y-2">
                      {filteredReference.map((item) => (
                        <button
                          key={item.id}
                          className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                            activeReference?.id === item.id
                              ? "border-primary/40 bg-primary/10 text-foreground"
                              : "border-border/50 hover:bg-muted/30 text-muted-foreground"
                          }`}
                          onClick={() => setActiveRefId(item.id)}
                          type="button"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{item.title}</span>
                            <span className="text-xs font-mono">{item.method}</span>
                          </div>
                          <div className="text-xs font-mono mt-1">{item.path}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeReference ? (
                    <div className="rounded-lg border border-border/50 bg-card/30 p-4 space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 text-xs font-medium rounded bg-muted/50 text-foreground">
                          {activeReference.method}
                        </span>
                        <code className="text-sm font-mono">{activeReference.path}</code>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activeReference.description}
                      </p>

                      <CopyCodeBlock label={t("docs.requiredHeaders")} code={activeReference.headers} />
                      <CopyCodeBlock label={t("docs.requestBody")} code={activeReference.requestBody} />
                      <CopyCodeBlock label={t("docs.exampleResponse")} code={activeReference.responseBody} />
                      <CopyCodeBlock label={t("docs.exampleRequest")} code={activeReference.example} />

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setLocation(playgroundPath)}
                        >
                          {t("docs.tryInPlayground")} <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">{t("docs.errorsTitleShort")}</p>
                        <div className="flex flex-wrap gap-2">
                          {activeReference.errors.map((err) => (
                            <span
                              key={err.code}
                              className="px-2 py-1 text-xs rounded bg-muted/40 text-muted-foreground"
                            >
                              {err.code} · {err.description}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border/50 bg-card/30 p-4 text-sm text-muted-foreground">
                      {t("docs.noEndpoints")}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Getting Started */}
            <section id="quickstart">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>{t("docs.quickstartTitle")}</CardTitle>
                  <CardDescription>{t("docs.quickstartDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    {t("docs.quickstartIntro")}
                  </p>

                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">{t("docs.quickstartAuthLabel")}</p>
                    <CopyCodeBlock
                      id="qs-auth"
                      code={`Authorization: Bearer ${t("apiKeys.placeholderKey")}`}
                    />
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">{t("docs.baseUrl")}</p>
                    <CopyCodeBlock id="qs-base-url" code={baseUrl} />
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">{t("docs.firstRequest")}</p>
                    <CopyCodeBlock
                      id="qs-first-request"
                      code={`curl -X POST "${baseUrl}/tti/decide-font" \\\n  -H "Authorization: Bearer ${t("apiKeys.placeholderKey")}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"text":"${sampleText}"}'`}
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setLocation(playgroundPath)}
                      >
                        {t("docs.tryInPlayground")} <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>


            {/* Error Codes */}
            <section id="errors">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>{t("docs.errorsTitle")}</CardTitle>
                  <CardDescription>{t("docs.errorsDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 font-medium">{t("docs.errors.table.code")}</th>
                        <th className="text-left py-2 font-medium">{t("docs.errors.table.status")}</th>
                        <th className="text-left py-2 font-medium">{t("docs.errors.table.description")}</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-border/50">
                        <td className="py-2 font-mono">401</td>
                        <td className="py-2">{t("errors.unauthorizedTitle")}</td>
                        <td className="py-2">{t("errors.unauthorized")}</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 font-mono">403</td>
                        <td className="py-2">{t("errors.forbiddenTitle")}</td>
                        <td className="py-2">{t("errors.forbidden")}</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 font-mono">429</td>
                        <td className="py-2">{t("errors.rateLimitTitle")}</td>
                        <td className="py-2">{t("errors.rateLimit")}</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 font-mono">500</td>
                        <td className="py-2">{t("errors.serverTitle")}</td>
                        <td className="py-2">{t("errors.server")}</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </section>

            {/* Code Examples */}
            <section id="examples">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>{t("docs.examplesTitle")}</CardTitle>
                  <CardDescription>{t("docs.examplesDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="curl" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="curl">{t("docs.examples.curl")}</TabsTrigger>
                      <TabsTrigger value="python">{t("docs.examples.python")}</TabsTrigger>
                      <TabsTrigger value="javascript">{t("docs.examples.javascript")}</TabsTrigger>
                      <TabsTrigger value="go">{t("docs.examples.go")}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="curl" className="mt-4">
                      <CopyCodeBlock
                        id="curl-example"
                        code={`curl -X POST "${baseUrl}/tti/decide-font" \\
  -H "Authorization: Bearer ${t("apiKeys.placeholderKey")}" \\
  -H "Content-Type: application/json" \\
  -d '{"text":"${sampleText}"}'`}
                      />
                    </TabsContent>
                    <TabsContent value="python" className="mt-4">
                      <CopyCodeBlock
                        id="python-example"
                        code={`import requests

res = requests.post(
    "${baseUrl}/tti/decide-font",
    headers={
        "Authorization": "Bearer ${t("apiKeys.placeholderKey")}",
        "Content-Type": "application/json"
    },
    json={
        "text": "${sampleText}"
    }
)

data = res.json()
print(data)`}
                      />
                    </TabsContent>
                    <TabsContent value="javascript" className="mt-4">
                      <CopyCodeBlock
                        id="js-example"
                        code={`const res = await fetch("${baseUrl}/tti/decide-font", {\n  method: "POST",\n  headers: {\n    Authorization: "Bearer ${t("apiKeys.placeholderKey")}",\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify({ text: "${sampleText}" }),\n});\n\nconst data = await res.json();\nconsole.log(data);`}
                      />
                    </TabsContent>
                    <TabsContent value="go" className="mt-4">
                      <CopyCodeBlock
                        id="go-example"
                        code={`package main

import (
    "bytes"
    "encoding/json"
    "net/http"
)

func main() {
    payload := map[string]string{
        "text": "${sampleText}",
    }
    body, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest(
        "POST",
        "${baseUrl}/tti/decide-font",
        bytes.NewBuffer(body),
    )
    req.Header.Set("Authorization", "Bearer ${t("apiKeys.placeholderKey")}")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
}`}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
    </div>
  );

  if (projectId) {
    return <ProjectDashboardLayout>{body}</ProjectDashboardLayout>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-10">{body}</div>
    </div>
  );
}
