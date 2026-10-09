import { lazy, Suspense, type ReactNode, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { VillageShell } from "@/components/village-shell";
import WelcomePage from "@/pages/welcome";
import { hasMemberSession } from "@/lib/member-session";
import { Route, Switch, useLocation, Router as WouterRouter } from "wouter";

const queryClient = new QueryClient();
const AdminPage = lazy(() => import("@/pages/admin"));
const ChatPage = lazy(() => import("@/pages/chat"));
const EventsPage = lazy(() => import("@/pages/events"));
const GeneralAssemblyReportPage = lazy(
  () => import("@/pages/general-assembly-report"),
);
const HomePage = lazy(() => import("@/pages/home"));
const JoinPage = lazy(() => import("@/pages/join"));
const MemberPage = lazy(() => import("@/pages/member"));
const MemberLoginPage = lazy(() => import("@/pages/member-login"));
const MembersPage = lazy(() => import("@/pages/members"));
const NewsPage = lazy(() => import("@/pages/news"));
const NotFound = lazy(() => import("@/pages/not-found"));
const PrivacyPage = lazy(() => import("@/pages/privacy"));
const ZoboromaPage = lazy(() => import("@/pages/zoboroma"));

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <RouteMetadata />
      <Suspense fallback={<PageLoading />}>
        <Switch>
          <Route path="/" component={WelcomePage} />
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
          <Route path="/membre">
            <MemberOnly>
              <MemberPage />
            </MemberOnly>
          </Route>
          <Route path="/actualites">
            <MemberOnly>
              <NewsPage />
            </MemberOnly>
          </Route>
          <Route path="/actualites/assemblee-generale-13-septembre-2026">
            <MemberOnly>
              <GeneralAssemblyReportPage />
            </MemberOnly>
          </Route>
          <Route path="/groupe">
            <MemberOnly>
              <ChatPage />
            </MemberOnly>
          </Route>
          <Route path="/evenements">
            <MemberOnly>
              <EventsPage />
            </MemberOnly>
          </Route>
          <Route path="/connexion-membre" component={MemberLoginPage} />
          <Route path="/zoboroma">
            <MemberOnly>
              <ZoboromaPage />
            </MemberOnly>
          </Route>
          <Route path="/inscription" component={JoinPage} />
          <Route path="/confidentialite" component={PrivacyPage} />
          <Route path="/admin" component={AdminPage} />
          <Route>{hasMemberSession() ? <NotFound /> : <WelcomePage />}</Route>
        </Switch>
      </Suspense>
    </RoutedErrorBoundary>
  );
}

function PageLoading() {
  return (
    <div className="mx-auto grid min-h-[55vh] max-w-md place-items-center">
      <span className="h-9 w-9 animate-spin rounded-full border-4 border-muted border-t-primary" />
      <span className="sr-only">Chargement de la page</span>
    </div>
  );
}

function RouteMetadata() {
  const [location] = useLocation();

  useEffect(() => {
    const publicRoutes = new Set(["/", "/confidentialite"]);
    const robots = document.querySelector<HTMLMetaElement>(
      'meta[name="robots"]',
    );
    robots?.setAttribute(
      "content",
      publicRoutes.has(location) ? "index, follow" : "noindex, nofollow",
    );
  }, [location]);

  return null;
}

function MemberOnly({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const memberActive = hasMemberSession();

  useEffect(() => {
    if (!memberActive) {
      const returnPath = encodeURIComponent(location);
      navigate(`/connexion-membre?retour=${returnPath}`, { replace: true });
    }
  }, [location, memberActive, navigate]);

  return memberActive ? children : null;
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
