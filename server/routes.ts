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

  // File upload and processing (only analyzes, doesn't save to database)
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

      // Generate quiz questions for preview
      const quizQuestions = await generateQuizQuestions(content, analysis.keyTopics);

      res.json({
        analysis,
        quizQuestions,
        content: content.substring(0, 1000) + (content.length > 1000 ? "..." : ""),
        fileInfo: {
          fileName: req.file.filename,
          originalName: req.file.originalname,
          fileType,
          filePath: req.file.path,
          fileSize: req.file.size,
          uploadedBy: userId,
        }
      });
    } catch (error) {
      console.error("Error processing file upload:", error);
      res.status(500).json({ message: "Failed to process uploaded file" });
    }
  });

  // Create training module from uploaded content
  app.post('/api/create-training-module', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { moduleData, fileInfo, quizQuestions } = req.body;

      // Save document to database
      const documentData = insertDocumentSchema.parse({
        ...fileInfo,
        aiSummary: moduleData.description,
        keyTopics: moduleData.keyTopics,
      });

      const document = await storage.createDocument(documentData);

      // Create training module
      const trainingModuleData = insertTrainingModuleSchema.parse({
        title: moduleData.title,
        description: moduleData.description,
        learningStage: moduleData.learningStage,
        status: "draft",
        documentId: document.id,
        createdBy: userId,
        aiGenerated: true,
      });

      const trainingModule = await storage.createTrainingModule(trainingModuleData);

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
        trainingModule,
        quizQuestions: quizQuestions.length,
      });
    } catch (error) {
      console.error("Error creating training module:", error);
      res.status(500).json({ message: "Failed to create training module" });
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

  // Get quiz questions for a specific module
  app.get('/api/quiz-questions/:moduleId', isAuthenticated, async (req: any, res) => {
    try {
      const moduleId = parseInt(req.params.moduleId);
      const questions = await storage.getQuizQuestionsByModule(moduleId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(500).json({ message: "Failed to fetch quiz questions" });
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
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users/invite', isAuthenticated, async (req, res) => {
    try {
      const { email, firstName, lastName, role } = req.body;
      
      const newUser = await storage.createUser({
        email,
        firstName,
        lastName,
        role,
        password: 'TempPass123!'
      });
      
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch('/api/users/:id', isAuthenticated, async (req, res) => {
    try {
      const id = req.params.id;
      const updates = req.body;
      const updatedUser = await storage.updateUser(id, updates);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.post('/api/users/:userId/assign-module', isAuthenticated, async (req, res) => {
    try {
      const userId = req.params.userId;
      const { moduleId } = req.body;
      
      const assignment = await storage.assignModuleToUser({
        userId,
        moduleId: parseInt(moduleId),
        assignedBy: userId
      });
      
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error assigning module:", error);
      res.status(500).json({ message: "Failed to assign module" });
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

  // Chatbot routes (supporting both /api/chat and /api/chatbot)
  const handleChatRequest = async (req: any, res: any) => {
    try {
      const { message } = req.body;
      const userId = req.user.claims.sub;
      
      if (!message || !message.trim()) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      // Get user's recent chat history for context
      const chatHistory = await storage.getUserChatHistory(userId, 10);
      
      // Get chatbot response with enhanced context and database access
      const response = await getChatbotResponse(message, chatHistory, userId, storage);
      
      // Save the conversation (user message and bot response together)
      const chatData = insertChatMessageSchema.parse({
        userId,
        message: message.trim(),
        response,
        role: 'user'
      });
      
      await storage.createChatMessage(chatData);
      
      res.json({ response });
    } catch (error) {
      console.error("Error processing chatbot request:", error);
      res.status(500).json({ message: "Failed to process chatbot request", error: (error as Error).message });
    }
  };

  app.post('/api/chat', isAuthenticated, handleChatRequest);
  app.post('/api/chatbot', isAuthenticated, handleChatRequest);

  // Chat history route
  app.get('/api/chat/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const history = await storage.getUserChatHistory(userId, 50);
      res.json(history);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  // Clear chat history route (called on page refresh)
  app.delete('/api/chat/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.clearUserChatHistory(userId);
      res.json({ message: "Chat history cleared" });
    } catch (error) {
      console.error("Error clearing chat history:", error);
      res.status(500).json({ message: "Failed to clear chat history" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/user-progress', isAuthenticated, async (req, res) => {
    try {
      const progress = await storage.getUserProgress();
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Failed to fetch user progress" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
