import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Admin Upload and Assignment Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'admin@amazech.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    await expect(page).toHaveURL('/dashboard');
  });

  test('should complete full upload to assignment workflow', async ({ page }) => {
    // Navigate to upload page
    await page.goto('/upload-content');

    // Upload a file
    const fileInput = page.locator('input[type="file"]');
    const testFile = path.join(__dirname, '../fixtures/test-document.docx');
    await fileInput.setInputFiles(testFile);

    // Wait for upload and AI analysis
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-analysis-complete"]')).toBeVisible({ timeout: 30000 });

    // Verify AI summary
    await expect(page.locator('[data-testid="ai-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="key-topics"]')).toBeVisible();
    await expect(page.locator('[data-testid="suggested-modules"]')).toBeVisible();

    // Create module from suggestion
    await page.click('[data-testid="create-module-btn"]:first-child');
    
    // Fill module details
    await page.fill('[data-testid="module-title"]', 'Advanced React Patterns');
    await page.selectOption('[data-testid="learning-stage"]', 'advanced');
    await page.fill('[data-testid="module-description"]', 'Learn advanced React patterns and optimization techniques');
    
    await page.click('[data-testid="save-module-btn"]');
    await expect(page.locator('[data-testid="module-created-success"]')).toBeVisible();

    // Navigate to training modules
    await page.goto('/training-modules');
    await expect(page.locator('text=Advanced React Patterns')).toBeVisible();

    // Generate quiz for the module
    const moduleCard = page.locator('[data-testid="module-card"]:has-text("Advanced React Patterns")');
    await moduleCard.locator('[data-testid="generate-quiz-btn"]').click();
    
    await expect(page.locator('[data-testid="quiz-generation-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="quiz-generated-success"]')).toBeVisible({ timeout: 20000 });

    // Review generated questions
    await moduleCard.locator('[data-testid="view-quiz-btn"]').click();
    await expect(page.locator('[data-testid="quiz-questions-list"]')).toBeVisible();
    
    // Verify questions were generated
    const questions = page.locator('[data-testid="quiz-question"]');
    await expect(questions).toHaveCount.toBeGreaterThan(2);

    // Edit a question
    await questions.first().locator('[data-testid="edit-question-btn"]').click();
    await page.fill('[data-testid="question-text-input"]', 'What are the benefits of using React.memo?');
    await page.click('[data-testid="save-question-btn"]');
    await expect(page.locator('text=What are the benefits of using React.memo?')).toBeVisible();

    // Publish the module
    await page.click('[data-testid="publish-module-btn"]');
    await expect(page.locator('[data-testid="module-published-success"]')).toBeVisible();

    // Assign to employees
    await page.click('[data-testid="assign-module-btn"]');
    await expect(page.locator('[data-testid="employee-selection-modal"]')).toBeVisible();

    // Select specific employees
    await page.check('[data-testid="employee-checkbox"]:has-text("John Doe")');
    await page.check('[data-testid="employee-checkbox"]:has-text("Jane Smith")');
    
    await page.click('[data-testid="confirm-assignment-btn"]');
    await expect(page.locator('[data-testid="assignment-success"]')).toContainText('Assigned to 2 employees');
  });

  test('should handle SharePoint file upload', async ({ page }) => {
    await page.goto('/upload-content');

    // Click SharePoint browse button
    await page.click('[data-testid="sharepoint-browse-btn"]');
    await expect(page.locator('[data-testid="sharepoint-modal"]')).toBeVisible();

    // Mock SharePoint file selection
    await page.evaluate(() => {
      // Simulate SharePoint file picker response
      window.postMessage({
        type: 'SHAREPOINT_FILE_SELECTED',
        file: {
          name: 'SharePoint Training.docx',
          url: 'https://sharepoint.com/sites/training/documents/training.docx',
          size: 2500000
        }
      }, '*');
    });

    // Verify file is processed
    await expect(page.locator('[data-testid="processing-sharepoint-file"]')).toBeVisible();
    await expect(page.locator('[data-testid="sharepoint-analysis-complete"]')).toBeVisible({ timeout: 30000 });
  });

  test('should handle bulk module assignment', async ({ page }) => {
    await page.goto('/training-modules');

    // Select multiple modules
    await page.check('[data-testid="module-checkbox"]:first-child');
    await page.check('[data-testid="module-checkbox"]:nth-child(2)');
    
    // Bulk assign action
    await page.click('[data-testid="bulk-assign-btn"]');
    await expect(page.locator('[data-testid="bulk-assignment-modal"]')).toBeVisible();

    // Select learning stage filter
    await page.selectOption('[data-testid="employee-stage-filter"]', 'foundational');
    
    // Select all filtered employees
    await page.click('[data-testid="select-all-filtered-btn"]');
    
    await page.click('[data-testid="confirm-bulk-assignment-btn"]');
    await expect(page.locator('[data-testid="bulk-assignment-success"]')).toBeVisible();
  });

  test('should track assignment progress and completion', async ({ page }) => {
    await page.goto('/analytics');

    // View module completion analytics
    await expect(page.locator('[data-testid="completion-analytics"]')).toBeVisible();
    await expect(page.locator('[data-testid="progress-charts"]')).toBeVisible();

    // Filter by specific module
    await page.selectOption('[data-testid="module-filter"]', 'React Fundamentals');
    
    // Verify completion data
    await expect(page.locator('[data-testid="completion-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="average-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="employee-progress-table"]')).toBeVisible();

    // Export progress report
    await page.click('[data-testid="export-report-btn"]');
    
    // Verify download initiated
    const downloadPromise = page.waitForEvent('download');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('training-progress');
  });

  test('should manage user roles and permissions', async ({ page }) => {
    await page.goto('/user-management');

    // Add new employee
    await page.click('[data-testid="add-user-btn"]');
    await page.fill('[data-testid="user-email"]', 'newemployee@amazech.com');
    await page.fill('[data-testid="user-firstname"]', 'New');
    await page.fill('[data-testid="user-lastname"]', 'Employee');
    await page.selectOption('[data-testid="user-role"]', 'employee');
    
    await page.click('[data-testid="save-user-btn"]');
    await expect(page.locator('text=newemployee@amazech.com')).toBeVisible();

    // Assign training to new user
    const userRow = page.locator('[data-testid="user-row"]:has-text("newemployee@amazech.com")');
    await userRow.locator('[data-testid="assign-training-btn"]').click();
    
    await page.check('[data-testid="training-module"]:has-text("React Fundamentals")');
    await page.click('[data-testid="confirm-training-assignment"]');
    
    await expect(page.locator('[data-testid="assignment-success"]')).toBeVisible();
  });

  test('should handle AI quiz generation errors gracefully', async ({ page }) => {
    // Mock AI service failure
    await page.route('**/api/modules/*/generate-quiz', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'AI service temporarily unavailable' })
      });
    });

    await page.goto('/training-modules');
    
    const moduleCard = page.locator('[data-testid="module-card"]').first();
    await moduleCard.locator('[data-testid="generate-quiz-btn"]').click();

    // Should show error and fallback options
    await expect(page.locator('[data-testid="quiz-generation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="manual-quiz-creation-btn"]')).toBeVisible();
    
    // Try manual quiz creation
    await page.click('[data-testid="manual-quiz-creation-btn"]');
    await expect(page.locator('[data-testid="manual-quiz-editor"]')).toBeVisible();
  });

  test('should validate file types and sizes', async ({ page }) => {
    await page.goto('/upload-content');

    // Try to upload unsupported file type
    const fileInput = page.locator('input[type="file"]');
    const invalidFile = path.join(__dirname, '../fixtures/test-file.txt');
    await fileInput.setInputFiles(invalidFile);

    await expect(page.locator('[data-testid="file-type-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-type-error"]')).toContainText('Unsupported file type');

    // Try to upload oversized file (mock large file)
    await page.evaluate(() => {
      const dataTransfer = new DataTransfer();
      const file = new File(['x'.repeat(200 * 1024 * 1024)], 'large-file.pdf', { type: 'application/pdf' });
      dataTransfer.items.add(file);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      fileInput.files = dataTransfer.files;
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await expect(page.locator('[data-testid="file-size-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-size-error"]')).toContainText('File size exceeds limit');
  });
});