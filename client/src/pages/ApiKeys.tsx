import ProjectDashboardLayout from "@/components/ProjectDashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyCodeBlock } from "@/components/CopyCodeBlock";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ArrowRight, Check, Copy, Key, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ApiKeys() {
  const { t } = useLanguage();
  const params = useParams<{ id: string }>();
  const projectId = params.id ? parseInt(params.id) : null;
  const [, setLocation] = useLocation();

  const baseUrl =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
    "https://api.alexza.systems";
  const sampleText = t("examples.sampleText");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [keyToRevoke, setKeyToRevoke] = useState<number | null>(null);

  const { data: apiKeys, isLoading } = trpc.apiKey.list.useQuery(
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const utils = trpc.useUtils();

  const createKey = trpc.apiKey.create.useMutation({
    onSuccess: (data) => {
      setNewKeyValue(data.plainKey);
      utils.apiKey.list.invalidate({ projectId: projectId! });
    },
    onError: (error) => {
      toast.error(t("apiKeys.createFailed"), { description: error.message });
    },
  });

  const revokeKey = trpc.apiKey.revoke.useMutation({
    onSuccess: () => {
      setKeyToRevoke(null);
      utils.apiKey.list.invalidate({ projectId: projectId! });
      toast.success(t("apiKeys.revoked"));
    },
    onError: (error) => {
      toast.error(t("apiKeys.revokeFailed"), { description: error.message });
    },
  });

  const handleCreateKey = () => {
    if (!projectId || !newKeyName.trim()) return;
    createKey.mutate({ projectId, name: newKeyName });
  };

  const handleCopyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast.success(t("apiKeys.copied"));
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    setNewKeyName("");
    setNewKeyValue(null);
  };

  return (
    <ProjectDashboardLayout>
      <div className="space-y-6">
        {/* Header with Branding */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img src="/alexza-logo-full.png" alt={t("brand.name")} className="h-10 w-auto" />
            <div>
              <h2 className="text-lg font-semibold">{t("brand.name")}</h2>
              <p className="text-sm text-muted-foreground">{t("brand.tagline")}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">{t("apiKeys.title")}</h1>
              <p className="text-muted-foreground">{t("apiKeys.subtitle")}</p>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={(open) => !open && handleCloseCreate()}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                {t("apiKeys.create")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              {!newKeyValue ? (
                <>
                  <DialogHeader>
                    <DialogTitle>{t("apiKeys.createDialogTitle")}</DialogTitle>
                    <DialogDescription>{t("apiKeys.createDialogDescription")}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="keyName">{t("apiKeys.name")}</Label>
                      <Input
                        id="keyName"
                        placeholder={t("apiKeys.namePlaceholder")}
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={handleCloseCreate}>
                      {t("common.cancel")}
                    </Button>
                    <Button
                      onClick={handleCreateKey}
                      disabled={!newKeyName.trim() || createKey.isPending}
                    >
                      {createKey.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t("apiKeys.create")}
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>{t("apiKeys.createdTitle")}</DialogTitle>
                    <DialogDescription>{t("apiKeys.createdDescription")}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="p-4 bg-secondary rounded-lg border border-border">
                      <div className="flex items-center justify-between gap-4">
                        <code className="text-sm font-mono break-all">{newKeyValue}</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyKey(newKeyValue)}
                          className="shrink-0"
                        >
                          {copiedKey === newKeyValue ? (
                            <Check className="h-4 w-4 text-foreground" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-destructive">{t("apiKeys.copyWarning")}</p>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCloseCreate}>{t("common.done")}</Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
            </Dialog>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("apiKeys.usageHint")}{" "}
            <button
              className="underline underline-offset-4 hover:text-foreground transition-colors"
              onClick={() => projectId && setLocation(`/project/${projectId}/usage`)}
              type="button"
            >
              {t("nav.usage")}
            </button>
            .
          </p>
        </div>

        {/* Keys-first Quickstart */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-lg">{t("apiKeys.quickstartTitle")}</CardTitle>
                <CardDescription>{t("apiKeys.quickstartDescription")}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => projectId && setLocation(`/project/${projectId}/docs`)}
                >
                  {t("apiKeys.viewDocs")} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">{t("apiKeys.quickstart.step1")}</p>
                <CopyCodeBlock
                  id="keys-auth-header"
                  code={`Authorization: Bearer ${newKeyValue ?? t("apiKeys.placeholderKey")}`}
                />
                <p className="text-xs text-muted-foreground">
                  {t("apiKeys.quickstart.authDescription")}
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">{t("apiKeys.quickstart.step2")}</p>
                <CopyCodeBlock id="keys-base-url" code={baseUrl} />
                <p className="text-xs text-muted-foreground">{t("usage.creditsNote")}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{t("apiKeys.quickstart.step3")}</p>
              <CopyCodeBlock
                id="keys-first-request"
                code={`curl -X POST "${baseUrl}/tti/decide-font" \\\n  -H "Authorization: Bearer ${newKeyValue ?? t("apiKeys.placeholderKey")}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"text":"${sampleText}"}'`}
              />
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => projectId && setLocation(`/project/${projectId}/usage`)}
                >
                  {t("apiKeys.viewUsage")} <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  {t("apiKeys.usageAfterHint")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">{t("apiKeys.activeTitle")}</CardTitle>
            <CardDescription>{t("apiKeys.activeDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : apiKeys && apiKeys.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("apiKeys.table.name")}</TableHead>
                    <TableHead>{t("apiKeys.table.key")}</TableHead>
                    <TableHead>{t("apiKeys.table.created")}</TableHead>
                    <TableHead>{t("apiKeys.table.lastUsed")}</TableHead>
                    <TableHead className="w-[100px]">{t("apiKeys.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>
                        <code className="text-sm bg-secondary px-2 py-1 rounded">
                          {key.keyPrefix}...
                        </code>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(key.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {key.lastUsedAt
                          ? format(new Date(key.lastUsedAt), "MMM d, yyyy HH:mm")
                          : t("common.never")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setKeyToRevoke(key.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                  <Key className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-1">{t("apiKeys.empty")}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("apiKeys.emptyDescription")}
                </p>
                <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t("apiKeys.create")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg">{t("apiKeys.securityTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">{t("apiKeys.security.keepSecretLabel")}</strong>{" "}
              {t("apiKeys.security.keepSecret")}
            </p>
            <p>
              <strong className="text-foreground">{t("apiKeys.security.envLabel")}</strong>{" "}
              {t("apiKeys.security.env")}
            </p>
            <p>
              <strong className="text-foreground">{t("apiKeys.security.rotateLabel")}</strong>{" "}
              {t("apiKeys.security.rotate")}
            </p>
            <p>
              <strong className="text-foreground">{t("apiKeys.security.scopeLabel")}</strong>{" "}
              {t("apiKeys.security.scope")}
            </p>
          </CardContent>
        </Card>

        <AlertDialog open={!!keyToRevoke} onOpenChange={() => setKeyToRevoke(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("apiKeys.revokeTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("apiKeys.revokeDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  keyToRevoke && revokeKey.mutate({ keyId: keyToRevoke, projectId: projectId! })
                }
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {revokeKey.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("apiKeys.revoke")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProjectDashboardLayout>
  );
}
