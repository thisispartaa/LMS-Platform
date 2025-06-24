import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, MoreVertical, Users, Target, TrendingUp } from "lucide-react";
import type { TrainingModule } from "@/types";

interface ModuleCardProps {
  module: TrainingModule;
  onEdit?: (module: TrainingModule) => void;
  onView?: (module: TrainingModule) => void;
  enrolled?: number;
  completionRate?: number;
  averageScore?: number;
}

export default function ModuleCard({ 
  module, 
  onEdit, 
  onView,
  enrolled = 0,
  completionRate = 0,
  averageScore = 0
}: ModuleCardProps) {
  const getStageColor = (stage: string) => {
    switch (stage) {
      case "onboarding": return "bg-green-100 text-green-800";
      case "foundational": return "bg-blue-100 text-blue-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-100 text-green-800";
      case "draft": return "bg-gray-100 text-gray-800";
      case "archived": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-neutral-dark mb-2 line-clamp-1">
              {module.title}
            </h4>
            <div className="flex items-center space-x-2 mb-2">
              <Badge className={getStageColor(module.learningStage)}>
                {module.learningStage}
              </Badge>
              <Badge className={getStatusColor(module.status)}>
                {module.status}
              </Badge>
              {module.aiGenerated && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  AI Generated
                </Badge>
              )}
            </div>
            <p className="text-sm text-neutral-medium mb-4 line-clamp-3">
              {module.description || "No description available"}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="ml-4">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-neutral-medium">
              <Users className="h-3 w-3 mr-1" />
              <span>Enrolled</span>
            </div>
            <span className="font-medium text-neutral-dark">{enrolled} users</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-neutral-medium">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>Completion Rate</span>
            </div>
            <span className="font-medium text-neutral-dark">{completionRate}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-neutral-medium">
              <Target className="h-3 w-3 mr-1" />
              <span>Avg. Score</span>
            </div>
            <span className="font-medium text-neutral-dark">{averageScore}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-medium">Created</span>
            <span className="font-medium text-neutral-dark">
              {module.createdAt ? new Date(module.createdAt).toLocaleDateString() : "N/A"}
            </span>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button 
            className="flex-1 bg-primary hover:bg-primary-dark text-white" 
            size="sm"
            onClick={() => onEdit?.(module)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            className="flex-1" 
            size="sm"
            onClick={() => onView?.(module)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
