import ProjectDashboardLayout from "@/components/ProjectDashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Documentation() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, language, id }: { code: string; language: string; id: string }) => (
    <div className="relative group">
      <pre className="p-4 bg-secondary rounded-lg overflow-x-auto text-sm font-mono">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => handleCopyCode(code, id)}
      >
        {copiedCode === id ? (
          <Check className="h-4 w-4 text-foreground" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  return (
    <ProjectDashboardLayout>
      <div className="space-y-6">
        {/* Hero Section with Branding */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img src="/alexza-logo-full.png" alt="ALEXZA SYSTEMS" className="h-10 w-auto" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">API Documentation</h1>
              <p className="text-sm text-muted-foreground">ALEXZA SYSTEMS Developer Platform</p>
            </div>
          </div>
          <p className="text-muted-foreground">
            Complete API reference and integration guides for the TTI API.
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
                { label: "Getting Started", href: "#getting-started" },
                { label: "Authentication", href: "#authentication" },
                { label: "Endpoints", href: "#endpoints" },
                { label: "Request Format", href: "#request-format" },
                { label: "Response Format", href: "#response-format" },
                { label: "Error Codes", href: "#error-codes" },
                { label: "Code Examples", href: "#code-examples" },
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
            <section id="getting-started">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Getting Started</CardTitle>
                  <CardDescription>
                    Quick start guide to integrate the TTI API into your application.
                  </CardDescription>
                </CardHeader>
                <CardContent className="prose prose-invert max-w-none">
                  <p className="text-muted-foreground">
                    The TTI (Thai Typography Intelligence) API provides advanced text analysis and
                    typography optimization for Thai language content. Follow these steps to get
                    started:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground mt-4">
                    <li>Create a project in the dashboard</li>
                    <li>Generate an API key from the API Keys page</li>
                    <li>Make your first API request using the examples below</li>
                    <li>Test your integration in the Playground</li>
                  </ol>
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
                  <CodeBlock
                    id="auth-header"
                    language="http"
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
                  <CardTitle>API Endpoints</CardTitle>
                  <CardDescription>Available endpoints and their purposes.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-secondary rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 bg-muted/50 text-foreground text-xs font-medium rounded">
                          POST
                        </span>
                        <code className="text-sm font-mono">/api/v1/analyze</code>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Analyze Thai text through the full TTI pipeline including AI intent
                        translation, rule engine processing, and typography scoring.
                      </p>
                    </div>
                    <div className="p-4 bg-secondary rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 bg-primary/20 text-primary text-xs font-medium rounded">
                          GET
                        </span>
                        <code className="text-sm font-mono">/api/v1/health</code>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Check the API service health and availability status.
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
                    Send a POST request with JSON body to the analyze endpoint:
                  </p>
                  <CodeBlock
                    id="request-format"
                    language="json"
                    code={`{
  "text": "ข้อความภาษาไทยที่ต้องการวิเคราะห์",
  "options": {
    "include_entities": true,
    "include_suggestions": true
  }
}`}
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
                          <td className="py-2">Required. The Thai text to analyze (max 10,000 chars)</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 font-mono">options</td>
                          <td className="py-2">object</td>
                          <td className="py-2">Optional. Configuration options</td>
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
                  <CodeBlock
                    id="response-format"
                    language="json"
                    code={`{
  "success": true,
  "data": {
    "ai_translation": {
      "detected_language": "th",
      "intent": "typography_analysis",
      "confidence": 0.95,
      "entities": [...]
    },
    "rule_engine": {
      "rules_applied": [...],
      "suggestions": [...]
    },
    "result": {
      "processed_text": "...",
      "typography_score": 95,
      "character_count": 42,
      "word_count": 8
    }
  },
  "metadata": {
    "response_time_ms": 150,
    "api_version": "1.0.0"
  }
}`}
                  />
                </CardContent>
              </Card>
            </section>

            {/* Error Codes */}
            <section id="error-codes">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Error Codes</CardTitle>
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
                        <td className="py-2 font-mono">400</td>
                        <td className="py-2">Bad Request</td>
                        <td className="py-2">Invalid request format or missing required fields</td>
                      </tr>
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
            <section id="code-examples">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Code Examples</CardTitle>
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
                      <CodeBlock
                        id="curl-example"
                        language="bash"
                        code={`curl -X POST https://api.alexza.systems/v1/analyze \\
  -H "Authorization: Bearer tti_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "สวัสดีครับ ยินดีต้อนรับ"
  }'`}
                      />
                    </TabsContent>
                    <TabsContent value="python" className="mt-4">
                      <CodeBlock
                        id="python-example"
                        language="python"
                        code={`import requests

response = requests.post(
    "https://api.alexza.systems/v1/analyze",
    headers={
        "Authorization": "Bearer tti_your_api_key",
        "Content-Type": "application/json"
    },
    json={
        "text": "สวัสดีครับ ยินดีต้อนรับ"
    }
)

data = response.json()
print(data["data"]["result"]["typography_score"])`}
                      />
                    </TabsContent>
                    <TabsContent value="javascript" className="mt-4">
                      <CodeBlock
                        id="js-example"
                        language="javascript"
                        code={`const response = await fetch(
  "https://api.alexza.systems/v1/analyze",
  {
    method: "POST",
    headers: {
      "Authorization": "Bearer tti_your_api_key",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text: "สวัสดีครับ ยินดีต้อนรับ"
    })
  }
);

const data = await response.json();
console.log(data.data.result.typography_score);`}
                      />
                    </TabsContent>
                    <TabsContent value="go" className="mt-4">
                      <CodeBlock
                        id="go-example"
                        language="go"
                        code={`package main

import (
    "bytes"
    "encoding/json"
    "net/http"
)

func main() {
    payload := map[string]string{
        "text": "สวัสดีครับ ยินดีต้อนรับ",
    }
    body, _ := json.Marshal(payload)
    
    req, _ := http.NewRequest(
        "POST",
        "https://api.alexza.systems/v1/analyze",
        bytes.NewBuffer(body),
    )
    req.Header.Set("Authorization", "Bearer tti_your_api_key")
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
    </ProjectDashboardLayout>
  );
}
