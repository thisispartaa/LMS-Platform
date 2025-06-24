import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Upload, 
  FileText, 
  VideoIcon, 
  Link,
  Loader2,
  CheckCircle,
  X,
  Plus,
  Wand2
} from "lucide-react";
interface ProcessingFile {
  name: string;
  progress: number;
  status: "uploading" | "processing" | "completed" | "error";
}

interface UploadAnalysisResult {
  analysis: {
    summary: string;
    keyTopics: string[];
    learningStage: "onboarding" | "foundational" | "intermediate" | "advanced";
    suggestedTitle: string;
  };
  quizQuestions: any[];
  content: string;
  fileInfo: any;
}

export default function UploadContent() {
  const [dragActive, setDragActive] = useState(false);
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  const [uploadResult, setUploadResult] = useState<UploadAnalysisResult | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [learningStage, setLearningStage] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [keyTopics, setKeyTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [isCreatingModule, setIsCreatingModule] = useState(false);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed");
      }
      
      return response.json() as Promise<UploadAnalysisResult>;
    },
    onSuccess: (data) => {
      setUploadResult(data);
      setModuleTitle(data.analysis.suggestedTitle);
      setLearningStage(data.analysis.learningStage);
      setAiSummary(data.analysis.summary);
      setKeyTopics(data.analysis.keyTopics);
      
      // Update processing file status
      setProcessingFiles(prev => 
        prev.map(f => ({ ...f, status: "completed", progress: 100 }))
      );
      
      toast({
        title: "File analyzed successfully",
        description: `AI analysis completed. ${data.quizQuestions.length} quiz questions generated. Review and save as draft.`,
      });
    },
    onError: (error) => {
      console.error("Upload error:", error);
      setProcessingFiles(prev => 
        prev.map(f => ({ ...f, status: "error", progress: 0 }))
      );
      toast({
        title: "Upload failed",
        description: "There was an error processing your file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const file = files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "video/mp4",
      "video/avi",
      "video/quicktime",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload PDF, DOCX, or video files only.",
        variant: "destructive",
      });
      return;
    }

    // Add to processing files
    const processingFile: ProcessingFile = {
      name: file.name,
      progress: 0,
      status: "uploading",
    };
    setProcessingFiles([processingFile]);

    // Start upload
    uploadMutation.mutate(file);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="h-6 w-6 text-red-500" />;
    if (ext === 'docx' || ext === 'doc') return <FileText className="h-6 w-6 text-blue-500" />;
    if (ext === 'mp4' || ext === 'avi' || ext === 'mov') return <VideoIcon className="h-6 w-6 text-purple-500" />;
    return <FileText className="h-6 w-6 text-gray-500" />;
  };

  const removeTopic = (index: number) => {
    setKeyTopics(topics => topics.filter((_, i) => i !== index));
  };

  const addTopic = () => {
    if (newTopic.trim() && !keyTopics.includes(newTopic.trim())) {
      setKeyTopics(topics => [...topics, newTopic.trim()]);
      setNewTopic("");
    }
  };

  // Removed redundant quiz generation mutation

  return (
    <div className="max-w-4xl space-y-6">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-8">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive 
                ? "border-primary bg-primary/5" 
                : "border-gray-300 hover:border-primary"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h4 className="text-lg font-semibold text-neutral-dark mb-2">Upload Files</h4>
            <p className="text-neutral-medium mb-4">Drag and drop files here, or click to browse</p>
            <p className="text-sm text-neutral-medium mb-6">Supported formats: PDF, DOCX, MP4, AVI (Max 100MB)</p>
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => document.getElementById('file-input')?.click()}
                className="bg-primary hover:bg-primary-dark"
                disabled={uploadMutation.isPending}
              >
                <Upload className="h-4 w-4 mr-2" />
                Browse Files
              </Button>
              <Button variant="outline">
                <Link className="h-4 w-4 mr-2" />
                SharePoint
              </Button>
            </div>
            <input
              id="file-input"
              type="file"
              className="hidden"
              accept=".pdf,.docx,.doc,.mp4,.avi,.mov"
              onChange={handleFileInput}
            />
          </div>
        </CardContent>
      </Card>

      {/* Processing Status */}
      {processingFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processingFiles.map((file, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    {getFileIcon(file.name)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-neutral-dark">{file.name}</p>
                    <div className="flex items-center mt-2">
                      <Progress value={file.progress} className="flex-1 mr-4" />
                      <span className="text-sm text-neutral-medium">
                        {file.status === "completed" ? "100%" : `${file.progress}%`}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-medium mt-1">
                      {file.status === "uploading" && "Uploading..."}
                      {file.status === "processing" && "Generating summary and key topics..."}
                      {file.status === "completed" && "Processing completed"}
                      {file.status === "error" && "Processing failed"}
                    </p>
                  </div>
                  <div className="text-primary">
                    {file.status === "completed" ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : file.status === "error" ? (
                      <X className="h-5 w-5 text-error" />
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Processing Results */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle>AI Processing Results</CardTitle>
            <p className="text-neutral-medium">Review and edit the AI-generated content before creating the module</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Module Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-2">Module Title</label>
                  <Input
                    value={moduleTitle}
                    onChange={(e) => setModuleTitle(e.target.value)}
                    placeholder="Enter module title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-2">Learning Stage</label>
                  <Select value={learningStage} onValueChange={setLearningStage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select learning stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="foundational">Foundational</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-2">AI-Generated Summary</label>
                  <Textarea
                    rows={6}
                    value={aiSummary}
                    onChange={(e) => setAiSummary(e.target.value)}
                    placeholder="Module summary will appear here"
                  />
                </div>
              </div>

              {/* Key Topics */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-2">Key Topics Identified</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {keyTopics.map((topic, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-neutral-dark">{topic}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTopic(index)}
                          className="text-error hover:text-red-600 h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <Input
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      placeholder="Add new topic"
                      onKeyDown={(e) => e.key === "Enter" && addTopic()}
                      className="flex-1"
                    />
                    <Button onClick={addTopic} size="sm" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-dark mb-2">Generated Quiz Questions</label>
                  <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
                    <Wand2 className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-dark">
                        {uploadResult?.quizQuestions?.length || 0} quiz questions generated
                      </p>
                      <p className="text-xs text-neutral-medium">
                        Questions will be included when you save the module
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <Button 
                variant="outline"
                onClick={() => {
                  setIsCreatingModule(true);
                  createModuleMutation.mutate();
                }}
                disabled={createModuleMutation.isPending || !moduleTitle || !aiSummary}
              >
                {createModuleMutation.isPending ? "Saving..." : "Save as Draft"}
              </Button>
              <Button 
                className="bg-primary hover:bg-primary-dark"
                onClick={() => {
                  setIsCreatingModule(true);
                  createModuleMutation.mutate();
                }}
                disabled={createModuleMutation.isPending || !moduleTitle || !aiSummary}
              >
                {createModuleMutation.isPending ? "Creating..." : "Create Module"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
