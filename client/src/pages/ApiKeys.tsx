import ProjectDashboardLayout from "@/components/ProjectDashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Check, Copy, Key, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";

export default function ApiKeys() {
  const params = useParams<{ id: string }>();
  const projectId = params.id ? parseInt(params.id) : null;

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
      toast.error("Failed to create API key", { description: error.message });
    },
  });

  const revokeKey = trpc.apiKey.revoke.useMutation({
    onSuccess: () => {
      setKeyToRevoke(null);
      utils.apiKey.list.invalidate({ projectId: projectId! });
      toast.success("API key revoked successfully");
    },
    onError: (error) => {
      toast.error("Failed to revoke API key", { description: error.message });
    },
  });

  const handleCreateKey = () => {
    if (!projectId || !newKeyName.trim()) return;
    createKey.mutate({ projectId, name: newKeyName });
  };

  const handleCopyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast.success("API key copied to clipboard");
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
            <img src="/alexza-logo-full.png" alt="ALEXZA SYSTEMS" className="h-10 w-auto" />
            <div>
              <h2 className="text-lg font-semibold">ALEXZA SYSTEMS</h2>
              <p className="text-sm text-muted-foreground">Developer Platform for AI APIs</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">API Keys</h1>
              <p className="text-muted-foreground">
                Manage authentication tokens for accessing the TTI API.
              </p>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={(open) => !open && handleCloseCreate()}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Create New Key
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              {!newKeyValue ? (
                <>
                  <DialogHeader>
                    <DialogTitle>Create New API Key</DialogTitle>
                    <DialogDescription>
                      Give your API key a descriptive name to identify it later.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="keyName">Key Name</Label>
                      <Input
                        id="keyName"
                        placeholder="e.g., Production Server"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={handleCloseCreate}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateKey}
                      disabled={!newKeyName.trim() || createKey.isPending}
                    >
                      {createKey.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Key
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>API Key Created</DialogTitle>
                    <DialogDescription>
                      Copy your API key now. You won't be able to see it again.
                    </DialogDescription>
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
                    <p className="text-sm text-destructive">
                      Make sure to copy your API key now. For security reasons, it won't be shown
                      again.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCloseCreate}>Done</Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Active Keys</CardTitle>
            <CardDescription>
              All active API keys for this project. Revoked keys are not shown.
            </CardDescription>
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
                    <TableHead>Name</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
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
                          : "Never"}
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
                <h3 className="font-medium mb-1">No API keys yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first API key to start using the TTI API.
                </p>
                <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create API Key
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg">Security Best Practices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Keep keys secret:</strong> Never expose API keys
              in client-side code or public repositories.
            </p>
            <p>
              <strong className="text-foreground">Use environment variables:</strong> Store keys in
              environment variables, not in your codebase.
            </p>
            <p>
              <strong className="text-foreground">Rotate regularly:</strong> Create new keys and
              revoke old ones periodically for better security.
            </p>
            <p>
              <strong className="text-foreground">Limit scope:</strong> Create separate keys for
              different environments (development, staging, production).
            </p>
          </CardContent>
        </Card>

        <AlertDialog open={!!keyToRevoke} onOpenChange={() => setKeyToRevoke(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to revoke this API key? Any applications using this key will
                immediately lose access. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  keyToRevoke && revokeKey.mutate({ keyId: keyToRevoke, projectId: projectId! })
                }
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {revokeKey.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Revoke Key
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProjectDashboardLayout>
  );
}
