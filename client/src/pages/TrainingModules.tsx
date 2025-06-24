import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Eye, Edit, MoreVertical, BookOpen } from "lucide-react";
import type { TrainingModule, Document } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const moduleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  learningStage: z.enum(["onboarding", "foundational", "intermediate", "advanced"]),
  documentId: z.number().optional(),
});

function CreateModuleDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof moduleSchema>>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      title: "",
      description: "",
      learningStage: "foundational",
    },
  });

  const { data: documents } = useQuery({
    queryKey: ["/api/documents"],
  });

  const createModuleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof moduleSchema>) => {
      return await apiRequest("/api/modules", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modules"] });
      toast({ title: "Success", description: "Training module created successfully!" });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create module",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof moduleSchema>) => {
    createModuleMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary-dark">
          <Plus className="h-4 w-4 mr-2" />
          Create Module
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Training Module</DialogTitle>
          <DialogDescription>
            Create a new training module from uploaded content or start from scratch.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter module title..." {...field} />
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
                    <Textarea placeholder="Enter module description..." {...field} />
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
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="foundational">Foundational</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="documentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Document (Optional)</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select document (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {documents?.map((doc: Document) => (
                        <SelectItem key={doc.id} value={doc.id.toString()}>
                          {doc.originalName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={createModuleMutation.isPending}>
                {createModuleMutation.isPending ? "Creating..." : "Create Module"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function TrainingModules() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: modules, isLoading } = useQuery<TrainingModule[]>({
    queryKey: ["/api/modules"],
  });

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
        {(user?.role === "admin" || user?.role === "trainer") && <CreateModuleDialog />}
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
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
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

              <div className="flex space-x-2">
                <Button className="flex-1 bg-primary hover:bg-primary-dark text-white" size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" className="flex-1" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredModules?.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-neutral-light rounded-full flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-neutral-medium" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-dark mb-2">No training modules found</h3>
            <p className="text-neutral-medium mb-6">
              {user?.role === "employee" 
                ? "No modules have been assigned to you yet. Contact your trainer or admin for module assignments." 
                : "Get started by creating your first training module or adjusting your search filters."
              }
            </p>
            {(user?.role === "admin" || user?.role === "trainer") && <CreateModuleDialog />}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
