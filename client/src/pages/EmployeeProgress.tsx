import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getQueryFn } from "@/lib/queryClient";
import { Trophy, Target, BookOpen, Calendar, TrendingUp, Award } from "lucide-react";

export default function EmployeeProgress() {
  // Fetch user assignments and quiz results
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["/api/my-assignments"],
    queryFn: getQueryFn({ on401: "throw" })
  });

  const { data: quizResults = [], isLoading: resultsLoading } = useQuery({
    queryKey: ["/api/my-quiz-results"],
    queryFn: getQueryFn({ on401: "throw" })
  });

  if (assignmentsLoading || resultsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const completedModules = assignments.filter(a => a.completedAt);
  const totalModules = assignments.length;
  const progressPercentage = totalModules > 0 ? (completedModules.length / totalModules) * 100 : 0;
  
  const averageScore = quizResults.length > 0 
    ? quizResults.reduce((sum, result) => sum + result.score, 0) / quizResults.length 
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (percentage >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  const getLearningStageStats = () => {
    const stats = assignments.reduce((acc, assignment) => {
      const stage = assignment.trainingModule.learningStage;
      if (!acc[stage]) acc[stage] = { total: 0, completed: 0 };
      acc[stage].total++;
      if (assignment.completedAt) acc[stage].completed++;
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    return Object.entries(stats).map(([stage, data]) => ({
      stage,
      ...data,
      percentage: (data.completed / data.total) * 100
    }));
  };

  const stageStats = getLearningStageStats();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold text-neutral-dark">My Progress</h3>
        <p className="text-neutral-medium">Track your learning journey and achievements</p>
      </div>

      {/* Overall Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressPercentage.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              {completedModules.length} of {totalModules} modules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
              {averageScore.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across {quizResults.length} quizzes
            </p>
          </CardContent>
        </Card>

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
            <CardTitle className="text-sm font-medium">Quizzes Taken</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizResults.length}</div>
            <p className="text-xs text-muted-foreground">
              Total assessments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Learning Stage Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Progress by Learning Stage</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stageStats.map(({ stage, completed, total, percentage }) => (
              <div key={stage} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="capitalize">
                      {stage}
                    </Badge>
                    <span className="text-sm text-neutral-medium">
                      {completed}/{total} completed
                    </span>
                  </div>
                  <span className="text-sm font-medium">{percentage.toFixed(0)}%</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Completions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Recent Completions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {completedModules.length === 0 ? (
              <div className="text-center py-8 text-neutral-medium">
                <BookOpen className="h-12 w-12 mx-auto mb-4" />
                <p>No completed modules yet. Start learning to see your progress here!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedModules
                  .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                  .slice(0, 5)
                  .map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{assignment.trainingModule.title}</h4>
                        <p className="text-xs text-neutral-medium">
                          {assignment.trainingModule.learningStage} • 
                          {new Date(assignment.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Trophy className="h-5 w-5 text-green-500" />
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quiz Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Quiz Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quizResults.length === 0 ? (
              <div className="text-center py-8 text-neutral-medium">
                <Award className="h-12 w-12 mx-auto mb-4" />
                <p>Complete some quizzes to see your performance here!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {quizResults
                  .sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime())
                  .slice(0, 5)
                  .map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{result.trainingModule?.title || 'Quiz'}</h4>
                        <p className="text-xs text-neutral-medium">
                          {new Date(result.takenAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getScoreColor((result.score / result.totalQuestions) * 100)}`}>
                          {result.score}/{result.totalQuestions}
                        </div>
                        {getScoreBadge(result.score, result.totalQuestions)}
                      </div>
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