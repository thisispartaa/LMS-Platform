import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Eye, Edit, MoreVertical, Trash2, BookOpen } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TrainingModule } from "@/types";

const createModuleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  learningStage: z.enum(["onboarding", "foundational", "intermediate", "advanced"]),
  status: z.enum(["draft", "published"]).default("draft"),
});

type CreateModuleForm = z.infer<typeof createModuleSchema>;

export default function TrainingModules() {
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: modules, isLoading } = useQuery<TrainingModule[]>({
    queryKey: ["/api/training-modules"],
  });

  const form = useForm<CreateModuleForm>({
    resolver: zodResolver(createModuleSchema),
    defaultValues: {
      title: "",
      description: "",
      learningStage: "foundational",
      status: "draft",
    },
  });

  const createModuleMutation = useMutation({
    mutationFn: async (data: CreateModuleForm) => {
      const response = await apiRequest("POST", "/api/training-modules", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-modules"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Module created successfully",
        description: "Your training module has been created and is ready for content.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create module",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateModule = (data: CreateModuleForm) => {
    createModuleMutation.mutate(data);
  };

  const updateModuleMutation = useMutation({
    mutationFn: async (data: CreateModuleForm) => {
      if (!selectedModule) throw new Error("No module selected");
      const response = await apiRequest("PUT", `/api/training-modules/${selectedModule.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-modules"] });
      setIsEditDialogOpen(false);
      setSelectedModule(null);
      form.reset();
      toast({
        title: "Module updated successfully",
        description: "Your training module has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update module",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: number) => {
      const response = await apiRequest("DELETE", `/api/training-modules/${moduleId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-modules"] });
      toast({
        title: "Module deleted successfully",
        description: "The training module has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete module",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditModule = (module: TrainingModule) => {
    setSelectedModule(module);
    form.setValue("title", module.title);
    form.setValue("description", module.description || "");
    form.setValue("learningStage", module.learningStage);
    form.setValue("status", module.status as "draft" | "published");
    setIsEditDialogOpen(true);
  };

  const handleViewModule = (module: TrainingModule) => {
    setSelectedModule(module);
    setIsViewDialogOpen(true);
  };

  const handleDeleteModule = (module: TrainingModule) => {
    if (confirm(`Are you sure you want to delete "${module.title}"? This action cannot be undone.`)) {
      deleteModuleMutation.mutate(module.id);
    }
  };

  const handleUpdateModule = (data: CreateModuleForm) => {
    updateModuleMutation.mutate(data);
  };

  const filteredModules = modules?.filter((module) => {
    const matchesSearch = module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         module.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = stageFilter === "all" || module.learningStage === stageFilter;
    const matchesStatus = statusFilter === "all" || module.status === statusFilter;
    
    return matchesSearch && matchesStage && matchesStatus;
  });

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-neutral-dark">Training Modules</h3>
            <p className="text-neutral-medium">Manage and organize your training content</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-neutral-dark">Training Modules</h3>
          <p className="text-neutral-medium">Manage and organize your training content</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-dark text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Module
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New Training Module</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateModule)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Module Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter module title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what this module covers..."
                          className="resize-none"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="learningStage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Learning Stage</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select learning stage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="onboarding">Onboarding - New employee orientation</SelectItem>
                          <SelectItem value="foundational">Foundational - Basic skills and knowledge</SelectItem>
                          <SelectItem value="intermediate">Intermediate - Building on fundamentals</SelectItem>
                          <SelectItem value="advanced">Advanced - Expert-level content</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft - Work in progress</SelectItem>
                          <SelectItem value="published">Published - Ready for learners</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-primary-dark"
                    disabled={createModuleMutation.isPending}
                  >
                    {createModuleMutation.isPending ? "Creating..." : "Create Module"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Module Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Edit Training Module</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleUpdateModule)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Module Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter module title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe what this module covers..."
                          className="resize-none"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="learningStage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Learning Stage</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select learning stage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="onboarding">Onboarding - New employee orientation</SelectItem>
                          <SelectItem value="foundational">Foundational - Basic skills and knowledge</SelectItem>
                          <SelectItem value="intermediate">Intermediate - Building on fundamentals</SelectItem>
                          <SelectItem value="advanced">Advanced - Expert-level content</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft - Work in progress</SelectItem>
                          <SelectItem value="published">Published - Ready for learners</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedModule?.document?.keyTopics && (
                  <div>
                    <label className="text-sm font-medium text-neutral-dark">Key Topics</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedModule.document.keyTopics.map((topic, index) => (
                        <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-primary-dark"
                    disabled={updateModuleMutation.isPending}
                  >
                    {updateModuleMutation.isPending ? "Updating..." : "Update Module"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* View Module Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[725px]">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>{selectedModule?.title}</span>
              </DialogTitle>
            </DialogHeader>
            {selectedModule && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-neutral-dark mb-2">Learning Stage</h4>
                    <Badge className={getStageColor(selectedModule.learningStage)}>
                      {selectedModule.learningStage}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium text-neutral-dark mb-2">Status</h4>
                    <Badge className={getStatusColor(selectedModule.status)}>
                      {selectedModule.status}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-neutral-dark mb-2">Description</h4>
                  <p className="text-neutral-medium">
                    {selectedModule.description || "No description available"}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-neutral-dark mb-2">Key Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedModule.document?.keyTopics && selectedModule.document.keyTopics.length > 0 ? (
                      selectedModule.document.keyTopics.map((topic, index) => (
                        <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {topic}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-neutral-medium text-sm">No key topics available</span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-medium">Created:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedModule.createdAt!).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-medium">AI Generated:</span>
                    <span className="ml-2 font-medium">
                      {selectedModule.aiGenerated ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleEditModule(selectedModule);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Module
                  </Button>
                  <Button 
                    onClick={() => setIsViewDialogOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-medium" />
              </div>
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="foundational">Foundational</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules?.map((module) => (
          <Card key={module.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-neutral-dark mb-2">{module.title}</h4>
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={getStageColor(module.learningStage)}>
                      {module.learningStage}
                    </Badge>
                    <Badge className={getStatusColor(module.status)}>
                      {module.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-neutral-medium mb-4 line-clamp-3">
                    {module.description || "No description available"}
                  </p>
                </div>
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleViewModule(module)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditModule(module)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteModule(module)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-medium">Created</span>
                  <span className="font-medium text-neutral-dark">
                    {new Date(module.createdAt!).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-medium">AI Generated</span>
                  <span className="font-medium text-neutral-dark">
                    {module.aiGenerated ? "Yes" : "No"}
                  </span>
                </div>
              </div>


            </CardContent>
          </Card>
        ))}
      </div>

      {filteredModules?.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-neutral-medium">No training modules found.</p>
            <Button 
              className="mt-4 bg-primary hover:bg-primary-dark"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Module
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
