import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { QualityDataProvider } from "@/contexts/QualityDataContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Loader2 } from "lucide-react";

// Lazy load pages for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const TestsPage = lazy(() => import("./pages/TestsPage"));
const PerformancePage = lazy(() => import("./pages/PerformancePage"));
const CoveragePage = lazy(() => import("./pages/CoveragePage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const SecurityPage = lazy(() => import("./pages/SecurityPage"));
const OperationsPage = lazy(() => import("./pages/OperationsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="h-[80vh] flex flex-col items-center justify-center space-y-4">
    <Loader2 className="w-12 h-12 text-primary animate-spin" />
    <p className="text-muted-foreground animate-pulse">Carregando...</p>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <SettingsProvider>
        <QualityDataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route element={<DashboardLayout />}>
                  <Route path="/" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
                  <Route path="/tests" element={<Suspense fallback={<PageLoader />}><TestsPage /></Suspense>} />
                  <Route path="/performance" element={<Suspense fallback={<PageLoader />}><PerformancePage /></Suspense>} />
                  <Route path="/coverage" element={<Suspense fallback={<PageLoader />}><CoveragePage /></Suspense>} />
                  <Route path="/security" element={<Suspense fallback={<PageLoader />}><SecurityPage /></Suspense>} />
                  <Route path="/operations" element={<Suspense fallback={<PageLoader />}><OperationsPage /></Suspense>} />
                  <Route path="/history" element={<Suspense fallback={<PageLoader />}><HistoryPage /></Suspense>} />
                  <Route path="/reports" element={<Suspense fallback={<PageLoader />}><ReportsPage /></Suspense>} />
                  <Route path="/settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
                </Route>
                <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QualityDataProvider>
      </SettingsProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
