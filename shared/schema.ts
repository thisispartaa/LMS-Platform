import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "trainer", "employee"]);
export const learningStageEnum = pgEnum("learning_stage", ["onboarding", "foundational", "intermediate", "advanced"]);
export const moduleStatusEnum = pgEnum("module_status", ["draft", "published", "archived"]);
export const quizTypeEnum = pgEnum("quiz_type", ["multiple_choice", "true_false"]);
export const fileTypeEnum = pgEnum("file_type", ["pdf", "docx", "video"]);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default("employee"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  fileName: varchar("file_name").notNull(),
  originalName: varchar("original_name").notNull(),
  fileType: fileTypeEnum("file_type").notNull(),
  filePath: varchar("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  aiSummary: text("ai_summary"),
  keyTopics: jsonb("key_topics").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Training modules table
export const trainingModules = pgTable("training_modules", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  learningStage: learningStageEnum("learning_stage").notNull(),
  status: moduleStatusEnum("status").notNull().default("draft"),
  documentId: integer("document_id").references(() => documents.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  aiGenerated: boolean("ai_generated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quiz questions table
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => trainingModules.id),
  questionText: text("question_text").notNull(),
  questionType: quizTypeEnum("question_type").notNull(),
  options: jsonb("options").$type<string[]>(),
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User module assignments table
export const userModuleAssignments = pgTable("user_module_assignments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  moduleId: integer("module_id").notNull().references(() => trainingModules.id),
  assignedBy: varchar("assigned_by").notNull().references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  isCompleted: boolean("is_completed").default(false),
});

// Quiz results table
export const quizResults = pgTable("quiz_results", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  moduleId: integer("module_id").notNull().references(() => trainingModules.id),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  answers: jsonb("answers").$type<Record<string, string>>(),
  completedAt: timestamp("completed_at").defaultNow(),
});

// Email notification templates table
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  subject: varchar("subject").notNull(),
  body: text("body").notNull(),
  variables: jsonb("variables").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat messages table for chatbot
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  response: text("response").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  trainingModules: many(trainingModules),
  assignments: many(userModuleAssignments, { relationName: "userAssignments" }),
  assignedModules: many(userModuleAssignments, { relationName: "assignedByUser" }),
  quizResults: many(quizResults),
  chatMessages: many(chatMessages),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  uploadedBy: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
  trainingModules: many(trainingModules),
}));

export const trainingModulesRelations = relations(trainingModules, ({ one, many }) => ({
  document: one(documents, {
    fields: [trainingModules.documentId],
    references: [documents.id],
  }),
  createdBy: one(users, {
    fields: [trainingModules.createdBy],
    references: [users.id],
  }),
  quizQuestions: many(quizQuestions),
  assignments: many(userModuleAssignments),
  quizResults: many(quizResults),
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  module: one(trainingModules, {
    fields: [quizQuestions.moduleId],
    references: [trainingModules.id],
  }),
}));

export const userModuleAssignmentsRelations = relations(userModuleAssignments, ({ one }) => ({
  user: one(users, {
    fields: [userModuleAssignments.userId],
    references: [users.id],
    relationName: "userAssignments",
  }),
  module: one(trainingModules, {
    fields: [userModuleAssignments.moduleId],
    references: [trainingModules.id],
  }),
  assignedBy: one(users, {
    fields: [userModuleAssignments.assignedBy],
    references: [users.id],
    relationName: "assignedByUser",
  }),
}));

export const quizResultsRelations = relations(quizResults, ({ one }) => ({
  user: one(users, {
    fields: [quizResults.userId],
    references: [users.id],
  }),
  module: one(trainingModules, {
    fields: [quizResults.moduleId],
    references: [trainingModules.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertTrainingModuleSchema = createInsertSchema(trainingModules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({
  id: true,
  createdAt: true,
}).extend({
  order: z.number().optional(),
});

export const insertUserModuleAssignmentSchema = createInsertSchema(userModuleAssignments).omit({
  id: true,
  assignedAt: true,
  completedAt: true,
});

export const insertQuizResultSchema = createInsertSchema(quizResults).omit({
  id: true,
  completedAt: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type TrainingModule = typeof trainingModules.$inferSelect;
export type InsertTrainingModule = z.infer<typeof insertTrainingModuleSchema>;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type UserModuleAssignment = typeof userModuleAssignments.$inferSelect;
export type InsertUserModuleAssignment = z.infer<typeof insertUserModuleAssignmentSchema>;
export type QuizResult = typeof quizResults.$inferSelect;
export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
