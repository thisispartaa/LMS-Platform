import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, X, Save, Trash2 } from "lucide-react";
import type { QuizQuestion } from "@/types";

interface QuizEditorProps {
  moduleId: number;
  question?: QuizQuestion | null;
  onClose: () => void;
  onSave: () => void;
}

export default function QuizEditor({ moduleId, question, onClose, onSave }: QuizEditorProps) {
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<"multiple_choice" | "true_false">("multiple_choice");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [order, setOrder] = useState(1);
  const { toast } = useToast();

  // Initialize form with existing question data
  useEffect(() => {
    if (question) {
      setQuestionText(question.questionText);
      setQuestionType(question.questionType);
      setOptions(question.options || ["", "", "", ""]);
      setCorrectAnswer(question.correctAnswer);
      setExplanation(question.explanation || "");
      setOrder(question.order);
    } else {
      // Reset form for new question
      setQuestionText("");
      setQuestionType("multiple_choice");
      setOptions(["", "", "", ""]);
      setCorrectAnswer("");
      setExplanation("");
      setOrder(1);
    }
  }, [question]);

  const saveQuestionMutation = useMutation({
    mutationFn: async (questionData: any) => {
      if (question) {
        // Update existing question
        const response = await apiRequest("PUT", `/api/quiz-questions/${question.id}`, questionData);
        return response.json();
      } else {
        // Create new question
        const response = await apiRequest("POST", "/api/quiz-questions", questionData);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: question ? "Question updated" : "Question created",
        description: question ? "The quiz question has been updated." : "New quiz question has been created.",
      });
      onSave();
    },
    onError: () => {
      toast({
        title: "Save failed",
        description: "There was an error saving the question.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    // Validation
    if (!questionText.trim()) {
      toast({
        title: "Validation error",
        description: "Question text is required.",
        variant: "destructive",
      });
      return;
    }

    if (!correctAnswer.trim()) {
      toast({
        title: "Validation error",
        description: "Correct answer is required.",
        variant: "destructive",
      });
      return;
    }

    if (questionType === "multiple_choice") {
      const filledOptions = options.filter(opt => opt.trim());
      if (filledOptions.length < 2) {
        toast({
          title: "Validation error",
          description: "At least 2 options are required for multiple choice questions.",
          variant: "destructive",
        });
        return;
      }

      if (!filledOptions.includes(correctAnswer)) {
        toast({
          title: "Validation error",
          description: "Correct answer must match one of the options.",
          variant: "destructive",
        });
        return;
      }
    }

    const questionData = {
      moduleId,
      questionText: questionText.trim(),
      questionType,
      options: questionType === "multiple_choice" ? options.filter(opt => opt.trim()) : undefined,
      correctAnswer: correctAnswer.trim(),
      explanation: explanation.trim() || undefined,
      order,
    };

    saveQuestionMutation.mutate(questionData);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      
      // Reset correct answer if it was the removed option
      if (correctAnswer === options[index]) {
        setCorrectAnswer("");
      }
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {question ? "Edit Quiz Question" : "Create Quiz Question"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Question Text */}
          <div className="space-y-2">
            <Label htmlFor="question-text">Question Text *</Label>
            <Textarea
              id="question-text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter your question here..."
              rows={3}
            />
          </div>

          {/* Question Type */}
          <div className="space-y-2">
            <Label>Question Type</Label>
            <Select value={questionType} onValueChange={(value: any) => {
              setQuestionType(value);
              setCorrectAnswer(""); // Reset correct answer when type changes
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="true_false">True/False</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Options Section */}
          {questionType === "multiple_choice" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Answer Options *</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={options.length >= 6}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1"
                    />
                    {options.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                        className="text-error hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Correct Answer Selection for Multiple Choice */}
              <div className="space-y-2">
                <Label>Correct Answer *</Label>
                <RadioGroup value={correctAnswer} onValueChange={setCorrectAnswer}>
                  {options.filter(opt => opt.trim()).map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="truncate">
                        {option || `Option ${index + 1}`}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          ) : (
            /* True/False Options */
            <div className="space-y-2">
              <Label>Correct Answer *</Label>
              <RadioGroup value={correctAnswer} onValueChange={setCorrectAnswer}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="True" id="true" />
                  <Label htmlFor="true">True</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="False" id="false" />
                  <Label htmlFor="false">False</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Explanation */}
          <div className="space-y-2">
            <Label htmlFor="explanation">Explanation (Optional)</Label>
            <Textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Provide an explanation for the correct answer..."
              rows={3}
            />
          </div>

          {/* Order */}
          <div className="space-y-2">
            <Label htmlFor="order">Question Order</Label>
            <Input
              id="order"
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
              min={1}
              className="w-24"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveQuestionMutation.isPending}
              className="bg-primary hover:bg-primary-dark"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveQuestionMutation.isPending ? "Saving..." : "Save Question"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
