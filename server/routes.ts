import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import passport from "passport";
import session from "express-session";
import { storage } from "./storage";
import { setupLocalAuth, isAuthenticated } from "./auth";
import { upload, getFileType, processUploadedFile } from "./services/fileProcessor";
import { generateQuizQuestions, getChatbotResponse, suggestReviewModules } from "./services/openai";
import { 
  insertDocumentSchema,
  insertTrainingModuleSchema,
  insertQuizQuestionSchema,
  insertUserModuleAssignmentSchema,
  insertQuizResultSchema,
  insertChatMessageSchema,
  userModuleAssignments,
  trainingModules,
  documents
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import { getUserId, getUserIdSafe } from "./utils/auth";
import { validateBody, userInvitationSchema } from "./utils/validation";
import { z } from "zod";
import "./types"; // Import type definitions

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  }));

  // Setup passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup local authentication
  setupLocalAuth();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // For local auth, req.user should already be the database user
      if (req.user && req.user.email && !req.user.claims && !req.user.expires_at) {
        return res.json(req.user);
      }

      // For Replit auth, we need to look up the user in the database
      const userId = getUserIdSafe(req);
      
      if (userId) {
        const user = await storage.getUser(userId);
        if (user) {
          // Remove password from response
          const { password: _, ...userWithoutPassword } = user;
          return res.json(userWithoutPassword);
        }
      }

      // Fallback to req.user if no database user found
      res.json(req.user);
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

      const userId = getUserId(req);
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
      const userId = getUserId(req);
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
      const userId = getUserId(req);
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

  // Get quiz results for a specific user and module
  app.get('/api/user/quiz-result/:moduleId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const moduleId = parseInt(req.params.moduleId);
      
      const results = await storage.getUserQuizResults(userId);
      const moduleResult = results.find(result => result.moduleId === moduleId);
      
      if (!moduleResult) {
        return res.status(404).json({ message: "Quiz result not found" });
      }
      
      res.json(moduleResult);
    } catch (error) {
      console.error("Error fetching quiz result:", error);
      res.status(500).json({ message: "Failed to fetch quiz result" });
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
      // Get the count of existing questions for this module to set order
      const existingQuestions = await storage.getQuizQuestionsByModule(req.body.moduleId);
      const nextOrder = existingQuestions.length + 1;
      
      const questionData = insertQuizQuestionSchema.parse({
        ...req.body,
        order: nextOrder
      });
      
      const question = await storage.createQuizQuestion(questionData);
      res.json(question);
    } catch (error) {
      console.error("Error creating quiz question:", error);
      res.status(500).json({ message: "Failed to create quiz question", error: error instanceof Error ? error.message : 'Unknown error' });
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
      
      // Generate unique ID and default password
      const uniqueId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      const defaultPassword = `temp${Math.random().toString(36).substring(7)}`;
      
      const newUser = await storage.createUser({
        id: uniqueId,
        email,
        firstName,
        lastName,
        role,
        password: defaultPassword
      });

      res.status(201).json({ 
        ...newUser, 
        defaultPassword,
        message: `User invited successfully. Default password: ${defaultPassword}`
      });
    } catch (error) {
      console.error('Error inviting user:', error);
      res.status(500).json({ message: 'Failed to invite user' });
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
      const assignerId = getUserId(req);
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

  // Employee Dashboard API endpoints
  app.get('/api/user/assigned-modules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Get user assignments with full module and document details
      const assignments = await db
        .select({
          id: userModuleAssignments.id,
          moduleId: userModuleAssignments.moduleId,
          assignedAt: userModuleAssignments.assignedAt,
          completedAt: userModuleAssignments.completedAt,
          isCompleted: userModuleAssignments.isCompleted,
          moduleTitle: trainingModules.title,
          moduleDescription: trainingModules.description,
          learningStage: trainingModules.learningStage,
          documentId: trainingModules.documentId,
          aiSummary: documents.aiSummary,
          keyTopics: documents.keyTopics,
          fileName: documents.fileName,
          fileType: documents.fileType,
          filePath: documents.filePath
        })
        .from(userModuleAssignments)
        .innerJoin(trainingModules, eq(userModuleAssignments.moduleId, trainingModules.id))
        .leftJoin(documents, eq(trainingModules.documentId, documents.id))
        .where(eq(userModuleAssignments.userId, userId))
        .orderBy(desc(userModuleAssignments.assignedAt));

      // Get quiz scores for completed modules
      const quizResults = await storage.getUserQuizResults(userId);
      const quizScoreMap = quizResults.reduce((map: any, result) => {
        map[result.moduleId] = result.score;
        return map;
      }, {});

      // Transform the data to match the expected interface
      const formattedAssignments = assignments.map((assignment: any) => ({
        id: assignment.id,
        moduleId: assignment.moduleId,
        moduleTitle: assignment.moduleTitle,
        moduleDescription: assignment.moduleDescription,
        learningStage: assignment.learningStage,
        assignedAt: assignment.assignedAt,
        completedAt: assignment.completedAt,
        isCompleted: assignment.isCompleted,
        summary: assignment.aiSummary,
        keyTopics: assignment.keyTopics,
        quizScore: quizScoreMap[assignment.moduleId] || null,
        document: assignment.documentId ? {
          id: assignment.documentId,
          fileName: assignment.fileName,
          fileType: assignment.fileType,
          filePath: assignment.filePath
        } : undefined
      }));

      res.json(formattedAssignments);
    } catch (error) {
      console.error("Error fetching user assigned modules:", error);
      res.status(500).json({ message: "Failed to fetch assigned modules" });
    }
  });

  app.get('/api/user/progress-stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Get completion statistics
      const assignments = await storage.getUserAssignments(userId);
      const completedCount = assignments.filter(a => a.isCompleted).length;
      const totalCount = assignments.length;
      const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

      // Get quiz statistics
      const quizResults = await storage.getUserQuizResults(userId);
      const averageScore = quizResults.length > 0 
        ? Math.round(quizResults.reduce((sum, result) => sum + result.score, 0) / quizResults.length)
        : 0;

      res.json({
        totalAssigned: totalCount,
        completed: completedCount,
        completionRate,
        averageQuizScore: averageScore,
        totalQuizzesTaken: quizResults.length
      });
    } catch (error) {
      console.error("Error fetching user progress stats:", error);
      res.status(500).json({ message: "Failed to fetch progress stats" });
    }
  });

  app.post('/api/user/complete-module/:moduleId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const moduleId = parseInt(req.params.moduleId);
      
      await storage.completeAssignment(userId, moduleId);
      res.json({ message: "Module completed successfully" });
    } catch (error) {
      console.error("Error completing module:", error);
      res.status(500).json({ message: "Failed to complete module" });
    }
  });

  app.post('/api/user/submit-quiz', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { moduleId, answers, score, totalQuestions } = req.body;
      
      // Validate required fields
      if (!moduleId || !userId) {
        return res.status(400).json({ message: "Missing required fields: moduleId or userId" });
      }
      
      // Ensure moduleId is a number
      const parsedModuleId = parseInt(moduleId);
      if (isNaN(parsedModuleId)) {
        return res.status(400).json({ message: "Invalid moduleId format" });
      }
      
      // Check if quiz result already exists for this user and module
      const existingResults = await storage.getUserQuizResults(userId);
      const existingResult = existingResults.find(result => result.moduleId === parsedModuleId);
      
      let quizResult;
      if (existingResult) {
        // User already has quiz result for this module, creating new attempt
      }
      
      // Create quiz result
      quizResult = await storage.createQuizResult({
        userId,
        moduleId: parsedModuleId,
        score,
        totalQuestions,
        answers: answers || {}
      });
      
      // Automatically mark module as complete when quiz is submitted
      await storage.completeAssignment(userId, parsedModuleId);
      
      res.json({ score, message: "Quiz submitted and module completed successfully" });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      res.status(500).json({ message: "Failed to submit quiz" });
    }
  });

  // Document download endpoint with module name
  app.get('/api/documents/download/:id', isAuthenticated, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      
      // Get document with associated training module info
      const result = await db
        .select({
          document: documents,
          moduleTitle: trainingModules.title
        })
        .from(documents)
        .leftJoin(trainingModules, eq(documents.id, trainingModules.documentId))
        .where(eq(documents.id, documentId))
        .limit(1);

      if (result.length === 0) {
        return res.status(404).json({ message: "Document not found" });
      }

      const { document, moduleTitle } = result[0];

      // Check if file exists
      if (!fs.existsSync(document.filePath)) {
        return res.status(404).json({ message: "File not found on disk" });
      }

      // Create a meaningful filename using module title and original extension
      const fileExtension = document.fileName.split('.').pop();
      const downloadFileName = moduleTitle 
        ? `${moduleTitle.replace(/[^a-zA-Z0-9\s]/g, '').trim()}.${fileExtension}`
        : document.fileName;

      // Set appropriate headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      
      // Stream the file
      const fileStream = fs.createReadStream(document.filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  // Get quiz questions for a module
  app.get('/api/modules/:moduleId/quiz-questions', isAuthenticated, async (req, res) => {
    try {
      const moduleId = parseInt(req.params.moduleId);
      const questions = await storage.getQuizQuestionsByModule(moduleId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(500).json({ message: "Failed to fetch quiz questions" });
    }
  });

  // Chatbot routes (supporting both /api/chat and /api/chatbot)
  const handleChatRequest = async (req: any, res: any) => {
    try {
      const { message } = req.body;
      const userId = getUserId(req);
      
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
      const userId = getUserId(req);
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
      const userId = getUserId(req);
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

  // Remove module assignment
  app.delete('/api/users/:userId/remove-module/:moduleId', isAuthenticated, async (req, res) => {
    try {
      const { userId, moduleId } = req.params;
      
      // Delete the assignment using storage method
      await storage.removeAssignment(userId, parseInt(moduleId));

      res.json({ message: 'Assignment removed successfully' });
    } catch (error) {
      console.error('Error removing assignment:', error);
      res.status(500).json({ message: 'Failed to remove assignment' });
    }
  });

  // Local signup route
  app.post('/api/auth/local/signup', async (req, res) => {
    try {
      // Validate request body
      const signupData = validateBody(userInvitationSchema.extend({
        password: z.string().min(8, 'Password must be at least 8 characters long')
      }), req.body);

      const { email, password, firstName, lastName, role } = signupData;

      // Check if user already exists
      const existingUsers = await storage.getAllUsers();
      const existingUser = existingUsers.find(u => u.email === email);
      
      if (existingUser) {
        return res.status(400).json({ 
          message: 'User with this email already exists' 
        });
      }

      // Generate unique ID for new user
      const uniqueId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Create new user
      const newUser = await storage.createUser({
        id: uniqueId,
        email,
        firstName,
        lastName,
        role,
        password // This will be hashed in storage.createUser
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;

      res.status(201).json({ 
        user: userWithoutPassword,
        message: 'Account created successfully' 
      });
    } catch (error) {
      console.error('Signup error:', error);
      
      // Handle validation errors
      if (error instanceof Error && error.message.startsWith('Validation error:')) {
        return res.status(400).json({ message: error.message.replace('Validation error: ', '') });
      }
      
      res.status(500).json({ message: 'Failed to create account' });
    }
  });

  // Local login route
  app.post('/api/auth/local/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        console.error('Authentication error:', err);
        return res.status(500).json({ message: 'Authentication failed' });
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Invalid credentials' });
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return res.status(500).json({ message: 'Login failed' });
        }
        
        // Manually set session data to ensure persistence
        req.session.user = user;
        req.session.userId = user.id;
        req.session.isAuthenticated = true;
        
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
          }
          return res.json({ user, message: 'Login successful' });
        });
      });
    })(req, res, next);
  });

  // Local logout route  
  app.post('/api/auth/local/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
