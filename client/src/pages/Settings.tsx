import { useAuth } from "@/_core/hooks/useAuth";
import ProjectDashboardLayout from "@/components/ProjectDashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Globe, Lock, Bell, Webhook, Settings as SettingsIcon, Trash2, Plus, XCircle } from "lucide-react";
import { useState } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const params = useParams<{ id: string }>();
  const projectId = params.id ? parseInt(params.id) : null;

  const { data: project } = trpc.project.get.useQuery(
    { id: projectId! },
    { enabled: !!projectId }
  );

  // Mock state for UI-first approach
  const [ipWhitelist, setIpWhitelist] = useState<string[]>(["192.168.1.1", "10.0.0.1"]);
  const [newIp, setNewIp] = useState("");
  const [webhooks, setWebhooks] = useState([
    { id: 1, url: "https://api.example.com/webhook", events: ["api.key.created", "quota.exceeded"], status: "active" }
  ]);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const handleAddIp = () => {
    if (newIp && /^(\d{1,3}\.){3}\d{1,3}$/.test(newIp)) {
      setIpWhitelist([...ipWhitelist, newIp]);
      setNewIp("");
      toast.success(t("settings.security.ipAdded"));
    } else {
      toast.error(t("settings.security.ipInvalid"));
    }
  };

  const handleRemoveIp = (ip: string) => {
    setIpWhitelist(ipWhitelist.filter(i => i !== ip));
    toast.success(t("settings.security.ipRemoved"));
  };

  const handleAddWebhook = () => {
    if (newWebhookUrl && selectedEvents.length > 0) {
      setWebhooks([...webhooks, {
        id: Date.now(),
        url: newWebhookUrl,
        events: selectedEvents,
        status: "active"
      }]);
      setNewWebhookUrl("");
      setSelectedEvents([]);
      toast.success(t("settings.webhooks.added"));
    } else {
      toast.error(t("settings.webhooks.missingFields"));
    }
  };

  const availableEvents = [
    { id: "api.key.created", label: t("settings.notifications.event.apiKeyCreated") },
    { id: "api.key.revoked", label: t("settings.notifications.event.apiKeyRevoked") },
    { id: "quota.exceeded", label: t("settings.notifications.event.quotaExceeded") },
    { id: "quota.warning", label: t("settings.notifications.event.quotaWarning") },
    { id: "unusual.activity", label: t("settings.notifications.event.unusualActivity") },
  ];

  if (!project) {
    return (
      <ProjectDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </ProjectDashboardLayout>
    );
  }

  return (
    <ProjectDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("settings.title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("settings.subtitle")}
          </p>
        </div>

        <Tabs defaultValue="project" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="project" className="gap-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{t("settings.tabs.project")}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">{t("settings.tabs.security")}</span>
            </TabsTrigger>
            <TabsTrigger value="limits" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{t("settings.tabs.limits")}</span>
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="gap-2">
              <Webhook className="h-4 w-4" />
              <span className="hidden sm:inline">{t("settings.tabs.webhooks")}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">{t("settings.tabs.notifications")}</span>
            </TabsTrigger>
          </TabsList>

          {/* Project Settings Tab */}
          <TabsContent value="project" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.project.title")}</CardTitle>
                <CardDescription>{t("settings.project.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">{t("settings.project.name")}</Label>
                  <Input
                    id="project-name"
                    defaultValue={project.name}
                    placeholder={t("settings.project.namePlaceholder")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("settings.project.nameHelp")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="environment">{t("settings.project.environment")}</Label>
                  <Input
                    id="environment"
                    value={project.environment}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("settings.project.environmentHelp")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">{t("settings.project.language")}</Label>
                  <Select defaultValue="en">
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">{t("language.english")}</SelectItem>
                      <SelectItem value="th">{t("language.thai")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t("settings.project.languageHelp")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">{t("settings.project.timezone")}</Label>
                  <Select defaultValue="utc">
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">{t("timezone.utc")}</SelectItem>
                      <SelectItem value="asia/bangkok">{t("timezone.bangkok")}</SelectItem>
                      <SelectItem value="america/new_york">{t("timezone.newYork")}</SelectItem>
                      <SelectItem value="europe/london">{t("timezone.london")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t("settings.project.timezoneHelp")}
                  </p>
                </div>

                <div className="pt-4">
                  <Button>{t("common.save")}</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.security.ipWhitelist")}</CardTitle>
                <CardDescription>{t("settings.security.ipWhitelistDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-ip">{t("settings.security.addIp")}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="new-ip"
                      placeholder={t("settings.security.ipPlaceholder")}
                      value={newIp}
                      onChange={(e) => setNewIp(e.target.value)}
                    />
                    <Button onClick={handleAddIp} className="gap-2">
                      <Plus className="h-4 w-4" />
                      {t("common.add")}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("settings.security.ipFormat")}
                  </p>
                </div>

                {ipWhitelist.length > 0 ? (
                  <div className="space-y-2">
                    <Label>{t("settings.security.allowedIps")}</Label>
                    <div className="space-y-2">
                      {ipWhitelist.map((ip) => (
                        <div key={ip} className="flex items-center justify-between p-3 border rounded-lg">
                          <span className="font-mono text-sm">{ip}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveIp(ip)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-lg border-dashed">
                    <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">{t("settings.security.noIps")}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("settings.security.apiKeyVisibility")}</CardTitle>
                <CardDescription>{t("settings.security.apiKeyVisibilityDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{t("settings.security.showFullKey")}</p>
                      <p className="text-xs text-muted-foreground">{t("settings.security.showFullKeyDesc")}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{t("common.readOnly")}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{t("settings.security.maskKey")}</p>
                      <p className="text-xs text-muted-foreground">{t("settings.security.maskKeyDesc")}</p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rate Limits & Quotas Tab */}
          <TabsContent value="limits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.limits.title")}</CardTitle>
                <CardDescription>{t("settings.limits.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>{t("settings.limits.requestsPerMinute")}</Label>
                    <span className="text-sm font-mono">60 / 100</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: "60%" }} />
                  </div>
                  <p className="text-xs text-muted-foreground">{t("settings.limits.requestsPerMinuteDesc")}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>{t("settings.limits.requestsPerDay")}</Label>
                    <span className="text-sm font-mono">3,240 / 10,000</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: "32.4%" }} />
                  </div>
                  <p className="text-xs text-muted-foreground">{t("settings.limits.requestsPerDayDesc")}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>{t("settings.limits.monthlyQuota")}</Label>
                    <span className="text-sm font-mono">45,000 / 100,000</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: "45%" }} />
                  </div>
                  <p className="text-xs text-muted-foreground">{t("settings.limits.monthlyQuotaDesc")}</p>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {t("settings.limits.upgradeNote")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.webhooks.title")}</CardTitle>
                <CardDescription>{t("settings.webhooks.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">{t("settings.webhooks.endpointUrl")}</Label>
                  <Input
                    id="webhook-url"
                    placeholder={t("settings.webhooks.urlPlaceholder")}
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("settings.webhooks.events")}</Label>
                  <div className="space-y-2">
                    {availableEvents.map((event) => (
                      <div key={event.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={event.id}
                          checked={selectedEvents.includes(event.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEvents([...selectedEvents, event.id]);
                            } else {
                              setSelectedEvents(selectedEvents.filter(id => id !== event.id));
                            }
                          }}
                          className="h-4 w-4 rounded border-border"
                        />
                        <label htmlFor={event.id} className="text-sm cursor-pointer">
                          {event.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleAddWebhook} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t("settings.webhooks.addWebhook")}
                </Button>

                {webhooks.length > 0 && (
                  <div className="space-y-2 pt-4">
                    <Label>{t("settings.webhooks.configured")}</Label>
                    <div className="space-y-2">
                      {webhooks.map((webhook) => (
                        <div key={webhook.id} className="p-4 border rounded-lg space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <p className="text-sm font-mono break-all">{webhook.url}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {webhook.events.length} {t("settings.webhooks.eventsSelected")}
                                </span>
                                <span className="text-xs">•</span>
                                <div className="flex items-center gap-1">
                                  {webhook.status === "active" ? (
                                    <>
                                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                                      <span className="text-xs text-green-500">{t("common.active")}</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-3 w-3 text-destructive" />
                                      <span className="text-xs text-destructive">{t("common.inactive")}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setWebhooks(webhooks.filter(w => w.id !== webhook.id));
                                toast.success(t("settings.webhooks.removed"));
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.notifications.title")}</CardTitle>
                <CardDescription>{t("settings.notifications.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">{t("settings.notifications.email")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("settings.notifications.emailDesc")}
                    </p>
                  </div>
                  <Switch id="email-notifications" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="inapp-notifications">{t("settings.notifications.inApp")}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t("settings.notifications.inAppDesc")}
                    </p>
                  </div>
                  <Switch id="inapp-notifications" defaultChecked />
                </div>

                <div className="pt-4 border-t space-y-3">
                  <Label>{t("settings.notifications.types")}</Label>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{t("settings.notifications.quotaAlerts")}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("settings.notifications.quotaAlertsDesc")}
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{t("settings.notifications.securityAlerts")}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("settings.notifications.securityAlertsDesc")}
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{t("settings.notifications.usageReports")}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("settings.notifications.usageReportsDesc")}
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProjectDashboardLayout>
  );
}
