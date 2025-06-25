import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Download, 
  Play, 
  FileText, 
  Trophy,
  Calendar,
  Target,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";

interface AssignedModule {
  id: number;
  moduleId: number;
  moduleTitle: string;
  moduleDescription: string;
  learningStage: string;
  assignedAt: string;
  completedAt: string | null;
  isCompleted: boolean;
  document?: {
    id: number;
    fileName: string;
    fileType: string;
    filePath: string;
  };
  summary?: string;
  keyTopics?: string[];
}

interface QuizQuestion {
  id: number;
  questionText: string;
  questionType: "multiple_choice" | "true_false";
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [selectedModule, setSelectedModule] = useState<AssignedModule | null>(null);
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const { toast } = useToast();

  // Fetch user's assigned modules
  const { data: assignedModules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ["/api/user/assigned-modules"],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  console.log('Assigned modules data:', assignedModules);

  // Fetch user's progress stats
  const { data: progressStats } = useQuery({
    queryKey: ["/api/user/progress-stats"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const markCompletedMutation = useMutation({
    mutationFn: async (moduleId: number) => {
      const response = await fetch(`/api/user/complete-module/${moduleId}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to mark module as completed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/assigned-modules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/progress-stats"] });
      toast({
        title: "Module completed!",
        description: "Great job completing this training module."
      });
    }
  });

  const submitQuizMutation = useMutation({
    mutationFn: async (quizData: any) => {
      const response = await fetch('/api/user/submit-quiz', {
        method: 'POST',
        body: JSON.stringify(quizData),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to submit quiz');
      return response.json();
    },
    onSuccess: (data) => {
      setScore(data.score);
      setQuizCompleted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/user/assigned-modules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/progress-stats"] });
    }
  });

  const handleViewModule = async (module: AssignedModule) => {
    setSelectedModule(module);
    setShowModuleDialog(true);
  };

  const handleStartQuiz = async (moduleId: number) => {
    try {
      const response = await fetch(`/api/quiz-questions/${moduleId}`);
      const questions = await response.json();
      setQuizQuestions(questions);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setShowExplanation(false);
      setQuizCompleted(false);
      setScore(0);
      setShowQuizDialog(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load quiz questions",
        variant: "destructive"
      });
    }
  };

  const handleAnswerSelect = (answer: string) => {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowExplanation(false);
    } else {
      // Submit quiz
      const correctAnswers = quizQuestions.filter(q => 
        selectedAnswers[q.id] === q.correctAnswer
      ).length;
      
      submitQuizMutation.mutate({
        moduleId: selectedModule?.moduleId,
        answers: selectedAnswers,
        score: correctAnswers,
        totalQuestions: quizQuestions.length
      });
    }
  };

  const handleDownloadDocument = (module: AssignedModule) => {
    if (module.document) {
      const link = document.createElement('a');
      link.href = `/api/documents/download/${module.document.id}`;
      link.download = module.document.fileName;
      link.click();
    }
  };

  const completedModules = (assignedModules as AssignedModule[]).filter((m: AssignedModule) => m.isCompleted);
  const pendingModules = (assignedModules as AssignedModule[]).filter((m: AssignedModule) => !m.isCompleted);
  const completionRate = (assignedModules as AssignedModule[]).length > 0 
    ? Math.round((completedModules.length / (assignedModules as AssignedModule[]).length) * 100) 
    : 0;

  if (!user || (user as any).role !== 'employee') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mt-2">This dashboard is only available to employees.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-dark">My Training Dashboard</h1>
        <p className="text-neutral-medium mt-2">Track your learning progress and complete assigned modules</p>
      </div>

      {/* Progress Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(assignedModules as AssignedModule[]).length}</div>
            <p className="text-xs text-muted-foreground">Assigned to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedModules.length}</div>
            <p className="text-xs text-muted-foreground">Modules finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingModules.length}</div>
            <p className="text-xs text-muted-foreground">Still to complete</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{completionRate}%</div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Training Modules Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Modules ({pendingModules.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedModules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {modulesLoading ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-lg">Loading your assignments...</div>
              </CardContent>
            </Card>
          ) : pendingModules.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">All caught up!</h3>
                <p className="text-gray-600">You've completed all your assigned training modules.</p>
                <p className="text-sm text-gray-500 mt-2">Debug: Found {(assignedModules as AssignedModule[]).length} total assignments</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingModules.map((module: AssignedModule) => (
                <Card key={module.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{module.moduleTitle}</CardTitle>
                        <p className="text-gray-600 mt-1">{module.moduleDescription}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="outline">{module.learningStage}</Badge>
                          <span className="text-sm text-gray-500">
                            Assigned {format(new Date(module.assignedAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Button onClick={() => handleViewModule(module)}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Study Module
                      </Button>
                      {module.document && (
                        <Button 
                          variant="outline" 
                          onClick={() => handleDownloadDocument(module)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download {module.document.fileType.toUpperCase()}
                        </Button>
                      )}
                      <Button 
                        variant="outline"
                        onClick={() => handleStartQuiz(module.moduleId)}
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        Take Quiz
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4">
            {completedModules.map((module: AssignedModule) => (
              <Card key={module.id} className="border-green-200 bg-green-50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        {module.moduleTitle}
                      </CardTitle>
                      <p className="text-gray-600 mt-1">{module.moduleDescription}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline">{module.learningStage}</Badge>
                        <span className="text-sm text-gray-500">
                          Completed {module.completedAt && format(new Date(module.completedAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={() => handleViewModule(module)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Review Module
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Module Details Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              {selectedModule?.moduleTitle}
            </DialogTitle>
          </DialogHeader>
          
          {selectedModule && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700">{selectedModule.moduleDescription}</p>
              </div>

              {selectedModule.summary && (
                <div>
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <p className="text-gray-700">{selectedModule.summary}</p>
                </div>
              )}

              {selectedModule.keyTopics && selectedModule.keyTopics.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Key Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedModule.keyTopics.map((topic, index) => (
                      <Badge key={index} variant="secondary">{topic}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Learning Stage</h3>
                <Badge>{selectedModule.learningStage}</Badge>
              </div>

              {selectedModule.document && (
                <div>
                  <h3 className="font-semibold mb-2">Training Material</h3>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <span>{selectedModule.document.fileName}</span>
                    <Button 
                      size="sm" 
                      onClick={() => handleDownloadDocument(selectedModule)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-4 border-t">
                {!selectedModule.isCompleted && (
                  <Button 
                    onClick={() => markCompletedMutation.mutate(selectedModule.moduleId)}
                    disabled={markCompletedMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {markCompletedMutation.isPending ? "Marking Complete..." : "Mark as Completed"}
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={() => handleStartQuiz(selectedModule.moduleId)}
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Take Quiz
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quiz Dialog */}
      <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {quizCompleted ? "Quiz Results" : `Question ${currentQuestionIndex + 1} of ${quizQuestions.length}`}
            </DialogTitle>
          </DialogHeader>

          {quizCompleted ? (
            <div className="text-center space-y-4">
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto" />
              <h3 className="text-2xl font-bold">Quiz Completed!</h3>
              <p className="text-lg">
                You scored {score} out of {quizQuestions.length} ({Math.round((score / quizQuestions.length) * 100)}%)
              </p>
              <Button onClick={() => setShowQuizDialog(false)}>
                Close Quiz
              </Button>
            </div>
          ) : quizQuestions.length > 0 && (
            <div className="space-y-4">
              <Progress value={((currentQuestionIndex + 1) / quizQuestions.length) * 100} />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {quizQuestions[currentQuestionIndex]?.questionText}
                </h3>

                <div className="space-y-2">
                  {quizQuestions[currentQuestionIndex]?.questionType === "multiple_choice" ? (
                    quizQuestions[currentQuestionIndex]?.options?.map((option, index) => (
                      <Button
                        key={index}
                        variant={selectedAnswers[quizQuestions[currentQuestionIndex].id] === option ? "default" : "outline"}
                        className="w-full justify-start text-left"
                        onClick={() => handleAnswerSelect(option)}
                        disabled={showExplanation}
                      >
                        {String.fromCharCode(65 + index)}. {option}
                      </Button>
                    ))
                  ) : (
                    <div className="space-y-2">
                      <Button
                        variant={selectedAnswers[quizQuestions[currentQuestionIndex].id] === "True" ? "default" : "outline"}
                        className="w-full"
                        onClick={() => handleAnswerSelect("True")}
                        disabled={showExplanation}
                      >
                        True
                      </Button>
                      <Button
                        variant={selectedAnswers[quizQuestions[currentQuestionIndex].id] === "False" ? "default" : "outline"}
                        className="w-full"
                        onClick={() => handleAnswerSelect("False")}
                        disabled={showExplanation}
                      >
                        False
                      </Button>
                    </div>
                  )}
                </div>

                {showExplanation && (
                  <div className={`p-4 rounded-lg ${
                    selectedAnswers[quizQuestions[currentQuestionIndex].id] === quizQuestions[currentQuestionIndex].correctAnswer
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}>
                    <p className={`font-semibold mb-2 ${
                      selectedAnswers[quizQuestions[currentQuestionIndex].id] === quizQuestions[currentQuestionIndex].correctAnswer
                        ? "text-green-800"
                        : "text-red-800"
                    }`}>
                      {selectedAnswers[quizQuestions[currentQuestionIndex].id] === quizQuestions[currentQuestionIndex].correctAnswer
                        ? "Correct!" 
                        : `Incorrect. The correct answer is: ${quizQuestions[currentQuestionIndex].correctAnswer}`
                      }
                    </p>
                    <p className="text-gray-700">{quizQuestions[currentQuestionIndex].explanation}</p>
                  </div>
                )}

                {showExplanation && (
                  <Button onClick={handleNextQuestion} className="w-full">
                    {currentQuestionIndex < quizQuestions.length - 1 ? "Next Question" : "Finish Quiz"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}