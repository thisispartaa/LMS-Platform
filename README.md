# LMS Training Platform

## Overview
This Training Platform is an internal AI-powered employee onboarding and training solution designed to improve the learning experience for both new and existing employees. The platform uses GPT-4 to read and understand uploaded documents or videos, generate summaries, create training modules based on a 4-stage learning journey, and produce AI-generated quizzes. It also includes an admin dashboard for managing modules, tracking employee progress, and sending notifications.

## Objectives
- Improve the employee onboarding and training experience.
- Provide AI-generated, role-specific learning paths.
- Automate quiz creation from training content.
- Enable admins to manage, assign, and track training completion efficiently.
- Integrate with SharePoint for file storage and Outlook for email notifications.

## Methodology
1. Gathered requirements and created a detailed BRD in collaboration with the Lead Business Analyst.
2. Generated technical specifications and prompts for MVP creation.
3. Used Replit to build the initial MVP through prompt-based no-code development.
4. Optimized and debugged the generated code using Cursor.
5. Integrated GPT-4 for:
   - Summarizing uploaded files in layman’s terms.
   - Assigning content to relevant modules.
   - Generating multiple-choice and true/false quizzes.
6. Implemented an admin dashboard with module editing, quiz management, completion tracking, and email template editing.
7. Tested workflows from file upload to quiz completion and chatbot interaction.

## Tools and Technologies
- **Frontend:** React, TailwindCSS
- **Backend:** Node.js, Express
- **AI/LLM:** OpenAI GPT-4
- **No-Code/Low-Code Tools:** Replit, Cursor
- **File Handling:** PDF/DOCX parsing, video transcription
- **Integrations:** SharePoint (file access), Outlook API (notifications)
- **Version Control:** Git, GitHub

## Conclusion
The MVP successfully demonstrates the potential of an AI-powered training platform to improve onboarding and continuous learning within the organization. By combining automated content generation, adaptive learning stages, and integrated communication tools, the platform sets a foundation for scalable and personalized employee development. Future enhancements could include SME content approvals, gamification, advanced analytics, and deeper integrations.

## Future Enhancements
- SME-based content approval workflow.
- Gamification features for improved engagement.
- Expanded analytics and reporting dashboards.
- Support for additional file formats and real-time collaboration.

## Repository Structure
```
/src         # Frontend source code
/backend     # Backend APIs and services
/tests       # Unit and integration tests
/docs        # Documentation and design files
```
