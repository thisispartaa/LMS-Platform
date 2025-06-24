import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { upload, getFileType, processUploadedFile } from "./services/fileProcessor";
import { generateQuizQuestions, getChatbotResponse, suggestReviewModules } from "./services/openai";
import { 
  insertDocumentSchema,
  insertTrainingModuleSchema,
  insertQuizQuestionSchema,
  insertUserModuleAssignmentSchema,
  insertQuizResultSchema,
  insertChatMessageSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // File upload and processing
  app.post('/api/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.claims.sub;
      const fileType = getFileType(req.file.mimetype);
      
      // Process the uploaded file
      const { content, analysis } = await processUploadedFile(
        req.file.path,
        req.file.originalname,
        fileType
      );

      // Save document to database
      const documentData = insertDocumentSchema.parse({
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileType,
        filePath: req.file.path,
        fileSize: req.file.size,
        uploadedBy: userId,
        aiSummary: analysis.summary,
        keyTopics: analysis.keyTopics,
      });

      const document = await storage.createDocument(documentData);

      // Create training module based on the analysis
      const moduleData = insertTrainingModuleSchema.parse({
        title: analysis.suggestedTitle,
        description: analysis.summary,
        learningStage: analysis.learningStage,
        status: "draft",
        documentId: document.id,
        createdBy: userId,
        aiGenerated: true,
      });

      const trainingModule = await storage.createTrainingModule(moduleData);

      // Generate quiz questions for the module
      const quizQuestions = await generateQuizQuestions(content, analysis.keyTopics);
      
      // Save quiz questions to database
      for (let i = 0; i < quizQuestions.length; i++) {
        const questionData = insertQuizQuestionSchema.parse({
          moduleId: trainingModule.id,
          questionText: quizQuestions[i].questionText,
          questionType: quizQuestions[i].questionType,
          options: quizQuestions[i].options || [],
          correctAnswer: quizQuestions[i].correctAnswer,
          explanation: quizQuestions[i].explanation,
          order: i + 1,
        });
        
        await storage.createQuizQuestion(questionData);
      }

      res.json({
        document,
        analysis,
        trainingModule,
        quizQuestions: quizQuestions.length,
        content: content.substring(0, 1000) + (content.length > 1000 ? "..." : ""), // Truncate for response
      });
    } catch (error) {
      console.error("Error processing file upload:", error);
      res.status(500).json({ message: "Failed to process uploaded file" });
    }
  });

  // Training Modules routes
  app.get('/api/training-modules', isAuthenticated, async (req, res) => {
    try {
      const modules = await storage.getTrainingModules();
      res.json(modules);
    } catch (error) {
      console.error("Error fetching training modules:", error);
      res.status(500).json({ message: "Failed to fetch training modules" });
    }
  });

  app.get('/api/training-modules/:id', isAuthenticated, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const module = await storage.getTrainingModule(moduleId);
      if (!module) {
        return res.status(404).json({ message: "Training module not found" });
      }
      res.json(module);
    } catch (error) {
      console.error("Error fetching training module:", error);
      res.status(500).json({ message: "Failed to fetch training module" });
    }
  });

  app.post('/api/training-modules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const moduleData = insertTrainingModuleSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      
      const module = await storage.createTrainingModule(moduleData);
      res.json(module);
    } catch (error) {
      console.error("Error creating training module:", error);
      res.status(500).json({ message: "Failed to create training module" });
    }
  });

  app.put('/api/training-modules/:id', isAuthenticated, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const updates = req.body;
      
      const module = await storage.updateTrainingModule(moduleId, updates);
      res.json(module);
    } catch (error) {
      console.error("Error updating training module:", error);
      res.status(500).json({ message: "Failed to update training module" });
    }
  });

  app.delete('/api/training-modules/:id', isAuthenticated, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      await storage.deleteTrainingModule(moduleId);
      res.json({ message: "Training module deleted successfully" });
    } catch (error) {
      console.error("Error deleting training module:", error);
      res.status(500).json({ message: "Failed to delete training module" });
    }
  });

  // Quiz routes
  app.get('/api/training-modules/:id/questions', isAuthenticated, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const questions = await storage.getQuizQuestionsByModule(moduleId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(500).json({ message: "Failed to fetch quiz questions" });
    }
  });

  app.post('/api/quiz-questions', isAuthenticated, async (req, res) => {
    try {
      const questionData = insertQuizQuestionSchema.parse(req.body);
      const question = await storage.createQuizQuestion(questionData);
      res.json(question);
    } catch (error) {
      console.error("Error creating quiz question:", error);
      res.status(500).json({ message: "Failed to create quiz question" });
    }
  });

  app.put('/api/quiz-questions/:id', isAuthenticated, async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const updates = req.body;
      
      const question = await storage.updateQuizQuestion(questionId, updates);
      res.json(question);
    } catch (error) {
      console.error("Error updating quiz question:", error);
      res.status(500).json({ message: "Failed to update quiz question" });
    }
  });

  app.delete('/api/quiz-questions/:id', isAuthenticated, async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      await storage.deleteQuizQuestion(questionId);
      res.json({ message: "Quiz question deleted successfully" });
    } catch (error) {
      console.error("Error deleting quiz question:", error);
      res.status(500).json({ message: "Failed to delete quiz question" });
    }
  });

  // User Management routes
  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const { role } = req.query;
      const users = role 
        ? await storage.getUsersByRole(role as string)
        : await storage.getUsersByRole("employee"); // Default to employees
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Assignment routes
  app.post('/api/assignments', isAuthenticated, async (req: any, res) => {
    try {
      const assignerId = req.user.claims.sub;
      const assignmentData = insertUserModuleAssignmentSchema.parse({
        ...req.body,
        assignedBy: assignerId,
      });
      
      const assignment = await storage.assignModuleToUser(assignmentData);
      res.json(assignment);
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  app.get('/api/users/:userId/assignments', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const assignments = await storage.getUserAssignments(userId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching user assignments:", error);
      res.status(500).json({ message: "Failed to fetch user assignments" });
    }
  });

  // Chatbot route
  app.post('/api/chatbot', isAuthenticated, async (req: any, res) => {
    try {
      const { message } = req.body;
      const userId = req.user.claims.sub;
      
      // Get user's recent chat history for context
      const chatHistory = await storage.getUserChatHistory(userId, 5);
      
      // Get chatbot response
      const response = await getChatbotResponse(message, chatHistory);
      
      // Save the conversation
      const chatData = insertChatMessageSchema.parse({
        userId,
        message,
        response,
      });
      
      await storage.createChatMessage(chatData);
      
      res.json({ response });
    } catch (error) {
      console.error("Error processing chatbot request:", error);
      res.status(500).json({ message: "Failed to process chatbot request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
