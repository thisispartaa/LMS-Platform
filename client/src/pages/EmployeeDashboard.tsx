import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getQueryFn } from "@/lib/queryClient";
import { BookOpen, Clock, Trophy, Target, ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function EmployeeDashboard() {
  // Fetch user's assigned modules
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["/api/my-assignments"],
    queryFn: getQueryFn({ on401: "throw" })
  });

  // Fetch user's quiz results for progress tracking
  const { data: quizResults = [], isLoading: resultsLoading } = useQuery({
    queryKey: ["/api/my-quiz-results"],
    queryFn: getQueryFn({ on401: "throw" })
  });

  const completedModules = assignments.filter(a => a.completedAt).length;
  const totalModules = assignments.length;
  const progressPercentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
  
  const averageScore = quizResults.length > 0 
    ? quizResults.reduce((sum, result) => sum + result.score, 0) / quizResults.length 
    : 0;

  const pendingModules = assignments.filter(a => !a.completedAt);
  const recentlyCompleted = assignments
    .filter(a => a.completedAt)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 3);

  if (assignmentsLoading || resultsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
      <div>
        <h3 className="text-2xl font-semibold text-neutral-dark">My Learning Dashboard</h3>
        <p className="text-neutral-medium">Track your training progress and continue learning</p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalModules}</div>
            <p className="text-xs text-muted-foreground">
              Assigned to you
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedModules}</div>
            <p className="text-xs text-muted-foreground">
              {progressPercentage.toFixed(0)}% complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingModules.length}</div>
            <p className="text-xs text-muted-foreground">
              To complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              Quiz performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Completion</span>
              <span>{completedModules}/{totalModules} modules</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Modules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Continue Learning</span>
              <Link href="/training">
                <Badge variant="outline" className="cursor-pointer hover:bg-gray-50">
                  View All
                </Badge>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingModules.length === 0 ? (
              <div className="text-center py-8 text-neutral-medium">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>Congratulations! You've completed all assigned modules.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingModules.slice(0, 3).map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{assignment.trainingModule.title}</h4>
                      <p className="text-xs text-neutral-medium">
                        {assignment.trainingModule.learningStage} • 
                        Assigned {new Date(assignment.assignedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {assignment.trainingModule.learningStage}
                      </Badge>
                      <Link href="/training">
                        <Button size="sm" variant="outline">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Completions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            {recentlyCompleted.length === 0 ? (
              <div className="text-center py-8 text-neutral-medium">
                <BookOpen className="h-12 w-12 mx-auto mb-4" />
                <p>Complete your first module to see achievements here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentlyCompleted.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{assignment.trainingModule.title}</h4>
                      <p className="text-xs text-green-600">
                        Completed {new Date(assignment.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Trophy className="h-5 w-5 text-green-500" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}