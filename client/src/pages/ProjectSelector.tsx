import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getLoginUrl } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { FolderPlus, Loader2, Plus, LayoutDashboard, Settings, LogOut, Shield } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

/** Only used when auth is disabled (no session) so project.list API cannot be called. */
const MOCK_PROJECTS = [
  {
    id: 1,
    name: "TTI",
    description: "Thai Typography Intelligence – mock dev project",
    userId: 1,
    environment: "development" as const,
    status: "active" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function ProjectSelector() {
  const { user, loading: authLoading, status: authStatus, logout } = useAuth();
  const loginUrl = getLoginUrl();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProject, setNewProject] = useState<{
    name: string;
    description: string;
    environment: "development" | "staging" | "production";
  }>({
    name: "",
    description: "",
    environment: "development",
  });

  const {
    data: projects,
    isLoading: projectsLoading,
    isError: projectsError,
    refetch: refetchProjects,
  } = trpc.project.list.useQuery(undefined, {
    enabled: !!user && authStatus !== "disabled",
  });

  const isMockMode = authStatus === "disabled";
  const displayProjects = isMockMode ? MOCK_PROJECTS : (projects ?? []);
  const displayLoading = isMockMode ? false : projectsLoading;
  const displayError = !isMockMode && projectsError;

  const createProject = trpc.project.create.useMutation({
    onSuccess: (project) => {
      toast.success(t("projects.created"));
      setIsCreateOpen(false);
      setNewProject({ name: "", description: "", environment: "development" });
      setLocation(`/project/${project.id}`);
    },
    onError: () => {
      toast.error(t("projects.createFailed"));
    },
  });

  const handleCreateSubmit = () => {
    if (isMockMode) {
      setIsCreateOpen(false);
      setNewProject({ name: "", description: "", environment: "development" });
      setLocation("/project/1");
      toast.success("Mock mode: opened TTI project");
      return;
    }
    createProject.mutate(newProject);
  };

  const utils = trpc.useUtils();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not signed in but auth is configured: show sign-in card (redirect would go to loginUrl).
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex flex-col items-center gap-4">
              <img src="/alexza-logo-full.png" alt="ALEXZA SYSTEMS" className="h-20 w-auto" />
              <div className="text-center space-y-2">
                <CardTitle className="text-2xl">ALEXZA SYSTEMS</CardTitle>
                <CardDescription className="text-base">
                  Developer Platform for AI APIs
                </CardDescription>
              </div>
            </div>
            <CardDescription className="text-base text-center">
              Sign in to access your TTI API projects and developer dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loginUrl ? (
              <Button
                onClick={() => (window.location.href = loginUrl)}
                className="w-full h-12 text-base"
                size="lg"
              >
                Sign in to continue
              </Button>
            ) : (
              <Button className="w-full h-12 text-base" size="lg" disabled>
                Sign in (not configured)
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src="/alexza-logo-full.png" alt="ALEXZA SYSTEMS" className="h-10 w-auto" />
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight">ALEXZA SYSTEMS</span>
              <span className="text-xs text-muted-foreground">Developer Platform for AI APIs</span>
            </div>
          </a>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-7 w-7 border">
                    <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                      {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setLocation("/")} className="cursor-pointer">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>{t("nav.dashboard")}</span>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem onClick={() => setLocation("/admin")} className="cursor-pointer">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin (Internal)</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t("nav.settings")}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t("nav.signOut")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">{t("projects.title")}</h1>
            <p className="text-muted-foreground text-lg">
              {t("projects.subtitle")}
            </p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                {t("projects.createNew")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("projects.createNew")}</DialogTitle>
                <DialogDescription>
                  Set up a new project to start using the TTI API.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("projects.name")}</Label>
                  <Input
                    id="name"
                    placeholder="My TTI Project"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t("projects.description")}</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your project..."
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="environment">{t("projects.environment")}</Label>
                  <Select
                    value={newProject.environment}
                    onValueChange={(value: "development" | "staging" | "production") =>
                      setNewProject({ ...newProject, environment: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">{t("projects.development")}</SelectItem>
                      <SelectItem value="staging">{t("projects.staging")}</SelectItem>
                      <SelectItem value="production">{t("projects.production")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  {t("projects.cancel")}
                </Button>
                <Button
                  onClick={handleCreateSubmit}
                  disabled={!newProject.name.trim() || (!isMockMode && createProject.isPending)}
                >
                  {!isMockMode && createProject.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("projects.create")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {displayLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : displayError ? (
            <Card className="border-destructive/50">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  Could not load projects. Please try again.
                </p>
                <Button variant="outline" onClick={() => refetchProjects()}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : displayProjects.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {displayProjects.map((project) => (
                <Card
                  key={project.id}
                  className="group cursor-pointer border-border/50 hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5"
                  onClick={() => setLocation(`/project/${project.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {project.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {project.description || "No description"}
                        </CardDescription>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-md ${
                          project.environment === "production"
                            ? "bg-muted/50 text-foreground border border-border"
                            : project.environment === "staging"
                            ? "bg-muted/30 text-muted-foreground border border-border/50"
                            : "bg-muted/20 text-muted-foreground border border-border/30"
                        }`}
                      >
                        {t(`projects.${project.environment}`)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Created {format(new Date(project.createdAt), "MMM d, yyyy")}</span>
                      <span
                        className={`flex items-center gap-1.5 ${
                          project.status === "active" ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          project.status === "active" ? "bg-foreground" : "bg-muted-foreground"
                        }`} />
                        {project.status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <FolderPlus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">{t("projects.empty")}</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  {t("projects.emptyDesc")}
                </p>
                <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t("projects.createNew")}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
