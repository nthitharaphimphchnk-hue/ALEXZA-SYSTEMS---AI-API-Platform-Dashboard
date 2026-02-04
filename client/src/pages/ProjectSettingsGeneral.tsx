import ProjectDashboardLayout from "@/components/ProjectDashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTrpcQueryOrMock } from "@/_core/data/useTrpcQueryOrMock";
import { Copy, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

type GeneralSettings = {
  name: string;
  tier: "default";
  disableUserKeys: boolean;
};

export default function ProjectSettingsGeneral() {
  const { t } = useLanguage();
  const params = useParams<{ id: string }>();
  const projectId = params.id ? parseInt(params.id) : null;

  const { data: project, isLoading } = useTrpcQueryOrMock(
    "project.get",
    { id: projectId! },
    { enabled: !!projectId }
  );

  const storageKey = projectId ? `alexza_project_settings_${projectId}` : null;

  const [form, setForm] = useState<GeneralSettings>({
    name: "",
    tier: "default",
    disableUserKeys: false,
  });
  const [saved, setSaved] = useState<GeneralSettings | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!project || !storageKey) return;

    let initial: GeneralSettings = {
      name: project.name ?? "",
      tier: "default",
      disableUserKeys: false,
    };

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<GeneralSettings>;
        initial = {
          name: typeof parsed.name === "string" ? parsed.name : initial.name,
          tier: parsed.tier === "default" ? "default" : "default",
          disableUserKeys: Boolean(parsed.disableUserKeys),
        };
      }
    } catch {
      // ignore
    }

    setForm(initial);
    setSaved(initial);
  }, [project?.id, project?.name, storageKey]);

  const isDirty = useMemo(() => {
    if (!saved) return false;
    return (
      form.name.trim() !== saved.name.trim() ||
      form.tier !== saved.tier ||
      form.disableUserKeys !== saved.disableUserKeys
    );
  }, [form, saved]);

  const handleSave = () => {
    if (!storageKey) return;
    const next = {
      ...form,
      name: form.name.trim() || project?.name || "",
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setForm(next);
      setSaved(next);
      toast.success(t("common.saved"));
    } catch {
      toast.error(t("common.saveFailed"));
    }
  };

  const handleCopyId = async () => {
    if (!projectId) return;
    try {
      await navigator.clipboard.writeText(String(projectId));
      setCopied(true);
      toast.success(t("common.copied"));
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t("common.copyFailed"));
    }
  };

  return (
    <ProjectDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("settings.project.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("settings.project.description")}</p>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>{t("settings.general")}</CardTitle>
            <CardDescription>{t("settings.generalDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project-name">{t("settings.project.name")}</Label>
                <Input
                  id="project-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={isLoading ? t("common.loading") : t("settings.project.namePlaceholder")}
                />
                <p className="text-xs text-muted-foreground">
                  {t("settings.project.nameHelp")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-id">{t("settings.project.id")}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="project-id"
                    value={projectId ?? ""}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyId}
                    aria-label={t("settings.project.copyId")}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("settings.project.idHelp")}
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("settings.project.tier")}</Label>
                <Select value={form.tier} onValueChange={() => {}}>
                  <SelectTrigger disabled>
                    <SelectValue placeholder={t("settings.project.tierDefault")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">{t("settings.project.tierDefault")}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t("settings.project.tierHelp")}
                </p>
              </div>

              <div className="space-y-3">
                <Label>{t("settings.project.disableKeys")}</Label>
                <div className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3 bg-muted/20">
                  <div>
                    <p className="text-sm font-medium">{t("settings.project.disableKeysTitle")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("settings.project.disableKeysHelp")}
                    </p>
                  </div>
                  <Switch
                    checked={form.disableUserKeys}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, disableUserKeys: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Button onClick={handleSave} disabled={!isDirty}>
                {t("common.saveChanges")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProjectDashboardLayout>
  );
}

