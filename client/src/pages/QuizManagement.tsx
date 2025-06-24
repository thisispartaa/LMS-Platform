import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getQueryFn } from "@/lib/queryClient";
import { HelpCircle } from "lucide-react";

export default function QuizManagement() {
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  
  // Fetch training modules
  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ["/api/training-modules"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch quiz questions for selected module
  const { data: quizQuestions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ["/api/quiz-questions", selectedModuleId],
    queryFn: async () => {
      if (!selectedModuleId) return [];
      const response = await fetch(`/api/quiz-questions/${selectedModuleId}`);
      if (!response.ok) throw new Error('Failed to fetch quiz questions');
      return response.json();
    },
    enabled: !!selectedModuleId,
  });

  const getQuestionTypeDisplay = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'true_false':
        return 'True/False';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-dark">Quiz Management</h1>
        <p className="text-neutral-medium mt-2">View and manage quizzes for training modules</p>
      </div>

      {/* Module Selection */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-neutral-dark mb-2 block">
                Select Training Module
              </label>
              <Select value={selectedModuleId?.toString()} onValueChange={(value) => setSelectedModuleId(Number(value))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a module to view its quizzes" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module: any) => (
                    <SelectItem key={module.id} value={module.id.toString()}>
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiz Questions Display */}
      {selectedModuleId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HelpCircle className="h-5 w-5" />
              <span>Quiz Questions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {questionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-neutral-medium">Loading quiz questions...</div>
              </div>
            ) : quizQuestions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HelpCircle className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-neutral-dark mb-2">No Quiz Questions</h3>
                <p className="text-neutral-medium">
                  This module doesn't have any quiz questions yet.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {quizQuestions.map((question: any, index: number) => (
                  <div key={question.id} className="border rounded-lg p-6 bg-white">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge variant="outline" className="text-xs">
                            Question {index + 1}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {getQuestionTypeDisplay(question.questionType)}
                          </Badge>
                        </div>
                        <h4 className="text-lg font-medium text-neutral-dark mb-3">
                          {question.questionText}
                        </h4>
                      </div>
                    </div>

                    {/* Options for multiple choice */}
                    {question.questionType === 'multiple_choice' && question.options && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-neutral-dark mb-2">Options:</h5>
                        <div className="space-y-2">
                          {question.options.map((option: string, optionIndex: number) => (
                            <div 
                              key={optionIndex} 
                              className={`p-3 rounded-lg border text-sm ${
                                option === question.correctAnswer 
                                  ? 'bg-green-50 border-green-200 text-green-700' 
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <span className="font-medium mr-2">
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                              {option}
                              {option === question.correctAnswer && (
                                <span className="ml-2 text-green-600 font-medium">✓ Correct</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* True/False answer */}
                    {question.questionType === 'true_false' && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-neutral-dark mb-2">Correct Answer:</h5>
                        <Badge className={question.correctAnswer === 'true' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {question.correctAnswer === 'true' ? 'True' : 'False'}
                        </Badge>
                      </div>
                    )}

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-blue-900 mb-2">Explanation:</h5>
                        <p className="text-sm text-blue-800">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}