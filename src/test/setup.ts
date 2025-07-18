import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock server for API calls
export const server = setupServer(
  // Mock auth endpoint
  rest.get('/api/auth/user', (req, res, ctx) => {
    return res(
      ctx.json({
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin',
      })
    );
  }),

  // Mock dashboard stats
  rest.get('/api/dashboard/stats', (req, res, ctx) => {
    return res(
      ctx.json({
        totalUsers: 150,
        totalModules: 25,
        completedQuizzes: 1250,
        averageScore: 85.5,
      })
    );
  }),

  // Mock training modules
  rest.get('/api/modules', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: 1,
          title: 'Test Module',
          description: 'Test Description',
          learningStage: 'onboarding',
          status: 'published',
          createdBy: 'test-user-id',
        },
      ])
    );
  }),

  // Mock quiz questions
  rest.get('/api/modules/:moduleId/questions', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          id: 1,
          moduleId: 1,
          questionText: 'What is the capital of France?',
          questionType: 'multiple_choice',
          options: ['London', 'Berlin', 'Paris', 'Madrid'],
          correctAnswer: 'Paris',
          explanation: 'Paris is the capital of France.',
          order: 1,
        },
      ])
    );
  }),
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

// Mock window.matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock HTMLDialogElement
global.HTMLDialogElement = class MockHTMLDialogElement extends HTMLElement {
  open = false;
  returnValue = '';
  
  constructor() {
    super();
  }
  
  close() {
    this.open = false;
  }
  
  show() {
    this.open = true;
  }
  
  showModal() {
    this.open = true;
  }
};

// Mock IntersectionObserver
global.IntersectionObserver = class MockIntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};