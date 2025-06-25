import { Switch, Route } from "wouter";
import { lazy, Suspense } from "react";
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
import UserManagement from "@/pages/UserManagement2";
import Settings from "@/pages/Settings";
import EmployeeDashboard from "@/pages/EmployeeDashboard";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget";

// Lazy load heavy components
const Analytics = lazy(() => import("./pages/Analytics2"));

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Employee dashboard for non-admin users
  if ((user as any).role === 'employee') {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
            <EmployeeDashboard />
          </main>
        </div>
        <ChatbotWidget />
      </div>
    );
  }

  // Admin dashboard for admin/trainer users
  return (
    <div className="flex h-screen bg-neutral-light">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <div className="flex-1 overflow-auto p-6">
          <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/modules" component={TrainingModules} />
              <Route path="/upload" component={UploadContent} />
              <Route path="/quizzes" component={QuizManagement} />
              <Route path="/users" component={UserManagement} />
              <Route path="/analytics" component={Analytics} />
              <Route path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </div>
      </main>
      <ChatbotWidget />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}