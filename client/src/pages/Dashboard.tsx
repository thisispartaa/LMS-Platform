import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Users, 
  CheckCircle, 
  TrendingUp,
  Upload,
  PlusCircle,
  HelpCircle,
  BarChart3
} from "lucide-react";
import { useLocation } from "wouter";
import type { DashboardStats } from "@/types";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-medium text-sm font-medium">Total Modules</p>
                <p className="text-2xl font-bold text-neutral-dark">{stats?.totalModules || 0}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-success text-sm mt-2 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-medium text-sm font-medium">Active Users</p>
                <p className="text-2xl font-bold text-neutral-dark">{stats?.activeUsers || 0}</p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-success" />
              </div>
            </div>
            <p className="text-success text-sm mt-2 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-medium text-sm font-medium">Completed Quizzes</p>
                <p className="text-2xl font-bold text-neutral-dark">{stats?.completedQuizzes || 0}</p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-warning" />
              </div>
            </div>
            <p className="text-success text-sm mt-2 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              23% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-medium text-sm font-medium">Average Score</p>
                <p className="text-2xl font-bold text-neutral-dark">{stats?.averageScore || 0}%</p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-success" />
              </div>
            </div>
            <p className="text-success text-sm mt-2 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Upload className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-dark">
                    <span className="font-medium">John Smith</span> uploaded 
                    <span className="font-medium"> "Advanced JavaScript Concepts"</span>
                  </p>
                  <p className="text-xs text-neutral-medium">2 hours ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-dark">
                    <span className="font-medium">Sarah Wilson</span> completed 
                    <span className="font-medium"> "React Fundamentals"</span> quiz
                  </p>
                  <p className="text-xs text-neutral-medium">4 hours ago</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-warning/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="h-4 w-4 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-dark">
                    New quiz generated for 
                    <span className="font-medium"> "Database Design Principles"</span>
                  </p>
                  <p className="text-xs text-neutral-medium">6 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 border-2 border-dashed hover:border-primary hover:bg-primary/5"
                onClick={() => setLocation("/upload")}
              >
                <Upload className="h-6 w-6 text-neutral-medium group-hover:text-primary" />
                <span className="text-sm font-medium">Upload Content</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 border-2 border-dashed hover:border-primary hover:bg-primary/5"
                onClick={() => setLocation("/modules")}
              >
                <PlusCircle className="h-6 w-6 text-neutral-medium group-hover:text-primary" />
                <span className="text-sm font-medium">Create Module</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 border-2 border-dashed hover:border-primary hover:bg-primary/5"
                onClick={() => setLocation("/quizzes")}
              >
                <HelpCircle className="h-6 w-6 text-neutral-medium group-hover:text-primary" />
                <span className="text-sm font-medium">Generate Quiz</span>
              </Button>

              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2 border-2 border-dashed hover:border-primary hover:bg-primary/5"
                onClick={() => setLocation("/analytics")}
              >
                <BarChart3 className="h-6 w-6 text-neutral-medium group-hover:text-primary" />
                <span className="text-sm font-medium">View Analytics</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
