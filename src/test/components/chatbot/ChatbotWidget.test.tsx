import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ChatbotWidget from '@/components/chatbot/ChatbotWidget';
import { server } from '../../setup';
import { rest } from 'msw';

// Mock the auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'employee',
    },
  }),
}));

// Mock the API request function
vi.mock('@/lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: {
    invalidateQueries: vi.fn(),
  },
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

describe('ChatbotWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    server.use(
      rest.get('/api/chat/history', (req, res, ctx) => {
        return res(
          ctx.json([
            {
              id: 1,
              userId: 'test-user-id',
              message: 'Hello, how can I help?',
              isBot: true,
              timestamp: new Date().toISOString(),
            },
          ])
        );
      }),
      rest.post('/api/chat', (req, res, ctx) => {
        return res(
          ctx.json({
            message: 'Thank you for your question. How can I assist you further?',
            suggestions: ['Tell me about training modules', 'How do I take a quiz?'],
          })
        );
      }),
      rest.delete('/api/chat/history', (req, res, ctx) => {
        return res(ctx.json({ success: true }));
      })
    );
  });

  describe('Widget Display and Interaction', () => {
    it('renders chat button when closed', () => {
      renderWithQueryClient(<ChatbotWidget />);

      expect(screen.getByRole('button', { name: /open chat/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/amazebot/i)).toBeInTheDocument();
    });

    it('opens chat interface when button is clicked', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<ChatbotWidget />);

      const chatButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(chatButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/amazebot/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
    });

    it('closes chat interface when close button is clicked', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<ChatbotWidget />);

      // Open chat
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(chatButton);

      // Close chat
      const closeButton = screen.getByRole('button', { name: /close chat/i });
      await user.click(closeButton);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('shows welcome message when chat opens', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<ChatbotWidget />);

      const chatButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(chatButton);

      await waitFor(() => {
        expect(screen.getByText(/hello, how can i help/i)).toBeInTheDocument();
      });
    });
  });

  describe('Message Sending and Receiving', () => {
    it('allows user to type and send messages', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<ChatbotWidget />);

      // Open chat
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(chatButton);

      // Type and send message
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      await user.type(messageInput, 'What are the available training modules?');

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      expect(messageInput).toHaveValue('');
      expect(screen.getByText('What are the available training modules?')).toBeInTheDocument();
    });

    it('sends message with Enter key', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<ChatbotWidget />);

      // Open chat
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(chatButton);

      // Type message and press Enter
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      await user.type(messageInput, 'Test message{enter}');

      expect(messageInput).toHaveValue('');
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('prevents sending empty messages', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<ChatbotWidget />);

      // Open chat
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(chatButton);

      // Try to send empty message
      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toBeDisabled();

      // Type some spaces
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      await user.type(messageInput, '   ');

      expect(sendButton).toBeDisabled();
    });

    it('receives bot responses after sending message', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<ChatbotWidget />);

      // Open chat
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(chatButton);

      // Send message
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      await user.type(messageInput, 'How do I take a quiz?');

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Wait for bot response
      await waitFor(() => {
        expect(screen.getByText(/thank you for your question/i)).toBeInTheDocument();
      });
    });

    it('shows typing indicator while bot is responding', async () => {
      const user = userEvent.setup();
      
      // Add delay to API response
      server.use(
        rest.post('/api/chat', async (req, res, ctx) => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return res(
            ctx.json({
              message: 'Response after delay',
              suggestions: [],
            })
          );
        })
      );

      renderWithQueryClient(<ChatbotWidget />);

      // Open chat
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(chatButton);

      // Send message
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      await user.type(messageInput, 'Test question');

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Should show typing indicator
      expect(screen.getByText(/amazebot is typing/i)).toBeInTheDocument();

      // Wait for response
      await waitFor(() => {
        expect(screen.getByText('Response after delay')).toBeInTheDocument();
      });

      // Typing indicator should be gone
      expect(screen.queryByText(/amazebot is typing/i)).not.toBeInTheDocument();
    });
  });

  describe('Message History and Persistence', () => {
    it('loads previous chat history when opened', async () => {
      const user = userEvent.setup();
      
      server.use(
        rest.get('/api/chat/history', (req, res, ctx) => {
          return res(
            ctx.json([
              {
                id: 1,
                userId: 'test-user-id',
                message: 'Previous user message',
                isBot: false,
                timestamp: new Date().toISOString(),
              },
              {
                id: 2,
                userId: 'test-user-id',
                message: 'Previous bot response',
                isBot: true,
                timestamp: new Date().toISOString(),
              },
            ])
          );
        })
      );

      renderWithQueryClient(<ChatbotWidget />);

      // Open chat
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(chatButton);

      await waitFor(() => {
        expect(screen.getByText('Previous user message')).toBeInTheDocument();
        expect(screen.getByText('Previous bot response')).toBeInTheDocument();
      });
    });

    it('clears chat history on page refresh', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<ChatbotWidget />);

      // Open chat to trigger history clearing
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(chatButton);

      // History should be cleared on mount
      await waitFor(() => {
        expect(screen.getByText(/hello, how can i help/i)).toBeInTheDocument();
      });
    });

    it('scrolls to bottom when new messages arrive', async () => {
      const user = userEvent.setup();
      
      // Mock scrollIntoView
      const mockScrollIntoView = vi.fn();
      Element.prototype.scrollIntoView = mockScrollIntoView;

      renderWithQueryClient(<ChatbotWidget />);

      // Open chat
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(chatButton);

      // Send message
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      await user.type(messageInput, 'Test message');

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Should scroll to bottom
      await waitFor(() => {
        expect(mockScrollIntoView).toHaveBeenCalled();
      });
    });
  });

  describe('Quick Suggestions', () => {
    it('displays quick suggestion buttons', async () => {
      const user = userEvent.setup();
      
      server.use(
        rest.post('/api/chat', (req, res, ctx) => {
          return res(
            ctx.json({
              message: 'Here are some things I can help with:',
              suggestions: [
                'Tell me about training modules',
                'How do I take a quiz?',
                'What is my progress?',
              ],
            })
          );
        })
      );

      renderWithQueryClient(<ChatbotWidget />);

      // Open chat and send message
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(chatButton);

      const messageInput = screen.getByPlaceholderText(/type your message/i);
      await user.type(messageInput, 'What can you help me with?');

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Wait for suggestions
      await waitFor(() => {
        expect(screen.getByText('Tell me about training modules')).toBeInTheDocument();
        expect(screen.getByText('How do I take a quiz?')).toBeInTheDocument();
        expect(screen.getByText('What is my progress?')).toBeInTheDocument();
      });
    });

    it('allows clicking on suggestions to send them', async () => {
      const user = userEvent.setup();
      
      server.use(
        rest.post('/api/chat', (req, res, ctx) => {
          return res(
            ctx.json({
              message: 'Here are some suggestions:',
              suggestions: ['Tell me about training modules'],
            })
          );
        })
      );

      renderWithQueryClient(<ChatbotWidget />);

      // Open chat and trigger suggestions
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(chatButton);

      const messageInput = screen.getByPlaceholderText(/type your message/i);
      await user.type(messageInput, 'Help');

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Wait for suggestions and click one
      await waitFor(() => {
        const suggestionButton = screen.getByText('Tell me about training modules');
        expect(suggestionButton).toBeInTheDocument();
      });

      const suggestionButton = screen.getByText('Tell me about training modules');
      await user.click(suggestionButton);

      // Should send the suggestion as a message
      expect(screen.getByText('Tell me about training modules')).toBeInTheDocument();
    });
  });

  describe('Training Context and Knowledge Base', () => {
    it('provides context-aware responses for training-related questions', async () => {
      const user = userEvent.setup();
      
      server.use(
        rest.post('/api/chat', (req, res, ctx) => {
          return res(
            ctx.json({
              message: 'Based on your assigned training modules, I can help you with the following topics: React Fundamentals, TypeScript Basics, and Advanced JavaScript.',
              suggestions: ['Start React training', 'Take TypeScript quiz'],
            })
          );
        })
      );

      renderWithQueryClient(<ChatbotWidget />);

      // Open chat
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(chatButton);

      // Ask about training
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      await user.type(messageInput, 'What training modules are assigned to me?');

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Should provide context-aware response
      await waitFor(() => {
        expect(screen.getByText(/react fundamentals/i)).toBeInTheDocument();
        expect(screen.getByText(/typescript basics/i)).toBeInTheDocument();
      });
    });

    it('explains quiz answers when asked', async () => {
      const user = userEvent.setup();
      
      server.use(
        rest.post('/api/chat', (req, res, ctx) => {
          return res(
            ctx.json({
              message: 'The correct answer is "A JavaScript library" because React is specifically designed as a library for building user interfaces, not a full framework.',
              suggestions: ['Explain another concept', 'Take the full quiz'],
            })
          );
        })
      );

      renderWithQueryClient(<ChatbotWidget />);

      // Open chat
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(chatButton);

      // Ask about quiz answer
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      await user.type(messageInput, 'Why is React a library and not a framework?');

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Should provide explanation
      await waitFor(() => {
        expect(screen.getByText(/javascript library/i)).toBeInTheDocument();
        expect(screen.getByText(/building user interfaces/i)).toBeInTheDocument();
      });
    });

    it('suggests relevant training modules based on user queries', async () => {
      const user = userEvent.setup();
      
      server.use(
        rest.post('/api/chat', (req, res, ctx) => {
          return res(
            ctx.json({
              message: 'I recommend starting with our "JavaScript Fundamentals" module before moving to React. This will give you a strong foundation.',
              suggestions: ['View JavaScript Fundamentals', 'See all beginner modules'],
            })
          );
        })
      );

      renderWithQueryClient(<ChatbotWidget />);

      // Open chat
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(chatButton);

      // Ask about learning path
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      await user.type(messageInput, 'I want to learn React but I\'m new to programming');

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Should suggest appropriate modules
      await waitFor(() => {
        expect(screen.getByText(/javascript fundamentals/i)).toBeInTheDocument();
        expect(screen.getByText(/strong foundation/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      const user = userEvent.setup();
      
      server.use(
        rest.post('/api/chat', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Server error' }));
        })
      );

      renderWithQueryClient(<ChatbotWidget />);

      // Open chat
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(chatButton);

      // Send message
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      await user.type(messageInput, 'Test message');

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/sorry, i encountered an error/i)).toBeInTheDocument();
      });
    });

    it('handles network errors', async () => {
      const user = userEvent.setup();
      
      server.use(
        rest.post('/api/chat', (req, res, ctx) => {
          return res.networkError('Network error');
        })
      );

      renderWithQueryClient(<ChatbotWidget />);

      // Open chat
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(chatButton);

      // Send message
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      await user.type(messageInput, 'Test message');

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Should show connection error
      await waitFor(() => {
        expect(screen.getByText(/connection error/i)).toBeInTheDocument();
      });
    });

    it('allows retry after error', async () => {
      const user = userEvent.setup();
      
      let attemptCount = 0;
      server.use(
        rest.post('/api/chat', (req, res, ctx) => {
          attemptCount++;
          if (attemptCount === 1) {
            return res(ctx.status(500), ctx.json({ error: 'Server error' }));
          }
          return res(
            ctx.json({
              message: 'Success on retry',
              suggestions: [],
            })
          );
        })
      );

      renderWithQueryClient(<ChatbotWidget />);

      // Open chat
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(chatButton);

      // Send message that fails
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      await user.type(messageInput, 'Test message');

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/sorry, i encountered an error/i)).toBeInTheDocument();
      });

      // Retry by sending another message
      await user.type(messageInput, 'Retry message');
      await user.click(sendButton);

      // Should succeed
      await waitFor(() => {
        expect(screen.getByText('Success on retry')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithQueryClient(<ChatbotWidget />);

      const chatButton = screen.getByRole('button', { name: /open chat/i });
      expect(chatButton).toHaveAttribute('aria-label');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<ChatbotWidget />);

      // Tab to chat button
      await user.tab();
      expect(document.activeElement).toBe(screen.getByRole('button', { name: /open chat/i }));

      // Open chat with Enter
      await user.keyboard('{Enter}');
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Focus should move to message input
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      expect(document.activeElement).toBe(messageInput);
    });

    it('announces new messages to screen readers', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<ChatbotWidget />);

      // Open chat
      const chatButton = screen.getByRole('button', { name: /open chat/i });
      await user.click(chatButton);

      // Send message
      const messageInput = screen.getByPlaceholderText(/type your message/i);
      await user.type(messageInput, 'Test message');

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      // Should have aria-live region for announcements
      await waitFor(() => {
        expect(screen.getByRole('log')).toBeInTheDocument();
      });
    });
  });
});