import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuthContext } from "@/context/AuthContext";
import { TranslationProvider } from "@/context/TranslationContext";
import { LoginForm } from "@/components/auth/LoginForm";
import NotFound from "@/pages/not-found";
import POS from "@/pages/pos";
import AdminDashboard from "@/pages/admin-dashboard";
import DeliveryOrderForm from "@/routes/delivery/branch/[branchCode]";

function Router() {
  const { isAuthenticated, isLoading } = useAuthContext();
  const [location] = useLocation();

  if (location.startsWith("/delivery/branch")) {
    return (
      <Switch>
        <Route path="/delivery/branch/:branchCode" component={DeliveryOrderForm} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <Switch>
      <Route path="/" component={POS} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TranslationProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </TranslationProvider>
    </QueryClientProvider>
  );
}

export default App;
