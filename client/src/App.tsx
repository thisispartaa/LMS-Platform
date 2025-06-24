import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import TrainingModules from "@/pages/TrainingModules";
import UploadContent from "@/pages/UploadContent";
import QuizManagement from "@/pages/QuizManagement";
import UserManagement from "@/pages/UserManagement";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-light">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-auto p-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/modules" component={TrainingModules} />
            {(user?.role === "admin" || user?.role === "trainer") && (
              <>
                <Route path="/upload" component={UploadContent} />
                <Route path="/quizzes" component={QuizManagement} />
                <Route path="/users" component={UserManagement} />
                <Route path="/analytics" component={Analytics} />
              </>
            )}
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
      <ChatbotWidget />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
