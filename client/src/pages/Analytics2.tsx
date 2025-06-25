import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, BookOpen, Award, TrendingUp, CheckCircle, Clock } from "lucide-react";

interface UserProgress {
  userId: string;
  userName: string;
  userEmail: string;
  moduleTitle: string;
  assignedAt: string;
  completedAt: string | null;
  quizScore: number | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const mockProgressData = [
  { month: 'Jan', completed: 65, in_progress: 28 },
  { month: 'Feb', completed: 78, in_progress: 35 },
  { month: 'Mar', completed: 89, in_progress: 42 },
  { month: 'Apr', completed: 95, in_progress: 48 },
  { month: 'May', completed: 102, in_progress: 55 },
  { month: 'Jun', completed: 118, in_progress: 62 },
];

const mockScoreData = [
  { name: 'Excellent (90-100%)', value: 35 },
  { name: 'Good (80-89%)', value: 40 },
  { name: 'Fair (70-79%)', value: 20 },
  { name: 'Needs Improvement (<70%)', value: 5 },
];

export default function Analytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: userProgress, isLoading: progressLoading } = useQuery<UserProgress[]>({
    queryKey: ["/api/analytics/user-progress"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">Training performance and user analytics</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalModules || 0}</div>
              <p className="text-xs text-muted-foreground">Published training modules</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Quizzes</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completedQuizzes || 0}</div>
              <p className="text-xs text-muted-foreground">Total quiz attempts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.averageScore || 0}%</div>
              <p className="text-xs text-muted-foreground">Across all quizzes</p>
            </CardContent>
          </Card>
        </div>

        {/* User Progress Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Training Progress</CardTitle>
            <CardDescription>Detailed view of individual user progress across training modules</CardDescription>
          </CardHeader>
          <CardContent>
            {progressLoading ? (
              <div className="text-center py-4">Loading user progress...</div>
            ) : userProgress && userProgress.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Date</TableHead>
                    <TableHead>Completed Date</TableHead>
                    <TableHead>Quiz Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userProgress.map((progress, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{progress.userName}</TableCell>
                      <TableCell>{progress.userEmail}</TableCell>
                      <TableCell>{progress.moduleTitle}</TableCell>
                      <TableCell>
                        {progress.completedAt ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            In Progress
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(progress.assignedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {progress.completedAt 
                          ? new Date(progress.completedAt).toLocaleDateString()
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        {progress.quizScore !== null ? (
                          <Badge 
                            variant={progress.quizScore >= 80 ? "default" : progress.quizScore >= 60 ? "secondary" : "destructive"}
                          >
                            {progress.quizScore}%
                          </Badge>
                        ) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No user progress data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Training Progress</CardTitle>
              <CardDescription>Module completion rates over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockProgressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#8884d8" />
                  <Bar dataKey="in_progress" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quiz Performance</CardTitle>
              <CardDescription>Score distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mockScoreData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mockScoreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}