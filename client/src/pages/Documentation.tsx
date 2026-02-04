import ProjectDashboardLayout from "@/components/ProjectDashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyCodeBlock } from "@/components/CopyCodeBlock";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";

export default function Documentation() {
  const params = useParams<{ id: string }>();
  const projectId = params.id ? parseInt(params.id) : null;
  const [, setLocation] = useLocation();

  const baseUrl =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
    "https://api.alexza.systems";

  const playgroundPath = projectId ? `/project/${projectId}/playground` : "/playground";

  const apiReference = [
    {
      id: "decide-font",
      method: "POST",
      path: "/tti/decide-font",
      title: "Decide font",
      description: "Choose typography settings for Thai text based on content and intent.",
      headers: `Authorization: Bearer tti_your_api_key_here\nContent-Type: application/json`,
      requestBody: `{\n  "text": "ข้อความภาษาไทย"\n}`,
      responseBody: `{\n  "font": "Inter",\n  "score": 0.92,\n  "reason": "…"\n}`,
      example: `curl -X POST "${baseUrl}/tti/decide-font" \\\n  -H "Authorization: Bearer tti_your_api_key_here" \\\n  -H "Content-Type: application/json" \\\n  -d '{"text":"สวัสดีครับ"}'`,
      errors: [
        { code: "401", description: "Missing or invalid API key" },
        { code: "403", description: "Key does not have permission" },
        { code: "429", description: "Rate limit exceeded" },
        { code: "500", description: "Internal server error" },
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
            <img src="/alexza-logo-full.png" alt="ALEXZA SYSTEMS" className="h-10 w-auto" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">API Documentation</h1>
              <p className="text-sm text-muted-foreground">
                Reference and examples for using ALEXZA APIs
              </p>
            </div>
          </div>
          <p className="text-muted-foreground">
            Copy-first docs that stay close to real usage.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar Navigation */}
          <Card className="border-border/50 lg:col-span-1 h-fit sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Contents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { label: "API Reference", href: "#api-reference" },
                { label: "Quickstart", href: "#quickstart" },
                { label: "Errors", href: "#errors" },
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
                  <CardTitle>API Reference</CardTitle>
                  <CardDescription>Search and open endpoint details.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 lg:grid-cols-[280px,1fr]">
                  <div className="space-y-3">
                    <Input
                      placeholder="Search endpoints…"
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

                      <CopyCodeBlock label="Required headers" code={activeReference.headers} />
                      <CopyCodeBlock label="Request body" code={activeReference.requestBody} />
                      <CopyCodeBlock label="Example response" code={activeReference.responseBody} />
                      <CopyCodeBlock label="Example request" code={activeReference.example} />

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setLocation(playgroundPath)}
                        >
                          Try in Playground <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Errors</p>
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
                      No endpoints match your search.
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Getting Started */}
            <section id="quickstart">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Quickstart</CardTitle>
                  <CardDescription>
                    Authentication, base URL, and your first request.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    Reference and examples for using ALEXZA APIs. Start with one key and one request.
                  </p>

                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">Authentication (Bearer API key)</p>
                    <CopyCodeBlock
                      id="qs-auth"
                      code={`Authorization: Bearer tti_your_api_key_here`}
                    />
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">Base URL</p>
                    <CopyCodeBlock id="qs-base-url" code={baseUrl} />
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">First request</p>
                    <CopyCodeBlock
                      id="qs-first-request"
                      code={`curl -X POST "${baseUrl}/tti/decide-font" \\\n  -H "Authorization: Bearer tti_your_api_key_here" \\\n  -H "Content-Type: application/json" \\\n  -d '{"text":"สวัสดีครับ"}'`}
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => setLocation(playgroundPath)}
                      >
                        Try in Playground <ArrowRight className="h-4 w-4" />
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
                  <CardTitle>Errors & status codes</CardTitle>
                  <CardDescription>Common error responses and their meanings.</CardDescription>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 font-medium">Code</th>
                        <th className="text-left py-2 font-medium">Status</th>
                        <th className="text-left py-2 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-border/50">
                        <td className="py-2 font-mono">401</td>
                        <td className="py-2">Unauthorized</td>
                        <td className="py-2">Missing or invalid API key</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 font-mono">403</td>
                        <td className="py-2">Forbidden</td>
                        <td className="py-2">API key does not have permission</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 font-mono">429</td>
                        <td className="py-2">Too Many Requests</td>
                        <td className="py-2">Rate limit exceeded</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 font-mono">500</td>
                        <td className="py-2">Server Error</td>
                        <td className="py-2">Internal server error</td>
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
                  <CardTitle>Examples</CardTitle>
                  <CardDescription>
                    Integration examples in popular programming languages.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="curl" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="curl">cURL</TabsTrigger>
                      <TabsTrigger value="python">Python</TabsTrigger>
                      <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                      <TabsTrigger value="go">Go</TabsTrigger>
                    </TabsList>
                    <TabsContent value="curl" className="mt-4">
                      <CopyCodeBlock
                        id="curl-example"
                        code={`curl -X POST "${baseUrl}/tti/decide-font" \\
  -H "Authorization: Bearer tti_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"text":"สวัสดีครับ"}'`}
                      />
                    </TabsContent>
                    <TabsContent value="python" className="mt-4">
                      <CopyCodeBlock
                        id="python-example"
                        code={`import requests

response = requests.post(
    "${baseUrl}/tti/decide-font",
    headers={
        "Authorization": "Bearer tti_your_api_key_here",
        "Content-Type": "application/json"
    },
    json={
        "text": "สวัสดีครับ"
    }
)

data = response.json()
print(data)`}
                      />
                    </TabsContent>
                    <TabsContent value="javascript" className="mt-4">
                      <CopyCodeBlock
                        id="js-example"
                        code={`const res = await fetch("${baseUrl}/tti/decide-font", {\n  method: "POST",\n  headers: {\n    Authorization: "Bearer tti_your_api_key_here",\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify({ text: "สวัสดีครับ" }),\n});\n\nconst data = await res.json();\nconsole.log(data);`}
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
        "text": "สวัสดีครับ",
    }
    body, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest(
        "POST",
        "${baseUrl}/tti/decide-font",
        bytes.NewBuffer(body),
    )
    req.Header.Set("Authorization", "Bearer tti_your_api_key_here")
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
