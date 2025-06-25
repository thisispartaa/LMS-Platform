import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddQuestionDialog, setShowAddQuestionDialog] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    questionText: "",
    questionType: "multiple_choice" as "multiple_choice" | "true_false",
    options: ["", "", "", ""],
    correctAnswer: "",
    explanation: ""
  });
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
    defaultValues: {
      questionText: "",
      questionType: "multiple_choice",
      options: [],
      correctAnswer: "",
      explanation: "",
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/quiz-questions", {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to create question');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-questions", selectedModuleId] });
      setShowAddQuestionDialog(false);
      setNewQuestion({
        questionText: "",
        questionType: "multiple_choice",
        options: ["", "", "", ""],
        correctAnswer: "",
        explanation: ""
      });
      toast({
        title: "Success",
        description: "Question added successfully"
      });
    },
    onError: (error: any) => {
      console.error('Question creation error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to add question",
        variant: "destructive"
      });
    }
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (data: EditQuestionForm & { id: number }) => {
      const response = await fetch(`/api/quiz-questions/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to update question');
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

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      const response = await fetch(`/api/quiz-questions/${questionId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete question');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-questions", selectedModuleId] });
      toast({
        title: "Question deleted successfully",
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

  const handleAddQuestion = () => {
    if (!selectedModuleId || !newQuestion.questionText.trim() || !newQuestion.correctAnswer) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const questionData = {
      moduleId: parseInt(selectedModuleId),
      questionText: newQuestion.questionText.trim(),
      questionType: newQuestion.questionType,
      options: newQuestion.questionType === "multiple_choice" ? newQuestion.options.filter(opt => opt.trim()) : undefined,
      correctAnswer: newQuestion.correctAnswer,
      explanation: newQuestion.explanation?.trim() || ""
    };

    createQuestionMutation.mutate(questionData);
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
              <Select
                value={selectedModuleId}
                onValueChange={(value) => setSelectedModuleId(value)}
              >
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

            {selectedModuleId && (
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Quiz Questions</h3>
                <Button 
                  onClick={() => {
                    if (selectedModuleId) {
                      setShowAddQuestionDialog(true);
                    }
                  }}
                  disabled={!selectedModuleId}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            )}
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
                onClick={() => setShowAddQuestionDialog(true)}
                className="bg-primary hover:bg-primary-dark"
                disabled={createQuestionMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                {createQuestionMutation.isPending ? "Adding..." : "Add Question"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {questionsLoading ? (
              <div className="text-center py-8">
                <div className="text-neutral-medium">Loading questions...</div>
              </div>
            ) : quizQuestions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-neutral-medium mb-4">No quiz questions found for this module.</div>
                <Button onClick={() => setShowAddQuestionDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Question
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {quizQuestions.map((question: any, index: number) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-6 bg-white">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="text-sm font-medium text-neutral-dark bg-gray-100 px-2 py-1 rounded">
                            Question {index + 1}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {question.questionType === 'multiple_choice' ? 'Multiple Choice' : 'True/False'}
                          </Badge>
                        </div>
                        <h4 className="text-lg font-medium text-neutral-dark mb-4">
                          {question.questionText}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditQuestion(question)}
                          className="text-neutral-dark hover:text-primary"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteQuestion(question)}
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                          disabled={deleteQuestionMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>

                    {/* Multiple choice options */}
                    {question.questionType === 'multiple_choice' && question.options && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-neutral-dark mb-2">Answer Options:</h5>
                        <div className="space-y-2">
                          {question.options.map((option: string, optIndex: number) => (
                            <div key={optIndex} className="flex items-center space-x-2 text-sm text-neutral-medium">
                              <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span>
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
                        placeholder="Enter your question here..."
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

      {/* Add Question Dialog */}
      <Dialog open={showAddQuestionDialog} onOpenChange={setShowAddQuestionDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Question</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Question Text</label>
              <Textarea
                placeholder="Enter your question here..."
                value={newQuestion.questionText}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, questionText: e.target.value }))}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Question Type</label>
              <Select
                value={newQuestion.questionType}
                onValueChange={(value: "multiple_choice" | "true_false") => 
                  setNewQuestion(prev => ({ 
                    ...prev, 
                    questionType: value,
                    options: value === "true_false" ? ["True", "False"] : ["", "", "", ""],
                    correctAnswer: ""
                  }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                  <SelectItem value="true_false">True/False</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newQuestion.questionType === "multiple_choice" && (
              <div>
                <label className="text-sm font-medium">Answer Options</label>
                <div className="space-y-2 mt-1">
                  {newQuestion.options.map((option, index) => (
                    <Input
                      key={index}
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...newQuestion.options];
                        newOptions[index] = e.target.value;
                        setNewQuestion(prev => ({ ...prev, options: newOptions }));
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Correct Answer</label>
              {newQuestion.questionType === "multiple_choice" ? (
                <Select
                  value={newQuestion.correctAnswer}
                  onValueChange={(value) => setNewQuestion(prev => ({ ...prev, correctAnswer: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select the correct answer" />
                  </SelectTrigger>
                  <SelectContent>
                    {newQuestion.options.filter(option => option.trim()).map((option, index) => (
                      <SelectItem key={index} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={newQuestion.correctAnswer}
                  onValueChange={(value) => setNewQuestion(prev => ({ ...prev, correctAnswer: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="True">True</SelectItem>
                    <SelectItem value="False">False</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Explanation (Optional)</label>
              <Textarea
                placeholder="Explain why this is the correct answer..."
                value={newQuestion.explanation}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, explanation: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setShowAddQuestionDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddQuestion} 
              disabled={createQuestionMutation.isPending || !newQuestion.questionText.trim() || !newQuestion.correctAnswer}
            >
              {createQuestionMutation.isPending ? "Adding..." : "Add Question"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}