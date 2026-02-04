import ProjectDashboardLayout from "@/components/ProjectDashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyCodeBlock } from "@/components/CopyCodeBlock";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight } from "lucide-react";
import { useLocation, useParams } from "wouter";

export default function Documentation() {
  const params = useParams<{ id: string }>();
  const projectId = params.id ? parseInt(params.id) : null;
  const [, setLocation] = useLocation();

  const baseUrl =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
    "https://api.alexza.systems";

  const playgroundPath = projectId ? `/project/${projectId}/playground` : "/playground";

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
                { label: "Quickstart", href: "#quickstart" },
                { label: "Endpoints", href: "#endpoints" },
                { label: "Errors", href: "#errors" },
                { label: "Examples", href: "#examples" },
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

            {/* Authentication */}
            <section id="authentication">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Authentication</CardTitle>
                  <CardDescription>
                    How to authenticate your API requests.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    All API requests must include your API key in the Authorization header:
                  </p>
                  <CopyCodeBlock
                    id="auth-header"
                    label="Header"
                    code={`Authorization: Bearer tti_your_api_key_here`}
                  />
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">
                      <strong>Security Warning:</strong> Never expose your API key in client-side
                      code. Always make API calls from your server.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Endpoints */}
            <section id="endpoints">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Endpoints reference</CardTitle>
                  <CardDescription>Cards you can copy from.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-secondary rounded-lg">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-muted/50 text-foreground text-xs font-medium rounded">
                          POST
                        </span>
                        <code className="text-sm font-mono">/tti/decide-font</code>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => setLocation(playgroundPath)}
                        >
                          Try this endpoint in Playground <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Decide typography settings for Thai text. Use this as your first request.
                      </p>
                    </div>
                    <div className="p-4 bg-secondary rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 bg-muted/30 text-muted-foreground text-xs font-medium rounded">
                          SOON
                        </span>
                        <code className="text-sm font-mono">/…</code>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        More endpoints will appear here as ALEXZA expands the API surface.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Request Format */}
            <section id="request-format">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Request Format</CardTitle>
                  <CardDescription>Structure of API request payloads.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Send a POST request with JSON body to <span className="font-mono">/tti/decide-font</span>:
                  </p>
                  <CopyCodeBlock
                    id="request-format"
                    label="JSON"
                    code={`{\n  "text": "ข้อความภาษาไทย"\n}`}
                  />
                  <div className="space-y-2">
                    <h4 className="font-medium">Parameters</h4>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 font-medium">Field</th>
                          <th className="text-left py-2 font-medium">Type</th>
                          <th className="text-left py-2 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50">
                          <td className="py-2 font-mono">text</td>
                          <td className="py-2">string</td>
                          <td className="py-2">Required. The Thai text to process</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Response Format */}
            <section id="response-format">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Response Format</CardTitle>
                  <CardDescription>Structure of API response payloads.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CopyCodeBlock
                    id="response-format"
                    label="JSON"
                    code={`{\n  "font": "Inter",\n  "score": 0.92,\n  "reason": "…"\n}`}
                  />
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
