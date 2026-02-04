import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProjectSelector from "./pages/ProjectSelector";
import ProjectOverview from "./pages/ProjectOverview";
import ApiKeys from "./pages/ApiKeys";
import Playground from "./pages/Playground";
import Documentation from "./pages/Documentation";
import Usage from "./pages/Usage";
import Billing from "./pages/Billing";
import QuickStart from "./pages/QuickStart";
import Settings from "./pages/Settings";

function Router() {
  return (
    <Switch>
      {/* Project Selector - Landing page (root route) */}
      <Route path="/" component={ProjectSelector} />
      
      {/* Quick Start Guide */}
      <Route path="/quickstart" component={QuickStart} />
      
      {/* Standalone Playground (no project required) */}
      <Route path="/playground" component={Playground} />

      {/* Standalone Documentation (no project required) */}
      <Route path="/documentation" component={Documentation} />
      
      {/* Project Dashboard Routes */}
      <Route path="/project/:id" component={ProjectOverview} />
      <Route path="/project/:id/keys" component={ApiKeys} />
      <Route path="/project/:id/settings" component={Settings} />
      <Route path="/project/:id/playground" component={Playground} />
      <Route path="/project/:id/docs" component={Documentation} />
      <Route path="/project/:id/usage" component={Usage} />
      <Route path="/project/:id/billing" component={Billing} />
      
      {/* 404 - explicit path */}
      <Route path="/404" component={NotFound} />
      {/* Fallback: render landing page for unknown paths */}
      <Route component={ProjectSelector} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
