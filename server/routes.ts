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

      res.json({
        document,
        analysis,
        content: content.substring(0, 1000) + (content.length > 1000 ? "..." : ""), // Truncate for response
      });
    } catch (error) {
      console.error("Error processing file upload:", error);
      res.status(500).json({ message: "Failed to process file upload" });
    }
  });

  // Training modules
  app.get('/api/modules', isAuthenticated, async (req, res) => {
    try {
      const modules = await storage.getTrainingModules();
      res.json(modules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });

  app.post('/api/modules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const moduleData = insertTrainingModuleSchema.parse({
        ...req.body,
        createdBy: userId,
      });

      const module = await storage.createTrainingModule(moduleData);
      res.json(module);
    } catch (error) {
      console.error("Error creating module:", error);
      res.status(500).json({ message: "Failed to create module" });
    }
  });

  app.get('/api/modules/:id', isAuthenticated, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const module = await storage.getTrainingModule(moduleId);
      
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }

      res.json(module);
    } catch (error) {
      console.error("Error fetching module:", error);
      res.status(500).json({ message: "Failed to fetch module" });
    }
  });

  app.put('/api/modules/:id', isAuthenticated, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const updates = req.body;
      
      const module = await storage.updateTrainingModule(moduleId, updates);
      res.json(module);
    } catch (error) {
      console.error("Error updating module:", error);
      res.status(500).json({ message: "Failed to update module" });
    }
  });

  app.delete('/api/modules/:id', isAuthenticated, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      await storage.deleteTrainingModule(moduleId);
      res.json({ message: "Module deleted successfully" });
    } catch (error) {
      console.error("Error deleting module:", error);
      res.status(500).json({ message: "Failed to delete module" });
    }
  });

  // Quiz questions
  app.get('/api/modules/:id/questions', isAuthenticated, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const questions = await storage.getQuizQuestionsByModule(moduleId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(500).json({ message: "Failed to fetch quiz questions" });
    }
  });

  app.post('/api/modules/:id/generate-quiz', isAuthenticated, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const module = await storage.getTrainingModule(moduleId);
      
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }

      // Get document content for quiz generation
      let content = "";
      let keyTopics: string[] = [];
      
      if (module.documentId) {
        const document = await storage.getDocument(module.documentId);
        if (document) {
          content = document.aiSummary || "";
          keyTopics = document.keyTopics || [];
        }
      }

      if (!content) {
        content = module.description || "";
        keyTopics = [module.title];
      }

      // Generate quiz questions using AI
      const generatedQuestions = await generateQuizQuestions(content, keyTopics);
      
      // Save questions to database
      const savedQuestions = [];
      for (let i = 0; i < generatedQuestions.length; i++) {
        const questionData = insertQuizQuestionSchema.parse({
          moduleId,
          questionText: generatedQuestions[i].questionText,
          questionType: generatedQuestions[i].questionType,
          options: generatedQuestions[i].options,
          correctAnswer: generatedQuestions[i].correctAnswer,
          explanation: generatedQuestions[i].explanation,
          order: i + 1,
        });
        
        const question = await storage.createQuizQuestion(questionData);
        savedQuestions.push(question);
      }

      res.json(savedQuestions);
    } catch (error) {
      console.error("Error generating quiz:", error);
      res.status(500).json({ message: "Failed to generate quiz" });
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

  // User assignments
  app.get('/api/users/:userId/assignments', isAuthenticated, async (req, res) => {
    try {
      const userId = req.params.userId;
      const assignments = await storage.getUserAssignments(userId);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching user assignments:", error);
      res.status(500).json({ message: "Failed to fetch user assignments" });
    }
  });

  app.post('/api/assignments', isAuthenticated, async (req: any, res) => {
    try {
      const assignedBy = req.user.claims.sub;
      const assignmentData = insertUserModuleAssignmentSchema.parse({
        ...req.body,
        assignedBy,
      });

      const assignment = await storage.assignModuleToUser(assignmentData);
      res.json(assignment);
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  app.put('/api/assignments/:userId/:moduleId/complete', isAuthenticated, async (req, res) => {
    try {
      const userId = req.params.userId;
      const moduleId = parseInt(req.params.moduleId);
      
      await storage.completeAssignment(userId, moduleId);
      res.json({ message: "Assignment completed successfully" });
    } catch (error) {
      console.error("Error completing assignment:", error);
      res.status(500).json({ message: "Failed to complete assignment" });
    }
  });

  // Quiz results
  app.post('/api/quiz-results', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const resultData = insertQuizResultSchema.parse({
        ...req.body,
        userId,
      });

      const result = await storage.createQuizResult(resultData);
      
      // Check if user needs review modules based on score
      const modules = await storage.getTrainingModules();
      const suggestions = await suggestReviewModules(
        result.score,
        result.totalQuestions,
        "Current Module", // You might want to get the actual module title
        modules.map(m => ({ id: m.id, title: m.title, learningStage: m.learningStage }))
      );

      res.json({ result, suggestions });
    } catch (error) {
      console.error("Error saving quiz result:", error);
      res.status(500).json({ message: "Failed to save quiz result" });
    }
  });

  app.get('/api/users/:userId/quiz-results', isAuthenticated, async (req, res) => {
    try {
      const userId = req.params.userId;
      const results = await storage.getUserQuizResults(userId);
      res.json(results);
    } catch (error) {
      console.error("Error fetching quiz results:", error);
      res.status(500).json({ message: "Failed to fetch quiz results" });
    }
  });

  // User management
  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const { role } = req.query;
      let users;
      
      if (role) {
        users = await storage.getUsersByRole(role as string);
      } else {
        // Get all users - you might want to add pagination here
        users = await storage.getUsersByRole("admin");
        const trainers = await storage.getUsersByRole("trainer");
        const employees = await storage.getUsersByRole("employee");
        users = [...users, ...trainers, ...employees];
      }
      
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Chatbot
  app.post('/api/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Get chat history
      const chatHistory = await storage.getUserChatHistory(userId, 5);
      
      // Get available modules for context
      const modules = await storage.getTrainingModules();
      const moduleContext = modules.map(m => ({
        title: m.title,
        description: m.description || "",
        learningStage: m.learningStage,
      }));

      // Generate AI response
      const response = await getChatbotResponse(
        message,
        chatHistory.map(h => ({ message: h.message, response: h.response })),
        moduleContext
      );

      // Save chat message
      const chatData = insertChatMessageSchema.parse({
        userId,
        message,
        response,
      });

      await storage.createChatMessage(chatData);

      res.json({ response });
    } catch (error) {
      console.error("Error processing chat message:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  app.get('/api/chat/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const history = await storage.getUserChatHistory(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
