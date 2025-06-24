export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: "admin" | "trainer" | "employee";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TrainingModule {
  id: number;
  title: string;
  description?: string;
  learningStage: "onboarding" | "foundational" | "intermediate" | "advanced";
  status: "draft" | "published" | "archived";
  documentId?: number;
  createdBy: string;
  aiGenerated?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Document {
  id: number;
  fileName: string;
  originalName: string;
  fileType: "pdf" | "docx" | "video";
  filePath: string;
  fileSize: number;
  uploadedBy: string;
  aiSummary?: string;
  keyTopics?: string[];
  createdAt?: Date;
}

export interface QuizQuestion {
  id: number;
  moduleId: number;
  questionText: string;
  questionType: "multiple_choice" | "true_false";
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  order: number;
  createdAt?: Date;
}

export interface QuizResult {
  id: number;
  userId: string;
  moduleId: number;
  score: number;
  totalQuestions: number;
  answers?: Record<string, string>;
  completedAt?: Date;
}

export interface UserModuleAssignment {
  id: number;
  userId: string;
  moduleId: number;
  assignedBy: string;
  assignedAt?: Date;
  completedAt?: Date;
  isCompleted?: boolean;
}

export interface ChatMessage {
  id: number;
  userId: string;
  message: string;
  response: string;
  createdAt?: Date;
}

export interface DashboardStats {
  totalModules: number;
  activeUsers: number;
  completedQuizzes: number;
  averageScore: number;
}

export interface UploadResponse {
  document: Document;
  analysis: {
    summary: string;
    keyTopics: string[];
    learningStage: "onboarding" | "foundational" | "intermediate" | "advanced";
    suggestedTitle: string;
  };
  trainingModule: TrainingModule;
  quizQuestions: number;
  content: string;
}

export interface ChatResponse {
  response: string;
}

export interface QuizSuggestions {
  shouldReview: boolean;
  suggestedModules: number[];
}
