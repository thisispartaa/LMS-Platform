import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { HelpCircle, Edit, Save, X, Plus, Trash2 } from "lucide-react";

const editQuestionSchema = z.object({
  questionText: z.string().min(10, "Question must be at least 10 characters"),
  questionType: z.enum(["multiple_choice", "true_false"]),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  explanation: z.string().min(10, "Explanation must be at least 10 characters"),
});

type EditQuestionForm = z.infer<typeof editQuestionSchema>;

export default function QuizManagement() {
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();
  
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

  const form = useForm<EditQuestionForm>({
    resolver: zodResolver(editQuestionSchema),
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/quiz-questions", data);
    },
    onSuccess: () => {
      toast({
        title: "Question created",
        description: "The quiz question has been created successfully.",
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/quiz-questions", selectedModuleId] 
      });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/quiz-questions/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Question deleted",
        description: "The quiz question has been deleted successfully.",
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/quiz-questions", selectedModuleId] 
      });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (data: EditQuestionForm & { id: number }) => {
      const response = await apiRequest("PUT", `/api/quiz-questions/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-questions", selectedModuleId] });
      setShowEditDialog(false);
      setEditingQuestion(null);
      toast({
        title: "Question updated successfully",
        description: "The quiz question has been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "There was an error updating the question.",
        variant: "destructive",
      });
    },
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

  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question);
    form.reset({
      questionText: question.questionText,
      questionType: question.questionType,
      options: question.options || [],
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    });
    setShowEditDialog(true);
  };

  const handleUpdateQuestion = (data: EditQuestionForm) => {
    if (!editingQuestion) return;
    updateQuestionMutation.mutate({ ...data, id: editingQuestion.id });
  };

  const handleDeleteQuestion = (question: any) => {
    if (confirm("Are you sure you want to delete this question?")) {
      deleteQuestionMutation.mutate(question.id);
    }
  };

  const handleCreateQuestion = () => {
    if (!selectedModuleId) return;
    
    const newQuestion = {
      moduleId: selectedModuleId,
      questionText: "New question text",
      questionType: "multiple_choice",
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
      correctAnswer: "Option 1",
      explanation: "Explanation for the correct answer"
    };
    
    createQuestionMutation.mutate(newQuestion);
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
                  {(modules as any[])?.map((module: any) => (
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
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HelpCircle className="h-5 w-5" />
                <span>Quiz Questions</span>
              </div>
              <Button
                onClick={handleCreateQuestion}
                className="bg-primary hover:bg-primary-dark"
                disabled={createQuestionMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
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
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditQuestion(question)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteQuestion(question)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
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

      {/* Edit Question Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Quiz Question</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateQuestion)} className="space-y-6">
              <FormField
                control={form.control}
                name="questionText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Text</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your question..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="questionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select question type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="true_false">True/False</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("questionType") === "multiple_choice" && (
                <div className="space-y-3">
                  <FormLabel>Answer Options</FormLabel>
                  {[0, 1, 2, 3].map((index) => (
                    <FormField
                      key={index}
                      control={form.control}
                      name={`options.${index}` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder={`Option ${String.fromCharCode(65 + index)}`}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              )}

              <FormField
                control={form.control}
                name="correctAnswer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correct Answer</FormLabel>
                    <FormControl>
                      {form.watch("questionType") === "true_false" ? (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select correct answer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="Enter the correct answer exactly as written in options"
                          {...field}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="explanation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Explanation</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why this is the correct answer..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button type="submit" disabled={updateQuestionMutation.isPending}>
                  <Save className="h-4 w-4 mr-1" />
                  {updateQuestionMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}