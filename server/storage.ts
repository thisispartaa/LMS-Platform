import {
  users,
  documents,
  trainingModules,
  quizQuestions,
  userModuleAssignments,
  quizResults,
  emailTemplates,
  chatMessages,
  type User,
  type UpsertUser,
  type Document,
  type InsertDocument,
  type TrainingModule,
  type InsertTrainingModule,
  type QuizQuestion,
  type InsertQuizQuestion,
  type UserModuleAssignment,
  type InsertUserModuleAssignment,
  type QuizResult,
  type InsertQuizResult,
  type EmailTemplate,
  type InsertEmailTemplate,
  type ChatMessage,
  type InsertChatMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, avg, getTableColumns } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  createUser(user: any): Promise<User>;
  updateUser(id: string, updates: any): Promise<User>;
  
  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentsByUser(userId: string): Promise<Document[]>;
  updateDocumentAIData(id: number, summary: string, keyTopics: string[]): Promise<void>;
  
  // Training module operations
  createTrainingModule(module: InsertTrainingModule): Promise<TrainingModule>;
  getTrainingModule(id: number): Promise<TrainingModule | undefined>;
  getTrainingModules(): Promise<TrainingModule[]>;
  getTrainingModulesByStage(stage: string): Promise<TrainingModule[]>;
  updateTrainingModule(id: number, updates: Partial<InsertTrainingModule>): Promise<TrainingModule>;
  deleteTrainingModule(id: number): Promise<void>;
  
  // Quiz operations
  createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;
  getQuizQuestionsByModule(moduleId: number): Promise<QuizQuestion[]>;
  updateQuizQuestion(id: number, updates: Partial<InsertQuizQuestion>): Promise<QuizQuestion>;
  deleteQuizQuestion(id: number): Promise<void>;
  
  // Assignment operations
  assignModuleToUser(assignment: InsertUserModuleAssignment): Promise<UserModuleAssignment>;
  getUserAssignments(userId: string): Promise<UserModuleAssignment[]>;
  getModuleAssignments(moduleId: number): Promise<UserModuleAssignment[]>;
  completeAssignment(userId: string, moduleId: number): Promise<void>;
  removeAssignment(userId: string, moduleId: number): Promise<void>;
  
  // Quiz result operations
  createQuizResult(result: InsertQuizResult): Promise<QuizResult>;
  getUserQuizResults(userId: string): Promise<QuizResult[]>;
  getModuleQuizResults(moduleId: number): Promise<QuizResult[]>;
  
  // Email template operations
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  getEmailTemplates(): Promise<EmailTemplate[]>;
  updateEmailTemplate(id: number, updates: Partial<InsertEmailTemplate>): Promise<EmailTemplate>;
  
  // Chat operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getUserChatHistory(userId: string, limit?: number): Promise<ChatMessage[]>;
  clearUserChatHistory(userId: string): Promise<void>;
  
  // Analytics operations
  getDashboardStats(): Promise<{
    totalModules: number;
    activeUsers: number;
    completedQuizzes: number;
    averageScore: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(userData: any): Promise<User> {
    console.log('Creating user with data:', userData);
    
    const [created] = await db
      .insert(users)
      .values({
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        profileImageUrl: null,
        password: userData.password
      } as any)
      .returning();
      
    console.log('Created user:', created);
    return created;
  }

  async updateUser(id: string, updates: any): Promise<User> {
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  // Document operations
  async createDocument(document: InsertDocument): Promise<Document> {
    const [created] = await db.insert(documents).values({
      ...document,
      keyTopics: document.keyTopics || []
    } as any).returning();
    return created;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async getDocumentsByUser(userId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.uploadedBy, userId));
  }

  async updateDocumentAIData(id: number, summary: string, keyTopics: string[]): Promise<void> {
    await db
      .update(documents)
      .set({ aiSummary: summary, keyTopics })
      .where(eq(documents.id, id));
  }

  // Training module operations
  async createTrainingModule(module: InsertTrainingModule): Promise<TrainingModule> {
    const [created] = await db.insert(trainingModules).values(module).returning();
    return created;
  }

  async getTrainingModule(id: number): Promise<TrainingModule | undefined> {
    const [module] = await db
      .select({
        ...getTableColumns(trainingModules),
        document: {
          id: documents.id,
          keyTopics: documents.keyTopics,
          aiSummary: documents.aiSummary,
        }
      })
      .from(trainingModules)
      .leftJoin(documents, eq(trainingModules.documentId, documents.id))
      .where(eq(trainingModules.id, id));
    return module;
  }

  async getTrainingModules(): Promise<TrainingModule[]> {
    return await db
      .select({
        ...getTableColumns(trainingModules),
        document: {
          id: documents.id,
          keyTopics: documents.keyTopics,
          aiSummary: documents.aiSummary,
        }
      })
      .from(trainingModules)
      .leftJoin(documents, eq(trainingModules.documentId, documents.id))
      .orderBy(desc(trainingModules.createdAt));
  }

  async getTrainingModulesByStage(stage: string): Promise<TrainingModule[]> {
    return await db
      .select()
      .from(trainingModules)
      .where(eq(trainingModules.learningStage, stage as any))
      .orderBy(desc(trainingModules.createdAt));
  }

  async updateTrainingModule(id: number, updates: Partial<InsertTrainingModule>): Promise<TrainingModule> {
    const [updated] = await db
      .update(trainingModules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(trainingModules.id, id))
      .returning();
    return updated;
  }

  async deleteTrainingModule(id: number): Promise<void> {
    // First delete all quiz questions associated with this module
    await db.delete(quizQuestions).where(eq(quizQuestions.moduleId, id));
    
    // Then delete the training module
    await db.delete(trainingModules).where(eq(trainingModules.id, id));
  }

  // Quiz operations
  async createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    const [created] = await db.insert(quizQuestions).values({
      ...question,
      options: question.options || []
    } as any).returning();
    return created;
  }

  async getQuizQuestionsByModule(moduleId: number): Promise<QuizQuestion[]> {
    return await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.moduleId, moduleId))
      .orderBy(quizQuestions.order);
  }

  async updateQuizQuestion(id: number, updates: Partial<InsertQuizQuestion>): Promise<QuizQuestion> {
    const [updated] = await db
      .update(quizQuestions)
      .set(updates as any)
      .where(eq(quizQuestions.id, id))
      .returning();
    return updated;
  }

  async deleteQuizQuestion(id: number): Promise<void> {
    await db.delete(quizQuestions).where(eq(quizQuestions.id, id));
  }

  // Assignment operations
  async assignModuleToUser(assignment: InsertUserModuleAssignment): Promise<UserModuleAssignment> {
    const [created] = await db.insert(userModuleAssignments).values(assignment).returning();
    return created;
  }

  async getUserAssignments(userId: string): Promise<UserModuleAssignment[]> {
    console.log('getUserAssignments called with userId:', userId, typeof userId);
    const result = await db
      .select()
      .from(userModuleAssignments)
      .where(eq(userModuleAssignments.userId, userId))
      .orderBy(desc(userModuleAssignments.assignedAt));
    
    console.log('getUserAssignments result:', result);
    return result;
  }

  async getModuleAssignments(moduleId: number): Promise<UserModuleAssignment[]> {
    return await db
      .select()
      .from(userModuleAssignments)
      .where(eq(userModuleAssignments.moduleId, moduleId));
  }

  async completeAssignment(userId: string, moduleId: number): Promise<void> {
    await db
      .update(userModuleAssignments)
      .set({ isCompleted: true, completedAt: new Date() })
      .where(
        and(
          eq(userModuleAssignments.userId, userId),
          eq(userModuleAssignments.moduleId, moduleId)
        )
      );
  }

  // Quiz result operations
  async createQuizResult(result: InsertQuizResult): Promise<QuizResult> {
    const [created] = await db.insert(quizResults).values(result).returning();
    return created;
  }

  async getUserQuizResults(userId: string): Promise<QuizResult[]> {
    return await db
      .select()
      .from(quizResults)
      .where(eq(quizResults.userId, userId))
      .orderBy(desc(quizResults.completedAt));
  }

  async getModuleQuizResults(moduleId: number): Promise<QuizResult[]> {
    return await db
      .select()
      .from(quizResults)
      .where(eq(quizResults.moduleId, moduleId))
      .orderBy(desc(quizResults.completedAt));
  }

  // Email template operations
  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [created] = await db.insert(emailTemplates).values({
      ...template,
      variables: template.variables || []
    } as any).returning();
    return created;
  }

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).orderBy(emailTemplates.name);
  }

  async updateEmailTemplate(id: number, updates: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
    const [updated] = await db
      .update(emailTemplates)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(emailTemplates.id, id))
      .returning();
    return updated;
  }

  // Chat operations
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [created] = await db.insert(chatMessages).values(message).returning();
    return created;
  }

  async getUserChatHistory(userId: string, limit: number = 20): Promise<ChatMessage[]> {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
    
    // Return messages in chronological order (oldest first, newest last)
    return messages.reverse();
  }

  async clearUserChatHistory(userId: string): Promise<void> {
    await db
      .delete(chatMessages)
      .where(eq(chatMessages.userId, userId));
  }

  // Remove assignment
  async removeAssignment(userId: string, moduleId: number): Promise<void> {
    await db
      .delete(userModuleAssignments)
      .where(
        and(
          eq(userModuleAssignments.userId, userId),
          eq(userModuleAssignments.moduleId, moduleId)
        )
      );
  }

  // Analytics operations
  async getDashboardStats(): Promise<{
    totalModules: number;
    activeUsers: number;
    completedQuizzes: number;
    averageScore: number;
  }> {
    const [moduleCountResult] = await db
      .select({ count: count() })
      .from(trainingModules)
      .where(eq(trainingModules.status, "published"));

    const [userCountResult] = await db
      .select({ count: count() })
      .from(users);

    const [quizCountResult] = await db
      .select({ count: count() })
      .from(quizResults);

    const [averageScoreResult] = await db
      .select({ average: avg(quizResults.score) })
      .from(quizResults);

    return {
      totalModules: moduleCountResult?.count || 0,
      activeUsers: userCountResult?.count || 0,
      completedQuizzes: quizCountResult?.count || 0,
      averageScore: Math.round(Number(averageScoreResult?.average) || 0),
    };
  }

  // User progress analytics
  async getUserProgress(): Promise<any[]> {
    const progressRaw = await db
      .select({
        userId: userModuleAssignments.userId,
        userName: users.firstName,
        userEmail: users.email,
        moduleTitle: trainingModules.title,
        assignedAt: userModuleAssignments.assignedAt,
        completedAt: userModuleAssignments.completedAt,
        rawScore: quizResults.score,
        totalQuestions: quizResults.totalQuestions
      })
      .from(userModuleAssignments)
      .leftJoin(users, eq(userModuleAssignments.userId, users.id))
      .leftJoin(trainingModules, eq(userModuleAssignments.moduleId, trainingModules.id))
      .leftJoin(quizResults, and(
        eq(userModuleAssignments.userId, quizResults.userId),
        eq(userModuleAssignments.moduleId, quizResults.moduleId)
      ))
      .orderBy(userModuleAssignments.assignedAt);

    // Convert to percentage scores with proper validation
    return progressRaw.map(p => {
      let calculatedScore = null;
      
      if (p.rawScore !== null && p.totalQuestions !== null) {
        // Check if the score is already a percentage (score > total questions indicates percentage)
        if (p.rawScore > p.totalQuestions) {
          // Already a percentage, use as-is but cap at 100%
          calculatedScore = Math.min(p.rawScore, 100);
        } else {
          // Raw score, convert to percentage
          calculatedScore = Math.round((p.rawScore / p.totalQuestions) * 100);
        }
        
        // Additional validation: ensure score is between 0-100
        calculatedScore = Math.max(0, Math.min(100, calculatedScore));
      }
      
      return {
        userId: p.userId,
        userName: p.userName,
        userEmail: p.userEmail,
        moduleTitle: p.moduleTitle,
        assignedAt: p.assignedAt,
        completedAt: p.completedAt,
        quizScore: calculatedScore
      };
    });
  }
}

export const storage = new DatabaseStorage();
