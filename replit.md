# Amazech Training Platform

## Overview

This is a comprehensive employee training platform built with a modern full-stack architecture using Express.js, React, TypeScript, and PostgreSQL. The platform provides AI-powered content generation, quiz management, user analytics, and an intelligent chatbot assistant called "AmazeBot."

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight routing library)
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with hot module replacement
- **Development**: Replit-optimized with custom error overlays and cartographer integration

### Backend Architecture
- **Runtime**: Node.js 20 with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple
- **API Design**: RESTful endpoints with consistent error handling
- **File Processing**: Multer for multipart uploads with local file storage

### Database Architecture
- **Primary Database**: PostgreSQL 16 via Neon Database
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Serverless-compatible connection pooling

## Key Components

### Authentication System
- **Provider**: Replit Auth using OpenID Connect
- **Session Storage**: PostgreSQL sessions table with automatic cleanup
- **User Management**: Role-based access control (admin, trainer, employee)
- **Security**: HTTP-only cookies with secure flags and CSRF protection

### File Upload & Processing
- **Storage**: Local filesystem with organized directory structure
- **Supported Formats**: PDF, DOCX, and video files (MP4, AVI, QuickTime)
- **Size Limits**: 100MB maximum file size
- **Processing Pipeline**: AI-powered content analysis and metadata extraction

### AI Integration
- **Provider**: OpenAI GPT-4o for content analysis and generation
- **Document Analysis**: Automatic summarization and topic extraction
- **Quiz Generation**: AI-generated questions with explanations
- **Chatbot**: Intelligent assistant for training support
- **Learning Stage Classification**: Automatic categorization of content difficulty

### Training Module System
- **Content Types**: Document-based modules with AI-enhanced metadata
- **Learning Stages**: Onboarding, foundational, intermediate, and advanced
- **Status Management**: Draft, published, and archived states
- **Assignment System**: User-specific module assignments with progress tracking

### Quiz Management
- **Question Types**: Multiple choice and true/false questions
- **AI Generation**: Automated quiz creation from training content
- **Progress Tracking**: Individual user quiz results and analytics
- **Feedback System**: Explanations for correct and incorrect answers

### Analytics & Reporting
- **Dashboard Metrics**: User engagement, completion rates, and performance analytics
- **Progress Tracking**: Individual and aggregate learning progress
- **Email Notifications**: Automated reminders and assignment notifications

## Data Flow

### Content Creation Flow
1. User uploads training document
2. File is stored locally and processed by AI
3. AI extracts summary, key topics, and suggests learning stage
4. Training module is created with metadata
5. Optional quiz questions are generated automatically
6. Content is reviewed and published

### Learning Flow
1. Modules are assigned to users based on role and learning stage
2. Users access assigned modules through the dashboard
3. Progress is tracked and stored in the database
4. Quizzes are taken and results are recorded
5. Analytics are updated for reporting

### Authentication Flow
1. User accesses the platform
2. Replit Auth redirects to OpenID Connect provider
3. User authenticates and returns with tokens
4. Session is created and stored in PostgreSQL
5. User profile is created or updated in the database

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **openai**: AI content generation and analysis
- **multer**: File upload handling
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

### Development Dependencies
- **vite**: Frontend build tool and development server
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Production build bundling
- **tailwindcss**: Utility-first CSS framework

### Replit-Specific Dependencies
- **@replit/vite-plugin-runtime-error-modal**: Enhanced error reporting
- **@replit/vite-plugin-cartographer**: Development tooling integration

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20, Web, and PostgreSQL 16 modules
- **Hot Reload**: Vite development server with HMR
- **Database**: Managed PostgreSQL instance with automatic provisioning
- **Port Configuration**: Internal port 5000 mapped to external port 80

### Production Build
- **Frontend**: Vite build with static asset optimization
- **Backend**: esbuild bundle with external package handling
- **Assets**: Static files served from Express with proper caching headers
- **Database**: Production PostgreSQL with connection pooling

### Scaling Configuration
- **Deployment Target**: Autoscale deployment on Replit
- **Process Management**: Single Node.js process with clustering capability
- **Session Persistence**: Database-backed sessions for horizontal scaling
- **File Storage**: Local filesystem (can be extended to cloud storage)

## Recent Changes

- July 1, 2025: Fixed Quiz Score Calculation & Validation
  - Resolved over 100% quiz score display issues in admin analytics
  - Added intelligent score detection (percentage vs raw score formats)
  - Implemented validation to cap all scores between 0-100%
  - Fixed calculation logic to handle mixed data formats correctly
  - Enhanced employee dashboard file downloads with meaningful module names
  - Streamlined module viewing to show only AI summary (removed redundant description)
  - Implemented automatic module completion when quiz is submitted
  - Updated quiz score display with trophy badges for completed modules

- June 26, 2025: Fixed Authentication System & Password Setup
  - Resolved session management issues that prevented login persistence
  - Fixed session cookie configuration (secure: false for development)
  - Set temporary password "admin123" for parth.b@amazech.com admin account
  - Confirmed authentication system works with both local and Replit auth
  - Fixed /api/auth/user endpoint to properly return authenticated user data
  - All API endpoints now accessible with proper authentication

- June 25, 2025: Authentication System Overhaul & Code Cleanup
  - Implemented dual authentication system (Replit Auth + Local Auth for invited users)
  - Fixed user ID generation to use proper unique identifiers instead of email addresses
  - Added comprehensive debugging and logging for authentication issues
  - Created dedicated local authentication strategy with passport-local
  - Enhanced landing page with tabbed login interface (Replit Auth vs Employee Login)
  - Cleaned up unused files (Analytics.tsx, UserManagement.tsx) and consolidated components
  - Fixed logout functionality to handle both auth types with proper session clearing
  - Updated database schema to include password field for local authentication
  - Streamlined routing and removed duplicate component references
  - Enhanced error handling and user feedback for login attempts

- June 25, 2025: Employee Dashboard Implementation
  - Created comprehensive employee dashboard for training management
  - Added role-based interface switching (admin vs employee views)
  - Implemented assigned module viewing with progress tracking
  - Added interactive quiz taking with real-time explanations
  - Built document download functionality for training materials
  - Created module completion tracking and statistics
  - Enhanced AmazeBot integration for employee training support
  - Added dynamic answer explanations during quiz taking
  - Implemented progress visualization with completion percentages
  - Built comprehensive training progress analytics for employees

- June 24, 2025: Enhanced training module creation workflow
  - Modified upload flow to analyze content without auto-saving
  - Added "Save as Draft" functionality for manual module creation
  - Implemented 4-step module creation process with AI analysis
  - Added edit, view, and delete capabilities for training modules
  - Fixed foreign key constraint issues for module deletion
  - Created comprehensive module management interface
  - Removed redundant Edit/View buttons from module cards
  - Added Key Topics display in module view and edit dialogs
  - Implemented quiz questions display in Quiz Management tab
  - Made quiz questions editable with save functionality
  - Updated user role to admin for parth.b@amazech.com
  - Fixed Settings tab by commenting out Email Templates section

## Changelog

- June 24, 2025: Initial setup
- June 24, 2025: Enhanced module creation and management features

## User Preferences

Preferred communication style: Simple, everyday language.