import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, CheckCircle, Clock, Play, Trophy } from "lucide-react";

export default function EmployeeTraining() {
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const { toast } = useToast();

  // Fetch user's assigned modules
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["/api/my-assignments"],
    queryFn: getQueryFn({ on401: "throw" })
  });

  const completeModuleMutation = useMutation({
    mutationFn: async (moduleId: number) => {
      const response = await apiRequest("POST", `/api/complete-module/${moduleId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-assignments"] });
      setShowModuleDialog(false);
      toast({
        title: "Module completed!",
        description: "Great job! You can now take the quiz for this module.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark module as complete.",
        variant: "destructive",
      });
    },
  });

  const handleViewModule = (assignment: any) => {
    setSelectedModule(assignment);
    setShowModuleDialog(true);
  };

  const handleCompleteModule = () => {
    if (selectedModule) {
      completeModuleMutation.mutate(selectedModule.trainingModule.id);
    }
  };

  const getStatusBadge = (assignment: any) => {
    if (assignment.completedAt) {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    }
    return <Badge variant="outline">In Progress</Badge>;
  };

  const getLearningStageColor = (stage: string) => {
    switch (stage) {
      case 'onboarding': return 'bg-blue-100 text-blue-800';
      case 'foundational': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const completedCount = assignments.filter(a => a.completedAt).length;
  const progressPercentage = assignments.length > 0 ? (completedCount / assignments.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-neutral-dark">My Training Modules</h3>
          <p className="text-neutral-medium">Complete your assigned training and track your progress</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-neutral-medium">Overall Progress</p>
          <div className="flex items-center space-x-2">
            <Progress value={progressPercentage} className="w-32 h-2" />
            <span className="text-sm font-medium">{completedCount}/{assignments.length}</span>
          </div>
        </div>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-neutral-medium" />
            <h3 className="text-lg font-semibold mb-2">No Training Modules Assigned</h3>
            <p className="text-neutral-medium">
              Your training modules will appear here once they are assigned by your administrator.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      {assignment.trainingModule.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mb-3">
                      <Badge className={getLearningStageColor(assignment.trainingModule.learningStage)}>
                        {assignment.trainingModule.learningStage}
                      </Badge>
                      {getStatusBadge(assignment)}
                    </div>
                  </div>
                  {assignment.completedAt && (
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-medium text-sm mb-4 line-clamp-3">
                  {assignment.trainingModule.description || "Complete this training module to enhance your skills."}
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-medium">Assigned:</span>
                    <span>{new Date(assignment.assignedAt).toLocaleDateString()}</span>
                  </div>
                  
                  {assignment.completedAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-medium">Completed:</span>
                      <span className="text-green-600">
                        {new Date(assignment.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <Button
                      onClick={() => handleViewModule(assignment)}
                      variant={assignment.completedAt ? "outline" : "default"}
                      className="w-full"
                    >
                      {assignment.completedAt ? (
                        <>
                          <Trophy className="h-4 w-4 mr-2" />
                          Review Module
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Learning
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Module Detail Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>{selectedModule?.trainingModule.title}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedModule && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Badge className={getLearningStageColor(selectedModule.trainingModule.learningStage)}>
                  {selectedModule.trainingModule.learningStage}
                </Badge>
                {getStatusBadge(selectedModule)}
              </div>

              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-neutral-medium">
                  {selectedModule.trainingModule.description || "This training module will help you develop essential skills and knowledge."}
                </p>
              </div>

              {selectedModule.trainingModule.document?.keyTopics && (
                <div>
                  <h4 className="font-semibold mb-2">Key Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedModule.trainingModule.document.keyTopics.map((topic: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">Training Content</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-neutral-medium">
                    {selectedModule.trainingModule.document?.aiSummary || 
                     "Complete this module to access the full training content and resources."}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowModuleDialog(false)}
                >
                  Close
                </Button>
                {!selectedModule.completedAt && (
                  <Button
                    onClick={handleCompleteModule}
                    disabled={completeModuleMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {completeModuleMutation.isPending ? "Completing..." : "Mark as Complete"}
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