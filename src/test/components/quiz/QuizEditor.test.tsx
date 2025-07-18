import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import QuizEditor from '@/components/quiz/QuizEditor';
import { server } from '../../setup';
import { rest } from 'msw';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the API request function
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
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

describe('QuizEditor', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  const defaultProps = {
    moduleId: 1,
    onClose: mockOnClose,
    onSave: mockOnSave,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Creating a new question', () => {
    it('renders with empty form for new question', () => {
      renderWithQueryClient(<QuizEditor {...defaultProps} />);

      expect(screen.getByDisplayValue('')).toBeInTheDocument(); // Question text input
      expect(screen.getByRole('combobox')).toBeInTheDocument(); // Question type selector
      expect(screen.getByDisplayValue('1')).toBeInTheDocument(); // Order input
    });

    it('allows user to enter question text', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<QuizEditor {...defaultProps} />);

      const questionInput = screen.getByPlaceholderText(/enter your question/i);
      await user.type(questionInput, 'What is React?');

      expect(questionInput).toHaveValue('What is React?');
    });

    it('allows user to select question type', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<QuizEditor {...defaultProps} />);

      const typeSelector = screen.getByRole('combobox');
      await user.click(typeSelector);
      
      const trueFalseOption = screen.getByText('True/False');
      await user.click(trueFalseOption);

      expect(screen.getByText('True/False')).toBeInTheDocument();
    });

    it('shows multiple choice options by default', () => {
      renderWithQueryClient(<QuizEditor {...defaultProps} />);

      const optionInputs = screen.getAllByPlaceholderText(/option/i);
      expect(optionInputs).toHaveLength(4);
    });

    it('hides multiple choice options for true/false questions', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<QuizEditor {...defaultProps} />);

      const typeSelector = screen.getByRole('combobox');
      await user.click(typeSelector);
      
      const trueFalseOption = screen.getByText('True/False');
      await user.click(trueFalseOption);

      const optionInputs = screen.queryAllByPlaceholderText(/option/i);
      expect(optionInputs).toHaveLength(0);
    });

    it('validates required fields before saving', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<QuizEditor {...defaultProps} />);

      const saveButton = screen.getByText(/save question/i);
      await user.click(saveButton);

      // Should show validation error for missing question text
      expect(screen.getByText(/question text is required/i)).toBeInTheDocument();
    });

    it('submits form with valid data', async () => {
      const user = userEvent.setup();
      
      // Mock successful API response
      server.use(
        rest.post('/api/modules/1/questions', (req, res, ctx) => {
          return res(ctx.json({ id: 1, success: true }));
        })
      );

      renderWithQueryClient(<QuizEditor {...defaultProps} />);

      // Fill in the form
      const questionInput = screen.getByPlaceholderText(/enter your question/i);
      await user.type(questionInput, 'What is React?');

      const option1 = screen.getByDisplayValue('');
      await user.type(option1, 'A JavaScript library');

      const option2 = screen.getAllByDisplayValue('')[1];
      await user.type(option2, 'A programming language');

      const correctAnswerRadio = screen.getAllByRole('radio')[0];
      await user.click(correctAnswerRadio);

      const saveButton = screen.getByText(/save question/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('Editing existing question', () => {
    const existingQuestion = {
      id: 1,
      moduleId: 1,
      questionText: 'What is TypeScript?',
      questionType: 'multiple_choice' as const,
      options: ['A superset of JavaScript', 'A database', 'A CSS framework', 'A testing library'],
      correctAnswer: 'A superset of JavaScript',
      explanation: 'TypeScript is a strongly typed programming language that builds on JavaScript.',
      order: 1,
    };

    it('pre-fills form with existing question data', () => {
      renderWithQueryClient(
        <QuizEditor {...defaultProps} question={existingQuestion} />
      );

      expect(screen.getByDisplayValue('What is TypeScript?')).toBeInTheDocument();
      expect(screen.getByDisplayValue('A superset of JavaScript')).toBeInTheDocument();
      expect(screen.getByDisplayValue('A database')).toBeInTheDocument();
      expect(screen.getByDisplayValue('TypeScript is a strongly typed programming language that builds on JavaScript.')).toBeInTheDocument();
    });

    it('updates existing question when saved', async () => {
      const user = userEvent.setup();
      
      // Mock successful update API response
      server.use(
        rest.put('/api/modules/1/questions/1', (req, res, ctx) => {
          return res(ctx.json({ success: true }));
        })
      );

      renderWithQueryClient(
        <QuizEditor {...defaultProps} question={existingQuestion} />
      );

      const questionInput = screen.getByDisplayValue('What is TypeScript?');
      await user.clear(questionInput);
      await user.type(questionInput, 'What is JavaScript?');

      const saveButton = screen.getByText(/update question/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });

    it('allows deleting existing question', async () => {
      const user = userEvent.setup();
      
      // Mock successful delete API response
      server.use(
        rest.delete('/api/modules/1/questions/1', (req, res, ctx) => {
          return res(ctx.json({ success: true }));
        })
      );

      renderWithQueryClient(
        <QuizEditor {...defaultProps} question={existingQuestion} />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      // Confirm deletion in dialog
      const confirmButton = screen.getByText(/confirm/i);
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });

  describe('Question options management', () => {
    it('allows adding new option for multiple choice', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<QuizEditor {...defaultProps} />);

      const addOptionButton = screen.getByText(/add option/i);
      await user.click(addOptionButton);

      const optionInputs = screen.getAllByPlaceholderText(/option/i);
      expect(optionInputs).toHaveLength(5);
    });

    it('allows removing option for multiple choice', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<QuizEditor {...defaultProps} />);

      const removeButtons = screen.getAllByRole('button', { name: /remove option/i });
      await user.click(removeButtons[0]);

      const optionInputs = screen.getAllByPlaceholderText(/option/i);
      expect(optionInputs).toHaveLength(3);
    });

    it('prevents removing when minimum options reached', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<QuizEditor {...defaultProps} />);

      // Remove options until only 2 remain
      const removeButtons = screen.getAllByRole('button', { name: /remove option/i });
      await user.click(removeButtons[0]);
      await user.click(removeButtons[1]);

      const remainingRemoveButtons = screen.queryAllByRole('button', { name: /remove option/i });
      expect(remainingRemoveButtons).toHaveLength(0);
    });
  });

  describe('Error handling', () => {
    it('handles API errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock API error response
      server.use(
        rest.post('/api/modules/1/questions', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Server error' }));
        })
      );

      renderWithQueryClient(<QuizEditor {...defaultProps} />);

      // Fill in minimal valid data
      const questionInput = screen.getByPlaceholderText(/enter your question/i);
      await user.type(questionInput, 'Test question');

      const saveButton = screen.getByText(/save question/i);
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to save question/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      renderWithQueryClient(<QuizEditor {...defaultProps} />);

      expect(screen.getByLabelText(/question text/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/question type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/explanation/i)).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<QuizEditor {...defaultProps} />);

      const questionInput = screen.getByPlaceholderText(/enter your question/i);
      questionInput.focus();

      expect(document.activeElement).toBe(questionInput);

      await user.tab();
      const typeSelector = screen.getByRole('combobox');
      expect(document.activeElement).toBe(typeSelector);
    });
  });
});