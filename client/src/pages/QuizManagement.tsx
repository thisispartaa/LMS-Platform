import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Eye, Edit, Trash2, CheckCircle, Circle } from "lucide-react";
import QuizEditor from "@/components/quiz/QuizEditor";
import type { TrainingModule, QuizQuestion } from "@/types";

export default function QuizManagement() {
  const [selectedModule, setSelectedModule] = useState<number | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const { toast } = useToast();

  const { data: modules, isLoading: modulesLoading } = useQuery<TrainingModule[]>({
    queryKey: ["/api/modules"],
  });

  const { data: questions, isLoading: questionsLoading } = useQuery<QuizQuestion[]>({
    queryKey: ["/api/modules", selectedModule, "questions"],
    enabled: !!selectedModule,
  });

  const generateQuizMutation = useMutation({
    mutationFn: async (moduleId: number) => {
      const response = await apiRequest("POST", `/api/modules/${moduleId}/generate-quiz`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules", selectedModule, "questions"] });
      toast({
        title: "Quiz generated successfully",
        description: "AI has created quiz questions for this module.",
      });
    },
    onError: () => {
      toast({
        title: "Quiz generation failed",
        description: "There was an error generating quiz questions.",
        variant: "destructive",
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      await apiRequest("DELETE", `/api/quiz-questions/${questionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules", selectedModule, "questions"] });
      toast({
        title: "Question deleted",
        description: "The quiz question has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "There was an error deleting the question.",
        variant: "destructive",
      });
    },
  });

  const getQuestionTypeColor = (type: string) => {
    return type === "multiple_choice" 
      ? "bg-blue-100 text-blue-800" 
      : "bg-green-100 text-green-800";
  };

  const getQuestionTypeLabel = (type: string) => {
    return type === "multiple_choice" ? "Multiple Choice" : "True/False";
  };

  if (modulesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-neutral-dark">Quiz Management</h3>
            <p className="text-neutral-medium">Create, edit, and manage quiz questions</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-neutral-dark">Quiz Management</h3>
          <p className="text-neutral-medium">Create, edit, and manage quiz questions</p>
        </div>
        <Button
          onClick={() => {
            setEditingQuestion(null);
            setShowEditor(true);
          }}
          className="bg-primary hover:bg-primary-dark"
          disabled={!selectedModule}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Quiz
        </Button>
      </div>

      {/* Module Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Module</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedModule?.toString() || ""}
            onValueChange={(value) => setSelectedModule(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a training module to manage quizzes" />
            </SelectTrigger>
            <SelectContent>
              {modules?.map((module) => (
                <SelectItem key={module.id} value={module.id.toString()}>
                  {module.title} ({module.learningStage})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedModule && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>
                {modules?.find(m => m.id === selectedModule)?.title} Quiz
              </CardTitle>
              <p className="text-neutral-medium mt-1">
                {questions?.length || 0} questions • Average completion rate: 85%
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-green-100 text-green-800">Active</Badge>
              <Button
                onClick={() => generateQuizMutation.mutate(selectedModule)}
                disabled={generateQuizMutation.isPending}
                size="sm"
                className="bg-primary hover:bg-primary-dark"
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate AI Quiz
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {questionsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : questions && questions.length > 0 ? (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-neutral-dark">
                            Question {index + 1}
                          </span>
                          <Badge className={getQuestionTypeColor(question.questionType)}>
                            {getQuestionTypeLabel(question.questionType)}
                          </Badge>
                        </div>
                        <p className="text-neutral-dark">{question.questionText}</p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingQuestion(question);
                            setShowEditor(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteQuestionMutation.mutate(question.id)}
                          className="text-error hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 ml-4">
                      {question.questionType === "multiple_choice" && question.options ? (
                        question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2">
                            <div className="w-4 h-4 border border-gray-300 rounded flex-shrink-0 flex items-center justify-center">
                              {option === question.correctAnswer && (
                                <div className="w-2 h-2 bg-success rounded-full"></div>
                              )}
                            </div>
                            <span className="text-sm text-neutral-dark">{option}</span>
                          </div>
                        ))
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border border-gray-300 rounded flex-shrink-0 flex items-center justify-center">
                              {question.correctAnswer === "True" && (
                                <div className="w-2 h-2 bg-success rounded-full"></div>
                              )}
                            </div>
                            <span className="text-sm text-neutral-dark">True</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border border-gray-300 rounded flex-shrink-0 flex items-center justify-center">
                              {question.correctAnswer === "False" && (
                                <div className="w-2 h-2 bg-success rounded-full"></div>
                              )}
                            </div>
                            <span className="text-sm text-neutral-dark">False</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {question.explanation && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-neutral-medium">
                          <strong>Explanation:</strong> {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex justify-end space-x-4 mt-6">
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Quiz
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingQuestion(null);
                      setShowEditor(true);
                    }}
                    className="bg-primary hover:bg-primary-dark"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-neutral-medium mb-4">No quiz questions found for this module.</p>
                <div className="space-x-2">
                  <Button
                    onClick={() => generateQuizMutation.mutate(selectedModule)}
                    disabled={generateQuizMutation.isPending}
                    className="bg-primary hover:bg-primary-dark"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate AI Quiz
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingQuestion(null);
                      setShowEditor(true);
                    }}
                  >
                    Create Manual Question
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quiz Editor Modal/Dialog would go here */}
      {showEditor && (
        <QuizEditor
          moduleId={selectedModule!}
          question={editingQuestion}
          onClose={() => {
            setShowEditor(false);
            setEditingQuestion(null);
          }}
          onSave={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/modules", selectedModule, "questions"] });
            setShowEditor(false);
            setEditingQuestion(null);
          }}
        />
      )}
    </div>
  );
}
