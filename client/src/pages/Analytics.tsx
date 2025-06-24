import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen,
  Clock,
  Award,
  Target,
  Activity
} from "lucide-react";
import type { DashboardStats } from "@/types";

export default function Analytics() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-neutral-dark">Analytics</h3>
            <p className="text-neutral-medium">Training performance and user analytics</p>
          </div>
        </div>
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

  const analyticsData = [
    {
      title: "Module Completion Rate",
      percentage: 87,
      trend: "+12%",
      description: "Percentage of assigned modules completed",
      color: "bg-success",
    },
    {
      title: "Average Quiz Score", 
      percentage: stats?.averageScore || 0,
      trend: "+5%",
      description: "Average score across all quiz attempts",
      color: "bg-primary",
    },
    {
      title: "User Engagement",
      percentage: 92,
      trend: "+8%", 
      description: "Active users in the last 30 days",
      color: "bg-warning",
    },
    {
      title: "Content Utilization",
      percentage: 78,
      trend: "+15%",
      description: "Percentage of available content accessed",
      color: "bg-purple-500",
    },
  ];

  const modulePerformance = [
    { name: "React Fundamentals", completions: 45, avgScore: 91, difficulty: "Foundational" },
    { name: "JavaScript ES6+", completions: 32, avgScore: 85, difficulty: "Intermediate" },
    { name: "Employee Onboarding", completions: 156, avgScore: 94, difficulty: "Onboarding" },
    { name: "Advanced React Patterns", completions: 18, avgScore: 78, difficulty: "Advanced" },
    { name: "Database Design", completions: 28, avgScore: 82, difficulty: "Intermediate" },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Onboarding": return "bg-green-100 text-green-800";
      case "Foundational": return "bg-blue-100 text-blue-800";
      case "Intermediate": return "bg-yellow-100 text-yellow-800";
      case "Advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-neutral-dark">Analytics</h3>
          <p className="text-neutral-medium">Training performance and user analytics</p>
        </div>
        <Select defaultValue="30days">
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
            <SelectItem value="year">This year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
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
                <p className="text-neutral-medium text-sm font-medium">Quiz Attempts</p>
                <p className="text-2xl font-bold text-neutral-dark">{stats?.completedQuizzes || 0}</p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <Award className="h-6 w-6 text-warning" />
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
                <p className="text-neutral-medium text-sm font-medium">Avg. Score</p>
                <p className="text-2xl font-bold text-neutral-dark">{stats?.averageScore || 0}%</p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-success" />
              </div>
            </div>
            <p className="text-success text-sm mt-2 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {analyticsData.map((metric, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-dark">{metric.title}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-success">{metric.trend}</span>
                      <span className="text-sm font-medium">{metric.percentage}%</span>
                    </div>
                  </div>
                  <Progress value={metric.percentage} className="h-2" />
                  <p className="text-xs text-neutral-medium">{metric.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning Path Effectiveness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-green-600 font-bold">94%</span>
                  </div>
                  <p className="text-xs text-neutral-medium">Onboarding</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-bold">91%</span>
                  </div>
                  <p className="text-xs text-neutral-medium">Foundational</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-yellow-600 font-bold">84%</span>
                  </div>
                  <p className="text-xs text-neutral-medium">Intermediate</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-red-600 font-bold">78%</span>
                  </div>
                  <p className="text-xs text-neutral-medium">Advanced</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-neutral-medium mb-2">Learning Path Completion Trends</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Linear Progression</span>
                    <span className="text-success">+15%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Skip Ahead Rate</span>
                    <span className="text-warning">-8%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Repeat Attempts</span>
                    <span className="text-primary">12%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Module Performance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Module Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {modulePerformance.map((module, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-dark">{module.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(module.difficulty)}`}>
                        {module.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-dark">{module.completions}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-dark">{module.avgScore}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3 w-20">
                          <div 
                            className="bg-success h-2 rounded-full" 
                            style={{ width: `${module.avgScore}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-neutral-medium">{module.avgScore}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
