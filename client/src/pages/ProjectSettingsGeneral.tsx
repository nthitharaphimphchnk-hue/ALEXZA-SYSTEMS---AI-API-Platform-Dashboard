import ProjectDashboardLayout from "@/components/ProjectDashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Copy, Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";

type GeneralSettings = {
  name: string;
  tier: "default";
  disableUserKeys: boolean;
};

export default function ProjectSettingsGeneral() {
  const params = useParams<{ id: string }>();
  const projectId = params.id ? parseInt(params.id) : null;

  const { data: project, isLoading } = trpc.project.get.useQuery(
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
      toast.success("Saved");
    } catch {
      toast.error("Save failed");
    }
  };

  const handleCopyId = async () => {
    if (!projectId) return;
    try {
      await navigator.clipboard.writeText(String(projectId));
      setCopied(true);
      toast.success("Copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <ProjectDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Project Settings</h1>
          <p className="text-muted-foreground mt-1">General configuration for this project.</p>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Identity and access controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project name</Label>
                <Input
                  id="project-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={isLoading ? "Loading…" : "My Project"}
                />
                <p className="text-xs text-muted-foreground">
                  Visible across dashboards and usage.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-id">Project ID</Label>
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
                    aria-label="Copy project id"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use this ID for support or automation.
                </p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>Service tier</Label>
                <Select value={form.tier} onValueChange={() => {}}>
                  <SelectTrigger disabled>
                    <SelectValue placeholder="Default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Only default tier is available right now.
                </p>
              </div>

              <div className="space-y-3">
                <Label>Disable user API keys</Label>
                <div className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3 bg-muted/20">
                  <div>
                    <p className="text-sm font-medium">Disable keys for this project</p>
                    <p className="text-xs text-muted-foreground">
                      Existing keys remain visible but requests are blocked.
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
                Save changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProjectDashboardLayout>
  );
}

