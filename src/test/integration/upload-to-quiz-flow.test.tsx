import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '../setup';
import { rest } from 'msw';

// Mock components for integration test
import UploadContent from '@/pages/UploadContent';
import TrainingModules from '@/pages/TrainingModules';
import QuizManagement from '@/pages/QuizManagement';

// Mock the auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'admin-user-id',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    },
  }),
}));

// Mock router
vi.mock('wouter', () => ({
  useLocation: () => ['/', vi.fn()],
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

const createMockFile = (name: string, type: string, size: number) => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('Upload to Quiz Integration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Admin Workflow: Upload → Summary → Module → Quiz', () => {
    it('should complete the full workflow from file upload to quiz creation', async () => {
      const user = userEvent.setup();

      // Mock the complete workflow API responses
      let moduleId: number;
      
      server.use(
        // 1. File upload with AI analysis
        rest.post('/api/upload', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              analysis: {
                summary: 'This document covers React fundamentals including components, props, state, and hooks. It provides comprehensive examples and best practices for building modern React applications.',
                keyTopics: ['React Components', 'Props and State', 'React Hooks', 'Event Handling', 'Lifecycle Methods'],
                suggestedModules: [
                  {
                    title: 'React Fundamentals',
                    stage: 'foundational',
                    description: 'Learn the basics of React development',
                  },
                ],
              },
              document: {
                id: 1,
                fileName: 'react-fundamentals.docx',
                originalName: 'React Fundamentals Training Material.docx',
                fileType: 'docx',
                filePath: '/uploads/react-fundamentals.docx',
                fileSize: 2500000,
                uploadedBy: 'admin-user-id',
                createdAt: new Date().toISOString(),
              },
            })
          );
        }),

        // 2. Create training module
        rest.post('/api/modules', (req, res, ctx) => {
          moduleId = 1;
          return res(
            ctx.json({
              id: moduleId,
              title: 'React Fundamentals',
              description: 'Learn the basics of React development',
              learningStage: 'foundational',
              status: 'draft',
              documentId: 1,
              createdBy: 'admin-user-id',
              aiGenerated: true,
              createdAt: new Date().toISOString(),
            })
          );
        }),

        // 3. Generate quiz questions with AI
        rest.post('/api/modules/1/generate-quiz', (req, res, ctx) => {
          return res(
            ctx.json({
              questions: [
                {
                  id: 1,
                  moduleId: 1,
                  questionText: 'What is a React component?',
                  questionType: 'multiple_choice',
                  options: ['A JavaScript function', 'A CSS class', 'An HTML element', 'A database table'],
                  correctAnswer: 'A JavaScript function',
                  explanation: 'React components are JavaScript functions that return JSX to describe what should appear on the screen.',
                  order: 1,
                },
                {
                  id: 2,
                  moduleId: 1,
                  questionText: 'React uses a virtual DOM for better performance.',
                  questionType: 'true_false',
                  options: ['True', 'False'],
                  correctAnswer: 'True',
                  explanation: 'React uses a virtual DOM to optimize updates and improve performance by minimizing direct DOM manipulation.',
                  order: 2,
                },
                {
                  id: 3,
                  moduleId: 1,
                  questionText: 'Which hook is used for state management in functional components?',
                  questionType: 'multiple_choice',
                  options: ['useEffect', 'useState', 'useContext', 'useReducer'],
                  correctAnswer: 'useState',
                  explanation: 'useState is the primary hook for managing local state in functional React components.',
                  order: 3,
                },
              ],
            })
          );
        }),

        // 4. Publish module
        rest.put('/api/modules/1', (req, res, ctx) => {
          return res(
            ctx.json({
              id: 1,
              title: 'React Fundamentals',
              description: 'Learn the basics of React development',
              learningStage: 'foundational',
              status: 'published',
              documentId: 1,
              createdBy: 'admin-user-id',
              aiGenerated: true,
              updatedAt: new Date().toISOString(),
            })
          );
        }),

        // 5. Assign to users
        rest.post('/api/modules/1/assign', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              assignedUsers: ['employee1', 'employee2', 'employee3'],
            })
          );
        }),

        // Get users for assignment
        rest.get('/api/users', (req, res, ctx) => {
          return res(
            ctx.json([
              { id: 'employee1', email: 'emp1@example.com', firstName: 'John', lastName: 'Doe', role: 'employee' },
              { id: 'employee2', email: 'emp2@example.com', firstName: 'Jane', lastName: 'Smith', role: 'employee' },
              { id: 'employee3', email: 'emp3@example.com', firstName: 'Bob', lastName: 'Johnson', role: 'employee' },
            ])
          );
        }),

        // Get modules
        rest.get('/api/modules', (req, res, ctx) => {
          return res(
            ctx.json([
              {
                id: 1,
                title: 'React Fundamentals',
                description: 'Learn the basics of React development',
                learningStage: 'foundational',
                status: 'published',
                documentId: 1,
                createdBy: 'admin-user-id',
                aiGenerated: true,
              },
            ])
          );
        }),

        // Get quiz questions
        rest.get('/api/modules/1/questions', (req, res, ctx) => {
          return res(
            ctx.json([
              {
                id: 1,
                moduleId: 1,
                questionText: 'What is a React component?',
                questionType: 'multiple_choice',
                options: ['A JavaScript function', 'A CSS class', 'An HTML element', 'A database table'],
                correctAnswer: 'A JavaScript function',
                explanation: 'React components are JavaScript functions that return JSX to describe what should appear on the screen.',
                order: 1,
              },
              {
                id: 2,
                moduleId: 1,
                questionText: 'React uses a virtual DOM for better performance.',
                questionType: 'true_false',
                options: ['True', 'False'],
                correctAnswer: 'True',
                explanation: 'React uses a virtual DOM to optimize updates and improve performance by minimizing direct DOM manipulation.',
                order: 2,
              },
              {
                id: 3,
                moduleId: 1,
                questionText: 'Which hook is used for state management in functional components?',
                questionType: 'multiple_choice',
                options: ['useEffect', 'useState', 'useContext', 'useReducer'],
                correctAnswer: 'useState',
                explanation: 'useState is the primary hook for managing local state in functional React components.',
                order: 3,
              },
            ])
          );
        })
      );

      // Step 1: Upload File and Generate Summary
      renderWithQueryClient(<UploadContent />);

      // Upload a training document
      const file = createMockFile('react-fundamentals.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 2500000);
      const fileInput = screen.getByLabelText(/file upload/i);
      await user.upload(fileInput, file);

      // Wait for upload completion and AI analysis
      await waitFor(() => {
        expect(screen.getByText(/this document covers react fundamentals/i)).toBeInTheDocument();
        expect(screen.getByText(/react components/i)).toBeInTheDocument();
        expect(screen.getByText(/props and state/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Verify suggested module appears
      expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
      expect(screen.getByText('foundational')).toBeInTheDocument();

      // Step 2: Create Training Module from Suggestion
      const createModuleButton = screen.getByText(/create module/i);
      await user.click(createModuleButton);

      await waitFor(() => {
        expect(screen.getByText(/module created successfully/i)).toBeInTheDocument();
      });

      // Step 3: Navigate to Training Modules and Generate Quiz
      renderWithQueryClient(<TrainingModules />);

      await waitFor(() => {
        expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
      });

      // Open the module and generate quiz
      const moduleCard = screen.getByText('React Fundamentals').closest('[data-testid="module-card"]');
      const generateQuizButton = within(moduleCard!).getByText(/generate quiz/i);
      await user.click(generateQuizButton);

      // Wait for quiz generation
      await waitFor(() => {
        expect(screen.getByText(/quiz generated successfully/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Step 4: Verify Quiz Questions
      const viewQuizButton = within(moduleCard!).getByText(/view quiz/i);
      await user.click(viewQuizButton);

      await waitFor(() => {
        expect(screen.getByText('What is a React component?')).toBeInTheDocument();
        expect(screen.getByText('React uses a virtual DOM for better performance.')).toBeInTheDocument();
        expect(screen.getByText('Which hook is used for state management in functional components?')).toBeInTheDocument();
      });

      // Verify question types and options
      expect(screen.getByText('A JavaScript function')).toBeInTheDocument();
      expect(screen.getByText('True')).toBeInTheDocument();
      expect(screen.getByText('useState')).toBeInTheDocument();

      // Step 5: Publish Module
      const publishButton = screen.getByText(/publish module/i);
      await user.click(publishButton);

      await waitFor(() => {
        expect(screen.getByText(/module published successfully/i)).toBeInTheDocument();
      });

      // Step 6: Assign to Employees
      const assignButton = screen.getByText(/assign to employees/i);
      await user.click(assignButton);

      // Select employees
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      });

      // Select all employees
      const selectAllCheckbox = screen.getByLabelText(/select all/i);
      await user.click(selectAllCheckbox);

      const confirmAssignButton = screen.getByText(/confirm assignment/i);
      await user.click(confirmAssignButton);

      await waitFor(() => {
        expect(screen.getByText(/assigned to 3 employees/i)).toBeInTheDocument();
      });

      // Verify the complete workflow
      expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
      expect(screen.getByText('published')).toBeInTheDocument();
      expect(screen.getByText('3 questions')).toBeInTheDocument();
      expect(screen.getByText('3 assigned')).toBeInTheDocument();
    });

    it('should handle AI-powered content analysis and module suggestions', async () => {
      const user = userEvent.setup();

      server.use(
        rest.post('/api/upload', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              analysis: {
                summary: 'Advanced TypeScript concepts including generics, decorators, and advanced type manipulations. Covers enterprise-level patterns and best practices.',
                keyTopics: ['TypeScript Generics', 'Decorators', 'Advanced Types', 'Type Guards', 'Utility Types'],
                suggestedModules: [
                  {
                    title: 'Advanced TypeScript',
                    stage: 'advanced',
                    description: 'Master advanced TypeScript concepts for enterprise development',
                  },
                  {
                    title: 'TypeScript Design Patterns',
                    stage: 'advanced',
                    description: 'Learn common design patterns in TypeScript',
                  },
                ],
              },
              document: {
                id: 2,
                fileName: 'advanced-typescript.pdf',
                originalName: 'Advanced TypeScript Guide.pdf',
                fileType: 'pdf',
              },
            })
          );
        })
      );

      renderWithQueryClient(<UploadContent />);

      // Upload advanced content
      const file = createMockFile('advanced-typescript.pdf', 'application/pdf', 3000000);
      const fileInput = screen.getByLabelText(/file upload/i);
      await user.upload(fileInput, file);

      // Verify AI analysis
      await waitFor(() => {
        expect(screen.getByText(/advanced typescript concepts/i)).toBeInTheDocument();
        expect(screen.getByText(/generics/i)).toBeInTheDocument();
        expect(screen.getByText(/decorators/i)).toBeInTheDocument();
      });

      // Verify multiple module suggestions
      expect(screen.getByText('Advanced TypeScript')).toBeInTheDocument();
      expect(screen.getByText('TypeScript Design Patterns')).toBeInTheDocument();
      expect(screen.getAllByText('advanced')).toHaveLength(2);

      // Verify learning stage appropriate suggestions
      expect(screen.getByText(/enterprise development/i)).toBeInTheDocument();
      expect(screen.getByText(/design patterns/i)).toBeInTheDocument();
    });

    it('should handle different file types and generate appropriate content', async () => {
      const user = userEvent.setup();

      // Test video file upload
      server.use(
        rest.post('/api/upload', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              analysis: {
                summary: 'Video tutorial covering JavaScript basics including variables, functions, loops, and DOM manipulation. Includes practical coding examples and exercises.',
                keyTopics: ['JavaScript Variables', 'Functions', 'Loops', 'DOM Manipulation', 'Event Handling'],
                suggestedModules: [
                  {
                    title: 'JavaScript Fundamentals',
                    stage: 'foundational',
                    description: 'Learn the basics of JavaScript programming',
                  },
                ],
              },
              document: {
                id: 3,
                fileName: 'js-basics.mp4',
                originalName: 'JavaScript Basics Tutorial.mp4',
                fileType: 'video',
              },
            })
          );
        })
      );

      renderWithQueryClient(<UploadContent />);

      // Upload video file
      const file = createMockFile('js-basics.mp4', 'video/mp4', 50000000);
      const fileInput = screen.getByLabelText(/file upload/i);
      await user.upload(fileInput, file);

      // Verify video processing
      await waitFor(() => {
        expect(screen.getByText(/video tutorial covering javascript/i)).toBeInTheDocument();
        expect(screen.getByText(/practical coding examples/i)).toBeInTheDocument();
      });

      // Verify video-specific UI elements
      expect(screen.getByTestId('video-icon')).toBeInTheDocument();
      expect(screen.getByText('50 MB')).toBeInTheDocument();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle upload failures gracefully', async () => {
      const user = userEvent.setup();

      server.use(
        rest.post('/api/upload', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Processing failed' }));
        })
      );

      renderWithQueryClient(<UploadContent />);

      const file = createMockFile('test.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1000000);
      const fileInput = screen.getByLabelText(/file upload/i);
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
        expect(screen.getByText(/retry/i)).toBeInTheDocument();
      });
    });

    it('should handle AI analysis failures with fallback', async () => {
      const user = userEvent.setup();

      server.use(
        rest.post('/api/upload', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              analysis: {
                summary: null,
                keyTopics: [],
                suggestedModules: [],
                error: 'AI analysis temporarily unavailable',
              },
              document: {
                id: 4,
                fileName: 'document.docx',
                originalName: 'Training Document.docx',
                fileType: 'docx',
              },
            })
          );
        })
      );

      renderWithQueryClient(<UploadContent />);

      const file = createMockFile('document.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1000000);
      const fileInput = screen.getByLabelText(/file upload/i);
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/ai analysis temporarily unavailable/i)).toBeInTheDocument();
        expect(screen.getByText(/create module manually/i)).toBeInTheDocument();
      });
    });

    it('should handle quiz generation failures with manual option', async () => {
      const user = userEvent.setup();

      server.use(
        rest.post('/api/modules/1/generate-quiz', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Quiz generation failed' }));
        }),
        rest.get('/api/modules', (req, res, ctx) => {
          return res(
            ctx.json([
              {
                id: 1,
                title: 'Test Module',
                description: 'Test Description',
                learningStage: 'foundational',
                status: 'draft',
                createdBy: 'admin-user-id',
              },
            ])
          );
        })
      );

      renderWithQueryClient(<TrainingModules />);

      await waitFor(() => {
        expect(screen.getByText('Test Module')).toBeInTheDocument();
      });

      const generateQuizButton = screen.getByText(/generate quiz/i);
      await user.click(generateQuizButton);

      await waitFor(() => {
        expect(screen.getByText(/quiz generation failed/i)).toBeInTheDocument();
        expect(screen.getByText(/create questions manually/i)).toBeInTheDocument();
      });
    });
  });

  describe('Module Assignment and Tracking', () => {
    it('should handle bulk assignment to multiple users with different roles', async () => {
      const user = userEvent.setup();

      server.use(
        rest.get('/api/users', (req, res, ctx) => {
          return res(
            ctx.json([
              { id: 'emp1', email: 'emp1@example.com', firstName: 'John', lastName: 'Doe', role: 'employee' },
              { id: 'emp2', email: 'emp2@example.com', firstName: 'Jane', lastName: 'Smith', role: 'employee' },
              { id: 'trainer1', email: 'trainer@example.com', firstName: 'Bob', lastName: 'Trainer', role: 'trainer' },
              { id: 'admin1', email: 'admin2@example.com', firstName: 'Alice', lastName: 'Admin', role: 'admin' },
            ])
          );
        }),
        rest.post('/api/modules/1/assign', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              assignedUsers: ['emp1', 'emp2'],
              skippedUsers: ['trainer1', 'admin1'],
              message: 'Assigned to 2 employees, skipped 2 non-employees',
            })
          );
        }),
        rest.get('/api/modules', (req, res, ctx) => {
          return res(
            ctx.json([
              {
                id: 1,
                title: 'Test Module',
                description: 'Test Description',
                learningStage: 'foundational',
                status: 'published',
                createdBy: 'admin-user-id',
              },
            ])
          );
        })
      );

      renderWithQueryClient(<TrainingModules />);

      await waitFor(() => {
        expect(screen.getByText('Test Module')).toBeInTheDocument();
      });

      const assignButton = screen.getByText(/assign to employees/i);
      await user.click(assignButton);

      // Wait for user list to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Trainer')).toBeInTheDocument();
      });

      // Select employees only (system should auto-filter)
      const selectEmployeesButton = screen.getByText(/select employees only/i);
      await user.click(selectEmployeesButton);

      const confirmButton = screen.getByText(/confirm assignment/i);
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/assigned to 2 employees/i)).toBeInTheDocument();
        expect(screen.getByText(/skipped 2 non-employees/i)).toBeInTheDocument();
      });
    });
  });
});