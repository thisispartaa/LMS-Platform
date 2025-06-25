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

- June 25, 2025: Enhanced AmazeBot functionality and chat interface
  - Fixed chat message ordering to display chronologically (oldest to newest)
  - Enhanced AmazeBot with full database access to training materials
  - Added contextual responses based on user's uploaded documents and modules
  - Implemented proper scrollable chat interface with 500px height
  - Added auto-scroll to bottom for new messages
  - Chat history clears on user logout/refresh for privacy
  - AmazeBot now provides FAQ responses, quiz explanations, and progress feedback
  - Improved message layout with proper text wrapping and spacing

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