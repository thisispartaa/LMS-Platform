import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FileUploader from '@/components/upload/FileUploader';
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

// Helper function to create mock files
const createMockFile = (name: string, type: string, size: number) => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('FileUploader', () => {
  const mockOnUploadComplete = vi.fn();
  const defaultProps = {
    onUploadComplete: mockOnUploadComplete,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('File Selection and Upload', () => {
    it('renders upload interface correctly', () => {
      renderWithQueryClient(<FileUploader {...defaultProps} />);

      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
      expect(screen.getByText(/choose file/i)).toBeInTheDocument();
      expect(screen.getByText(/pdf, docx, mp4/i)).toBeInTheDocument();
    });

    it('allows file selection via file input', async () => {
      const user = userEvent.setup();
      
      // Mock successful upload
      server.use(
        rest.post('/api/upload', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              analysis: {
                summary: 'Test document summary',
                keyTopics: ['Topic 1', 'Topic 2'],
                suggestedModules: [],
              },
              document: {
                id: 1,
                fileName: 'test.docx',
                originalName: 'test.docx',
                fileType: 'docx',
              },
            })
          );
        })
      );

      renderWithQueryClient(<FileUploader {...defaultProps} />);

      const fileInput = screen.getByRole('button', { name: /choose file/i });
      const file = createMockFile('test.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1000000);

      // Simulate file selection
      const hiddenInput = screen.getByLabelText(/file upload/i);
      await user.upload(hiddenInput, file);

      await waitFor(() => {
        expect(mockOnUploadComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            analysis: expect.objectContaining({
              summary: 'Test document summary',
            }),
          })
        );
      });
    });

    it('shows upload progress during file processing', async () => {
      const user = userEvent.setup();
      
      // Mock upload with delay to test progress
      server.use(
        rest.post('/api/upload', async (req, res, ctx) => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return res(
            ctx.json({
              success: true,
              analysis: { summary: 'Test summary', keyTopics: [], suggestedModules: [] },
              document: { id: 1, fileName: 'test.pdf', originalName: 'test.pdf', fileType: 'pdf' },
            })
          );
        })
      );

      renderWithQueryClient(<FileUploader {...defaultProps} />);

      const file = createMockFile('test.pdf', 'application/pdf', 2000000);
      const hiddenInput = screen.getByLabelText(/file upload/i);
      
      await user.upload(hiddenInput, file);

      // Check for processing state
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText(/completed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Drag and Drop', () => {
    it('handles drag over events', async () => {
      renderWithQueryClient(<FileUploader {...defaultProps} />);

      const dropZone = screen.getByText(/drag and drop/i).closest('div');
      
      fireEvent.dragOver(dropZone!, {
        dataTransfer: {
          files: [createMockFile('test.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1000000)],
        },
      });

      expect(dropZone).toHaveClass('border-primary');
    });

    it('handles file drop events', async () => {
      server.use(
        rest.post('/api/upload', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              analysis: { summary: 'Dropped file summary', keyTopics: [], suggestedModules: [] },
              document: { id: 1, fileName: 'dropped.pdf', originalName: 'dropped.pdf', fileType: 'pdf' },
            })
          );
        })
      );

      renderWithQueryClient(<FileUploader {...defaultProps} />);

      const dropZone = screen.getByText(/drag and drop/i).closest('div');
      const file = createMockFile('dropped.pdf', 'application/pdf', 1500000);
      
      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [file],
        },
      });

      await waitFor(() => {
        expect(mockOnUploadComplete).toHaveBeenCalled();
      });
    });

    it('rejects invalid file types via drag and drop', async () => {
      renderWithQueryClient(<FileUploader {...defaultProps} />);

      const dropZone = screen.getByText(/drag and drop/i).closest('div');
      const invalidFile = createMockFile('test.txt', 'text/plain', 1000);
      
      fireEvent.drop(dropZone!, {
        dataTransfer: {
          files: [invalidFile],
        },
      });

      await waitFor(() => {
        expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
      });
    });
  });

  describe('File Validation', () => {
    it('rejects files that are too large', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<FileUploader {...defaultProps} maxFileSize={1 />); // 1MB limit

      const largeFile = createMockFile('large.pdf', 'application/pdf', 2 * 1024 * 1024); // 2MB
      const hiddenInput = screen.getByLabelText(/file upload/i);
      
      await user.upload(hiddenInput, largeFile);

      await waitFor(() => {
        expect(screen.getByText(/file size exceeds/i)).toBeInTheDocument();
      });
    });

    it('rejects unsupported file types', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<FileUploader {...defaultProps} />);

      const unsupportedFile = createMockFile('test.txt', 'text/plain', 1000);
      const hiddenInput = screen.getByLabelText(/file upload/i);
      
      await user.upload(hiddenInput, unsupportedFile);

      await waitFor(() => {
        expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
      });
    });

    it('accepts custom allowed file types', async () => {
      const user = userEvent.setup();
      
      server.use(
        rest.post('/api/upload', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              analysis: { summary: 'Custom type file', keyTopics: [], suggestedModules: [] },
              document: { id: 1, fileName: 'test.txt', originalName: 'test.txt', fileType: 'txt' },
            })
          );
        })
      );

      renderWithQueryClient(
        <FileUploader 
          {...defaultProps} 
          allowedTypes={['text/plain']}
        />
      );

      const textFile = createMockFile('test.txt', 'text/plain', 1000);
      const hiddenInput = screen.getByLabelText(/file upload/i);
      
      await user.upload(hiddenInput, textFile);

      await waitFor(() => {
        expect(mockOnUploadComplete).toHaveBeenCalled();
      });
    });
  });

  describe('Multiple File Upload', () => {
    it('handles multiple file uploads sequentially', async () => {
      const user = userEvent.setup();
      
      server.use(
        rest.post('/api/upload', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              analysis: { summary: 'File summary', keyTopics: [], suggestedModules: [] },
              document: { id: 1, fileName: 'test.pdf', originalName: 'test.pdf', fileType: 'pdf' },
            })
          );
        })
      );

      renderWithQueryClient(<FileUploader {...defaultProps} />);

      const files = [
        createMockFile('test1.pdf', 'application/pdf', 1000000),
        createMockFile('test2.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 1500000),
      ];

      const hiddenInput = screen.getByLabelText(/file upload/i);
      await user.upload(hiddenInput, files);

      // Should show both files processing
      await waitFor(() => {
        expect(screen.getByText('test1.pdf')).toBeInTheDocument();
        expect(screen.getByText('test2.docx')).toBeInTheDocument();
      });
    });

    it('shows individual progress for each file', async () => {
      const user = userEvent.setup();
      
      server.use(
        rest.post('/api/upload', async (req, res, ctx) => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return res(
            ctx.json({
              success: true,
              analysis: { summary: 'File summary', keyTopics: [], suggestedModules: [] },
              document: { id: 1, fileName: 'test.pdf', originalName: 'test.pdf', fileType: 'pdf' },
            })
          );
        })
      );

      renderWithQueryClient(<FileUploader {...defaultProps} />);

      const files = [
        createMockFile('test1.pdf', 'application/pdf', 1000000),
        createMockFile('test2.pdf', 'application/pdf', 1500000),
      ];

      const hiddenInput = screen.getByLabelText(/file upload/i);
      await user.upload(hiddenInput, files);

      // Should show progress bars for each file
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('handles upload API errors gracefully', async () => {
      const user = userEvent.setup();
      
      server.use(
        rest.post('/api/upload', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Upload failed' }));
        })
      );

      renderWithQueryClient(<FileUploader {...defaultProps} />);

      const file = createMockFile('test.pdf', 'application/pdf', 1000000);
      const hiddenInput = screen.getByLabelText(/file upload/i);
      
      await user.upload(hiddenInput, file);

      await waitFor(() => {
        expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('allows retry after upload failure', async () => {
      const user = userEvent.setup();
      
      let attemptCount = 0;
      server.use(
        rest.post('/api/upload', (req, res, ctx) => {
          attemptCount++;
          if (attemptCount === 1) {
            return res(ctx.status(500), ctx.json({ error: 'Upload failed' }));
          }
          return res(
            ctx.json({
              success: true,
              analysis: { summary: 'Retry success', keyTopics: [], suggestedModules: [] },
              document: { id: 1, fileName: 'test.pdf', originalName: 'test.pdf', fileType: 'pdf' },
            })
          );
        })
      );

      renderWithQueryClient(<FileUploader {...defaultProps} />);

      const file = createMockFile('test.pdf', 'application/pdf', 1000000);
      const hiddenInput = screen.getByLabelText(/file upload/i);
      
      await user.upload(hiddenInput, file);

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByText(/retry/i);
      await user.click(retryButton);

      // Should succeed on retry
      await waitFor(() => {
        expect(mockOnUploadComplete).toHaveBeenCalled();
      });
    });

    it('handles network errors', async () => {
      const user = userEvent.setup();
      
      server.use(
        rest.post('/api/upload', (req, res, ctx) => {
          return res.networkError('Network error');
        })
      );

      renderWithQueryClient(<FileUploader {...defaultProps} />);

      const file = createMockFile('test.pdf', 'application/pdf', 1000000);
      const hiddenInput = screen.getByLabelText(/file upload/i);
      
      await user.upload(hiddenInput, file);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('SharePoint Integration', () => {
    it('shows SharePoint upload option when available', () => {
      renderWithQueryClient(<FileUploader {...defaultProps} />);

      expect(screen.getByText(/sharepoint/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /browse sharepoint/i })).toBeInTheDocument();
    });

    it('handles SharePoint file selection', async () => {
      const user = userEvent.setup();
      
      server.use(
        rest.post('/api/upload/sharepoint', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              analysis: { summary: 'SharePoint file summary', keyTopics: [], suggestedModules: [] },
              document: { id: 1, fileName: 'sharepoint.docx', originalName: 'sharepoint.docx', fileType: 'docx' },
            })
          );
        })
      );

      renderWithQueryClient(<FileUploader {...defaultProps} />);

      const sharepointButton = screen.getByRole('button', { name: /browse sharepoint/i });
      await user.click(sharepointButton);

      // Mock SharePoint file selection (this would normally open a modal)
      // For now, just verify the button works
      expect(sharepointButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithQueryClient(<FileUploader {...defaultProps} />);

      expect(screen.getByLabelText(/file upload/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /choose file/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<FileUploader {...defaultProps} />);

      const chooseFileButton = screen.getByRole('button', { name: /choose file/i });
      chooseFileButton.focus();

      expect(document.activeElement).toBe(chooseFileButton);

      await user.tab();
      const sharepointButton = screen.getByRole('button', { name: /browse sharepoint/i });
      expect(document.activeElement).toBe(sharepointButton);
    });

    it('announces upload status to screen readers', async () => {
      const user = userEvent.setup();
      
      server.use(
        rest.post('/api/upload', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              analysis: { summary: 'File uploaded', keyTopics: [], suggestedModules: [] },
              document: { id: 1, fileName: 'test.pdf', originalName: 'test.pdf', fileType: 'pdf' },
            })
          );
        })
      );

      renderWithQueryClient(<FileUploader {...defaultProps} />);

      const file = createMockFile('test.pdf', 'application/pdf', 1000000);
      const hiddenInput = screen.getByLabelText(/file upload/i);
      
      await user.upload(hiddenInput, file);

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(/completed/i);
      });
    });
  });
});