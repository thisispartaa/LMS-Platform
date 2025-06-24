import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  AlertCircle
} from "lucide-react";
import type { UploadResponse } from "@/types";

interface ProcessingFile {
  name: string;
  progress: number;
  status: "uploading" | "processing" | "completed" | "error";
  error?: string;
}

interface FileUploaderProps {
  onUploadComplete: (result: UploadResponse) => void;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
}

export default function FileUploader({ 
  onUploadComplete, 
  maxFileSize = 100,
  allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "video/mp4",
    "video/avi",
    "video/quicktime",
  ]
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await apiRequest("POST", "/api/upload", formData);
      return response.json() as Promise<UploadResponse>;
    },
    onSuccess: (data) => {
      setProcessingFiles(prev => 
        prev.map(f => ({ ...f, status: "completed", progress: 100 }))
      );
      
      toast({
        title: "File processed successfully",
        description: "AI analysis completed. Review the results below.",
      });
      
      onUploadComplete(data);
      
      // Clear processing files after a delay
      setTimeout(() => {
        setProcessingFiles([]);
      }, 3000);
    },
    onError: (error) => {
      const errorMessage = error.message || "Failed to process file";
      
      setProcessingFiles(prev => 
        prev.map(f => ({ 
          ...f, 
          status: "error", 
          progress: 0,
          error: errorMessage
        }))
      );
      
      toast({
        title: "Upload failed",
        description: errorMessage,
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

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return "Unsupported file type. Please upload PDF, DOCX, or video files only.";
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return `File size too large. Maximum size is ${maxFileSize}MB.`;
    }

    return null;
  };

  const handleFiles = (files: FileList) => {
    const file = files[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: "Invalid file",
        description: validationError,
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

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setProcessingFiles(prev => 
        prev.map(f => f.name === file.name ? {
          ...f,
          progress: Math.min(f.progress + Math.random() * 20, 90)
        } : f)
      );
    }, 500);

    // Start upload
    uploadMutation.mutate(file);

    // Update status after initial upload
    setTimeout(() => {
      clearInterval(progressInterval);
      setProcessingFiles(prev => 
        prev.map(f => f.name === file.name ? {
          ...f,
          status: "processing",
          progress: 95
        } : f)
      );
    }, 2000);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="h-6 w-6 text-red-500" />;
    if (ext === 'docx' || ext === 'doc') return <FileText className="h-6 w-6 text-blue-500" />;
    if (ext === 'mp4' || ext === 'avi' || ext === 'mov') return <VideoIcon className="h-6 w-6 text-purple-500" />;
    return <FileText className="h-6 w-6 text-gray-500" />;
  };

  const getStatusIcon = (status: ProcessingFile['status']) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-error" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    }
  };

  const removeProcessingFile = (fileName: string) => {
    setProcessingFiles(prev => prev.filter(f => f.name !== fileName));
  };

  return (
    <div className="space-y-6">
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
            <p className="text-sm text-neutral-medium mb-6">
              Supported formats: PDF, DOCX, MP4, AVI (Max {maxFileSize}MB)
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => document.getElementById('file-input')?.click()}
                className="bg-primary hover:bg-primary-dark"
                disabled={uploadMutation.isPending}
              >
                <Upload className="h-4 w-4 mr-2" />
                Browse Files
              </Button>
              <Button variant="outline" disabled>
                <Link className="h-4 w-4 mr-2" />
                SharePoint
              </Button>
            </div>
            <input
              id="file-input"
              type="file"
              className="hidden"
              accept={allowedTypes.join(",")}
              onChange={handleFileInput}
            />
          </div>
        </CardContent>
      </Card>

      {/* Processing Status */}
      {processingFiles.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h4 className="text-lg font-semibold text-neutral-dark mb-4">Processing Files</h4>
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
                      <span className="text-sm text-neutral-medium min-w-12">
                        {file.status === "completed" ? "100%" : `${Math.round(file.progress)}%`}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-medium mt-1">
                      {file.status === "uploading" && "Uploading..."}
                      {file.status === "processing" && "Generating summary and key topics..."}
                      {file.status === "completed" && "Processing completed"}
                      {file.status === "error" && (file.error || "Processing failed")}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(file.status)}
                    {(file.status === "completed" || file.status === "error") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProcessingFile(file.name)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
