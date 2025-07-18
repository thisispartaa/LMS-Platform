import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';
import { db } from '../../server/db';

// Mock the database
vi.mock('../../server/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock storage
vi.mock('../../server/storage', () => ({
  storage: {
    getUser: vi.fn(),
    getDashboardStats: vi.fn(),
    createTrainingModule: vi.fn(),
    getTrainingModules: vi.fn(),
    assignModuleToUsers: vi.fn(),
  },
}));

// Mock OpenAI services
vi.mock('../../server/services/openai', () => ({
  generateQuizQuestions: vi.fn(),
  getChatbotResponse: vi.fn(),
  suggestReviewModules: vi.fn(),
}));

// Mock file processor
vi.mock('../../server/services/fileProcessor', () => ({
  upload: {
    single: vi.fn(() => (req: any, res: any, next: any) => {
      req.file = {
        path: '/tmp/test-file.docx',
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        originalname: 'test.docx',
        size: 1024000,
      };
      next();
    }),
  },
  getFileType: vi.fn(() => 'docx'),
  processUploadedFile: vi.fn(),
}));

describe('API Endpoints', () => {
  let app: express.Application;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    app.use((req: any, res, next) => {
      req.user = {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'admin',
      };
      next();
    });

    await registerRoutes(app);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Endpoints', () => {
    it('GET /api/auth/user should return current user', async () => {
      const response = await request(app)
        .get('/api/auth/user')
        .expect(200);

      expect(response.body).toEqual({
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'admin',
      });
    });

    it('should require authentication for protected routes', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());
      await registerRoutes(appNoAuth);

      await request(appNoAuth)
        .get('/api/auth/user')
        .expect(401);
    });
  });

  describe('Dashboard Endpoints', () => {
    it('GET /api/dashboard/stats should return dashboard statistics', async () => {
      const mockStats = {
        totalUsers: 150,
        totalModules: 25,
        completedQuizzes: 1250,
        averageScore: 85.5,
      };

      const { storage } = await import('../../server/storage');
      vi.mocked(storage.getDashboardStats).mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect(200);

      expect(response.body).toEqual(mockStats);
    });

    it('should handle dashboard stats errors', async () => {
      const { storage } = await import('../../server/storage');
      vi.mocked(storage.getDashboardStats).mockRejectedValue(new Error('Database error'));

      await request(app)
        .get('/api/dashboard/stats')
        .expect(500);
    });
  });

  describe('File Upload Endpoints', () => {
    it('POST /api/upload should process file upload and return analysis', async () => {
      const mockAnalysis = {
        content: 'Sample document content about React components...',
        analysis: {
          summary: 'This document covers React fundamentals including components, props, and state.',
          keyTopics: ['React Components', 'Props', 'State Management'],
          suggestedModules: [
            {
              title: 'React Fundamentals',
              stage: 'foundational',
              description: 'Learn the basics of React development',
            },
          ],
        },
      };

      const { processUploadedFile } = await import('../../server/services/fileProcessor');
      vi.mocked(processUploadedFile).mockResolvedValue(mockAnalysis);

      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('test content'), 'test.docx')
        .expect(200);

      expect(response.body.analysis).toEqual(mockAnalysis.analysis);
      expect(processUploadedFile).toHaveBeenCalledWith(
        '/tmp/test-file.docx',
        'docx',
        'test-user-id'
      );
    });

    it('should reject upload without file', async () => {
      await request(app)
        .post('/api/upload')
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe('No file uploaded');
        });
    });

    it('should handle file processing errors', async () => {
      const { processUploadedFile } = await import('../../server/services/fileProcessor');
      vi.mocked(processUploadedFile).mockRejectedValue(new Error('Processing failed'));

      await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('test content'), 'test.docx')
        .expect(500);
    });
  });

  describe('Training Module Endpoints', () => {
    it('POST /api/modules should create a new training module', async () => {
      const moduleData = {
        title: 'React Fundamentals',
        description: 'Learn the basics of React',
        learningStage: 'foundational',
        documentId: 1,
      };

      const mockModule = {
        id: 1,
        ...moduleData,
        status: 'draft',
        createdBy: 'test-user-id',
        createdAt: new Date().toISOString(),
      };

      const { storage } = await import('../../server/storage');
      vi.mocked(storage.createTrainingModule).mockResolvedValue(mockModule);

      const response = await request(app)
        .post('/api/modules')
        .send(moduleData)
        .expect(201);

      expect(response.body).toEqual(mockModule);
      expect(storage.createTrainingModule).toHaveBeenCalledWith({
        ...moduleData,
        createdBy: 'test-user-id',
      });
    });

    it('GET /api/modules should return training modules', async () => {
      const mockModules = [
        {
          id: 1,
          title: 'React Fundamentals',
          description: 'Learn React basics',
          learningStage: 'foundational',
          status: 'published',
          createdBy: 'test-user-id',
        },
        {
          id: 2,
          title: 'Advanced React',
          description: 'Advanced React concepts',
          learningStage: 'advanced',
          status: 'draft',
          createdBy: 'test-user-id',
        },
      ];

      const { storage } = await import('../../server/storage');
      vi.mocked(storage.getTrainingModules).mockResolvedValue(mockModules);

      const response = await request(app)
        .get('/api/modules')
        .expect(200);

      expect(response.body).toEqual(mockModules);
    });

    it('should validate module data', async () => {
      const invalidData = {
        title: '', // Invalid: empty title
        learningStage: 'invalid-stage', // Invalid stage
      };

      await request(app)
        .post('/api/modules')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('Quiz Generation Endpoints', () => {
    it('POST /api/modules/:id/generate-quiz should generate quiz questions', async () => {
      const mockQuestions = [
        {
          id: 1,
          moduleId: 1,
          questionText: 'What is a React component?',
          questionType: 'multiple_choice',
          options: ['A function', 'A class', 'Both', 'Neither'],
          correctAnswer: 'Both',
          explanation: 'React components can be either functions or classes.',
          order: 1,
        },
      ];

      const { generateQuizQuestions } = await import('../../server/services/openai');
      vi.mocked(generateQuizQuestions).mockResolvedValue(mockQuestions);

      const response = await request(app)
        .post('/api/modules/1/generate-quiz')
        .send({ documentContent: 'React components are...' })
        .expect(200);

      expect(response.body.questions).toEqual(mockQuestions);
      expect(generateQuizQuestions).toHaveBeenCalledWith(
        'React components are...',
        'foundational'
      );
    });

    it('should handle quiz generation errors', async () => {
      const { generateQuizQuestions } = await import('../../server/services/openai');
      vi.mocked(generateQuizQuestions).mockRejectedValue(new Error('AI service unavailable'));

      await request(app)
        .post('/api/modules/1/generate-quiz')
        .send({ documentContent: 'Content...' })
        .expect(500)
        .expect((res) => {
          expect(res.body.message).toContain('Failed to generate quiz');
        });
    });
  });

  describe('Quiz Taking Endpoints', () => {
    it('POST /api/modules/:id/quiz/submit should save quiz results', async () => {
      const quizSubmission = {
        answers: [
          { questionId: 1, selectedAnswer: 'Both' },
          { questionId: 2, selectedAnswer: 'True' },
        ],
        timeSpent: 300, // 5 minutes
      };

      const mockResult = {
        id: 1,
        userId: 'test-user-id',
        moduleId: 1,
        score: 100,
        totalQuestions: 2,
        correctAnswers: 2,
        timeSpent: 300,
        passed: true,
        completedAt: new Date().toISOString(),
      };

      vi.mocked(db.insert).mockResolvedValue([mockResult]);

      const response = await request(app)
        .post('/api/modules/1/quiz/submit')
        .send(quizSubmission)
        .expect(200);

      expect(response.body.result).toEqual(mockResult);
      expect(response.body.score).toBe(100);
      expect(response.body.passed).toBe(true);
    });

    it('should calculate quiz scores correctly', async () => {
      const quizSubmission = {
        answers: [
          { questionId: 1, selectedAnswer: 'Wrong answer' },
          { questionId: 2, selectedAnswer: 'True' },
        ],
        timeSpent: 180,
      };

      // Mock quiz questions for scoring
      vi.mocked(db.select).mockResolvedValue([
        { id: 1, correctAnswer: 'Correct answer' },
        { id: 2, correctAnswer: 'True' },
      ]);

      const mockResult = {
        id: 1,
        userId: 'test-user-id',
        moduleId: 1,
        score: 50, // 1 out of 2 correct
        totalQuestions: 2,
        correctAnswers: 1,
        timeSpent: 180,
        passed: false, // Assuming 70% pass rate
        completedAt: new Date().toISOString(),
      };

      vi.mocked(db.insert).mockResolvedValue([mockResult]);

      const response = await request(app)
        .post('/api/modules/1/quiz/submit')
        .send(quizSubmission)
        .expect(200);

      expect(response.body.score).toBe(50);
      expect(response.body.passed).toBe(false);
    });
  });

  describe('Chatbot Endpoints', () => {
    it('POST /api/chat should return chatbot response', async () => {
      const mockResponse = {
        message: 'I can help you with React training. Here are some topics I can explain...',
        suggestions: ['Start React module', 'Take React quiz', 'Explain React concepts'],
      };

      const { getChatbotResponse } = await import('../../server/services/openai');
      vi.mocked(getChatbotResponse).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Help me with React training' })
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(getChatbotResponse).toHaveBeenCalledWith(
        'Help me with React training',
        'test-user-id'
      );
    });

    it('GET /api/chat/history should return chat history', async () => {
      const mockHistory = [
        {
          id: 1,
          userId: 'test-user-id',
          message: 'Hello, how can I help?',
          isBot: true,
          timestamp: new Date().toISOString(),
        },
        {
          id: 2,
          userId: 'test-user-id',
          message: 'Tell me about React',
          isBot: false,
          timestamp: new Date().toISOString(),
        },
      ];

      vi.mocked(db.select).mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/api/chat/history')
        .expect(200);

      expect(response.body).toEqual(mockHistory);
    });

    it('DELETE /api/chat/history should clear chat history', async () => {
      vi.mocked(db.delete).mockResolvedValue({ rowCount: 5 });

      await request(app)
        .delete('/api/chat/history')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });

      expect(db.delete).toHaveBeenCalled();
    });
  });

  describe('Module Assignment Endpoints', () => {
    it('POST /api/modules/:id/assign should assign module to users', async () => {
      const assignmentData = {
        userIds: ['user1', 'user2', 'user3'],
        dueDate: '2024-12-31',
      };

      const mockResult = {
        success: true,
        assignedUsers: ['user1', 'user2', 'user3'],
        totalAssigned: 3,
      };

      const { storage } = await import('../../server/storage');
      vi.mocked(storage.assignModuleToUsers).mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/modules/1/assign')
        .send(assignmentData)
        .expect(200);

      expect(response.body).toEqual(mockResult);
      expect(storage.assignModuleToUsers).toHaveBeenCalledWith(
        1,
        assignmentData.userIds,
        'test-user-id',
        assignmentData.dueDate
      );
    });

    it('should validate assignment data', async () => {
      const invalidData = {
        userIds: [], // Empty array
        dueDate: 'invalid-date',
      };

      await request(app)
        .post('/api/modules/1/assign')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('Analytics Endpoints', () => {
    it('GET /api/analytics/completion should return completion analytics', async () => {
      const mockAnalytics = {
        overallCompletion: 75.5,
        moduleCompletions: [
          { moduleId: 1, title: 'React Fundamentals', completionRate: 85 },
          { moduleId: 2, title: 'Advanced React', completionRate: 66 },
        ],
        userProgress: [
          { userId: 'user1', completedModules: 2, totalAssigned: 3 },
          { userId: 'user2', completedModules: 1, totalAssigned: 2 },
        ],
      };

      vi.mocked(db.select).mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .get('/api/analytics/completion')
        .expect(200);

      expect(response.body).toEqual(mockAnalytics);
    });

    it('GET /api/analytics/scores should return score analytics', async () => {
      const mockScores = {
        averageScore: 82.3,
        scoreDistribution: {
          '90-100': 25,
          '80-89': 35,
          '70-79': 25,
          '60-69': 10,
          'below-60': 5,
        },
        moduleScores: [
          { moduleId: 1, averageScore: 85.2 },
          { moduleId: 2, averageScore: 79.1 },
        ],
      };

      vi.mocked(db.select).mockResolvedValue(mockScores);

      const response = await request(app)
        .get('/api/analytics/scores')
        .expect(200);

      expect(response.body).toEqual(mockScores);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors consistently', async () => {
      await request(app)
        .post('/api/modules')
        .send({ invalidField: 'value' })
        .expect(400)
        .expect((res) => {
          expect(res.body.error).toBeDefined();
          expect(res.body.message).toContain('validation');
        });
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(db.select).mockRejectedValue(new Error('Database connection failed'));

      await request(app)
        .get('/api/modules')
        .expect(500)
        .expect((res) => {
          expect(res.body.message).toContain('Failed to');
        });
    });

    it('should handle unauthorized access', async () => {
      const appUnauth = express();
      appUnauth.use(express.json());
      
      // Override auth middleware to return unauthorized
      appUnauth.use((req: any, res, next) => {
        res.status(401).json({ message: 'Unauthorized' });
      });

      await registerRoutes(appUnauth);

      await request(appUnauth)
        .post('/api/modules')
        .send({ title: 'Test Module' })
        .expect(401);
    });
  });

  describe('Rate Limiting and Security', () => {
    it('should handle concurrent requests properly', async () => {
      const { storage } = await import('../../server/storage');
      vi.mocked(storage.getTrainingModules).mockResolvedValue([]);

      // Simulate multiple concurrent requests
      const requests = Array(10).fill(null).map(() => 
        request(app).get('/api/modules')
      );

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should sanitize user input', async () => {
      const maliciousData = {
        title: '<script>alert("xss")</script>',
        description: 'Normal description',
        learningStage: 'foundational',
      };

      await request(app)
        .post('/api/modules')
        .send(maliciousData)
        .expect(400); // Should reject malicious input
    });
  });
});