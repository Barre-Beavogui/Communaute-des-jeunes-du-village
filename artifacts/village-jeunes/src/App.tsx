import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { VillageShell } from "@/components/village-shell";
import AdminPage from "@/pages/admin";
import HomePage from "@/pages/home";
import JoinPage from "@/pages/join";
import MemberPage from "@/pages/member";
import MemberLoginPage from "@/pages/member-login";
import MembersPage from "@/pages/members";
import NewsPage from "@/pages/news";
import NotFound from "@/pages/not-found";
import ZoboromaPage from "@/pages/zoboroma";
import { hasMemberSession } from "@/lib/member-session";
import { Route, Switch, useLocation, Router as WouterRouter } from "wouter";

const queryClient = new QueryClient();

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={JoinPage} />
        <Route path="/accueil">
          <MemberOnly>
            <HomePage />
          </MemberOnly>
        </Route>
        <Route path="/membres">
          <MemberOnly>
            <MembersPage />
          </MemberOnly>
        </Route>
        <Route path="/membre/:id">
          <MemberOnly>
            <MemberPage />
          </MemberOnly>
        </Route>
        <Route path="/actualites">
          <MemberOnly>
            <NewsPage />
          </MemberOnly>
        </Route>
        <Route path="/connexion-membre" component={MemberLoginPage} />
        <Route path="/zoboroma">
          <MemberOnly>
            <ZoboromaPage />
          </MemberOnly>
        </Route>
        <Route path="/inscription" component={JoinPage} />
        <Route path="/admin" component={AdminPage} />
        <Route>{hasMemberSession() ? <NotFound /> : <JoinPage />}</Route>
      </Switch>
    </RoutedErrorBoundary>
  );
}

function MemberOnly({ children }: { children: ReactNode }) {
  return hasMemberSession() ? children : <JoinPage />;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <VillageShell>
            <Router />
          </VillageShell>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
