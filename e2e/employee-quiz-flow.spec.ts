import { test, expect } from '@playwright/test';

test.describe('Employee Quiz Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock login as employee
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'employee@amazech.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for navigation to employee dashboard
    await expect(page).toHaveURL('/employee-dashboard');
  });

  test('should display assigned training modules', async ({ page }) => {
    // Navigate to employee dashboard
    await page.goto('/employee-dashboard');

    // Verify assigned modules are displayed
    await expect(page.locator('[data-testid="assigned-modules"]')).toBeVisible();
    await expect(page.locator('[data-testid="module-card"]').first()).toBeVisible();

    // Check for module details
    await expect(page.locator('text=React Fundamentals')).toBeVisible();
    await expect(page.locator('text=foundational')).toBeVisible();
    await expect(page.locator('[data-testid="quiz-available-badge"]')).toBeVisible();
  });

  test('should allow employee to start and complete a quiz', async ({ page }) => {
    // Navigate to a specific module
    await page.goto('/employee-dashboard');
    await page.click('[data-testid="module-card"]:has-text("React Fundamentals")');

    // Start the quiz
    await expect(page.locator('[data-testid="start-quiz-button"]')).toBeVisible();
    await page.click('[data-testid="start-quiz-button"]');

    // Wait for quiz interface to load
    await expect(page.locator('[data-testid="quiz-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="question-counter"]')).toContainText('1 of 3');

    // Answer Question 1 (Multiple Choice)
    await expect(page.locator('[data-testid="question-text"]')).toContainText('What is a React component?');
    await page.click('[data-testid="option-0"]'); // Select "A JavaScript function"
    await page.click('[data-testid="next-question-button"]');

    // Answer Question 2 (True/False)
    await expect(page.locator('[data-testid="question-counter"]')).toContainText('2 of 3');
    await expect(page.locator('[data-testid="question-text"]')).toContainText('React uses a virtual DOM for better performance');
    await page.click('[data-testid="option-0"]'); // Select "True"
    await page.click('[data-testid="next-question-button"]');

    // Answer Question 3 (Multiple Choice)
    await expect(page.locator('[data-testid="question-counter"]')).toContainText('3 of 3');
    await expect(page.locator('[data-testid="question-text"]')).toContainText('Which hook is used for state management');
    await page.click('[data-testid="option-1"]'); // Select "useState"
    
    // Submit quiz
    await expect(page.locator('[data-testid="submit-quiz-button"]')).toBeVisible();
    await page.click('[data-testid="submit-quiz-button"]');

    // Verify results page
    await expect(page.locator('[data-testid="quiz-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="score-display"]')).toContainText('100%'); // All correct answers
    await expect(page.locator('[data-testid="pass-message"]')).toBeVisible();
    
    // Check individual question feedback
    await expect(page.locator('[data-testid="question-feedback"]').first()).toContainText('Correct');
    await expect(page.locator('[data-testid="explanation"]').first()).toContainText('React components are JavaScript functions');
  });

  test('should handle incorrect answers and show feedback', async ({ page }) => {
    await page.goto('/employee-dashboard');
    await page.click('[data-testid="module-card"]:has-text("React Fundamentals")');
    await page.click('[data-testid="start-quiz-button"]');

    // Answer Question 1 incorrectly
    await page.click('[data-testid="option-1"]'); // Select wrong answer "A CSS class"
    await page.click('[data-testid="next-question-button"]');

    // Answer Question 2 correctly
    await page.click('[data-testid="option-0"]'); // Select "True"
    await page.click('[data-testid="next-question-button"]');

    // Answer Question 3 incorrectly
    await page.click('[data-testid="option-0"]'); // Select wrong answer "useEffect"
    await page.click('[data-testid="submit-quiz-button"]');

    // Verify results
    await expect(page.locator('[data-testid="score-display"]')).toContainText('33%'); // 1 out of 3 correct
    await expect(page.locator('[data-testid="fail-message"]')).toBeVisible();

    // Check incorrect feedback
    const incorrectFeedback = page.locator('[data-testid="question-feedback"]:has-text("Incorrect")');
    await expect(incorrectFeedback).toHaveCount(2);

    // Verify explanations are shown
    await expect(page.locator('[data-testid="explanation"]').first()).toBeVisible();
    
    // Should show retry option
    await expect(page.locator('[data-testid="retake-quiz-button"]')).toBeVisible();
  });

  test('should allow quiz retake after failure', async ({ page }) => {
    // Complete quiz with failing score first
    await page.goto('/employee-dashboard');
    await page.click('[data-testid="module-card"]:has-text("React Fundamentals")');
    await page.click('[data-testid="start-quiz-button"]');

    // Answer incorrectly to fail
    await page.click('[data-testid="option-1"]'); // Wrong answer
    await page.click('[data-testid="next-question-button"]');
    await page.click('[data-testid="option-1"]'); // Wrong answer
    await page.click('[data-testid="next-question-button"]');
    await page.click('[data-testid="option-0"]'); // Wrong answer
    await page.click('[data-testid="submit-quiz-button"]');

    // Verify failure and retry option
    await expect(page.locator('[data-testid="fail-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="retake-quiz-button"]')).toBeVisible();

    // Retake quiz
    await page.click('[data-testid="retake-quiz-button"]');

    // Verify quiz restarts
    await expect(page.locator('[data-testid="question-counter"]')).toContainText('1 of 3');
    await expect(page.locator('[data-testid="question-text"]')).toContainText('What is a React component?');

    // Answer correctly this time
    await page.click('[data-testid="option-0"]'); // Correct answer
    await page.click('[data-testid="next-question-button"]');
    await page.click('[data-testid="option-0"]'); // Correct answer
    await page.click('[data-testid="next-question-button"]');
    await page.click('[data-testid="option-1"]'); // Correct answer
    await page.click('[data-testid="submit-quiz-button"]');

    // Verify improved results
    await expect(page.locator('[data-testid="score-display"]')).toContainText('100%');
    await expect(page.locator('[data-testid="pass-message"]')).toBeVisible();
  });

  test('should show quiz progress and save state', async ({ page }) => {
    await page.goto('/employee-dashboard');
    await page.click('[data-testid="module-card"]:has-text("React Fundamentals")');
    await page.click('[data-testid="start-quiz-button"]');

    // Answer first question
    await page.click('[data-testid="option-0"]');
    await page.click('[data-testid="next-question-button"]');

    // Verify progress
    await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('aria-valuenow', '67'); // 2 of 3 questions

    // Navigate away and back (simulating interruption)
    await page.goto('/employee-dashboard');
    await page.click('[data-testid="module-card"]:has-text("React Fundamentals")');

    // Should show option to resume quiz
    await expect(page.locator('[data-testid="resume-quiz-button"]')).toBeVisible();
    await page.click('[data-testid="resume-quiz-button"]');

    // Should resume from question 2
    await expect(page.locator('[data-testid="question-counter"]')).toContainText('2 of 3');
  });

  test('should track completion status across modules', async ({ page }) => {
    // Complete one quiz
    await page.goto('/employee-dashboard');
    await page.click('[data-testid="module-card"]:has-text("React Fundamentals")');
    await page.click('[data-testid="start-quiz-button"]');

    // Complete quiz successfully
    await page.click('[data-testid="option-0"]');
    await page.click('[data-testid="next-question-button"]');
    await page.click('[data-testid="option-0"]');
    await page.click('[data-testid="next-question-button"]');
    await page.click('[data-testid="option-1"]');
    await page.click('[data-testid="submit-quiz-button"]');

    // Return to dashboard
    await page.click('[data-testid="return-to-dashboard"]');

    // Verify module shows as completed
    const completedModule = page.locator('[data-testid="module-card"]:has-text("React Fundamentals")');
    await expect(completedModule.locator('[data-testid="completion-badge"]')).toBeVisible();
    await expect(completedModule.locator('[data-testid="score-badge"]')).toContainText('100%');

    // Check overall progress
    await expect(page.locator('[data-testid="overall-progress"]')).toContainText('1 of');
    await expect(page.locator('[data-testid="completion-percentage"]')).toBeVisible();
  });

  test('should integrate with AmazeBot for quiz help', async ({ page }) => {
    await page.goto('/employee-dashboard');

    // Open chatbot
    await page.click('[data-testid="chatbot-toggle"]');
    await expect(page.locator('[data-testid="chatbot-widget"]')).toBeVisible();

    // Ask for help with quiz
    await page.fill('[data-testid="chat-input"]', 'I need help with the React quiz');
    await page.click('[data-testid="send-message"]');

    // Wait for bot response
    await expect(page.locator('[data-testid="bot-message"]').last()).toContainText('React');
    await expect(page.locator('[data-testid="suggestion-button"]:has-text("Start React quiz")')).toBeVisible();

    // Click suggestion to start quiz
    await page.click('[data-testid="suggestion-button"]:has-text("Start React quiz")');

    // Should navigate to quiz
    await expect(page.locator('[data-testid="quiz-container"]')).toBeVisible();
  });

  test('should handle time limits and auto-submission', async ({ page }) => {
    // Mock a quiz with time limit
    await page.route('/api/modules/*/quiz/start', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          quizId: 'test-quiz-1',
          timeLimit: 5, // 5 seconds for testing
          questions: [
            {
              id: 1,
              questionText: 'Test question?',
              questionType: 'multiple_choice',
              options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
            },
          ],
        }),
      });
    });

    await page.goto('/employee-dashboard');
    await page.click('[data-testid="module-card"]:has-text("Timed Quiz")');
    await page.click('[data-testid="start-quiz-button"]');

    // Verify timer is displayed
    await expect(page.locator('[data-testid="quiz-timer"]')).toBeVisible();
    await expect(page.locator('[data-testid="time-remaining"]')).toContainText('5:00');

    // Wait for auto-submission (timer should count down)
    await expect(page.locator('[data-testid="time-remaining"]')).toContainText('0:00', { timeout: 6000 });

    // Should auto-submit and show results
    await expect(page.locator('[data-testid="quiz-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="timeout-message"]')).toContainText('time expired');
  });

  test('should provide accessibility features', async ({ page }) => {
    await page.goto('/employee-dashboard');
    await page.click('[data-testid="module-card"]:has-text("React Fundamentals")');
    await page.click('[data-testid="start-quiz-button"]');

    // Check for accessibility features
    await expect(page.locator('[data-testid="quiz-container"]')).toHaveAttribute('role', 'main');
    await expect(page.locator('[data-testid="question-text"]')).toHaveAttribute('role', 'heading');

    // Verify keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="option-0"]')).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(page.locator('[data-testid="option-1"]')).toBeFocused();

    // Verify screen reader announcements
    await expect(page.locator('[aria-live="polite"]')).toBeVisible();

    // Test high contrast mode
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addStyleTag({ content: '@media (prefers-contrast: high) { .quiz-option { border: 2px solid black; } }' });
    
    // Verify reduced motion preferences are respected
    await expect(page.locator('[data-testid="quiz-container"]')).toHaveCSS('animation-duration', '0s');
  });

  test('should handle network interruptions gracefully', async ({ page }) => {
    await page.goto('/employee-dashboard');
    await page.click('[data-testid="module-card"]:has-text("React Fundamentals")');
    await page.click('[data-testid="start-quiz-button"]');

    // Answer first question
    await page.click('[data-testid="option-0"]');

    // Simulate network failure
    await page.route('**/api/**', (route) => {
      route.abort('failed');
    });

    await page.click('[data-testid="next-question-button"]');

    // Should show offline message
    await expect(page.locator('[data-testid="offline-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

    // Restore network
    await page.unroute('**/api/**');

    // Retry should work
    await page.click('[data-testid="retry-button"]');
    await expect(page.locator('[data-testid="question-counter"]')).toContainText('2 of 3');
  });
});