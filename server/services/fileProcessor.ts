import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { analyzeDocument } from "./openai";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, "");
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "video/mp4",
      "video/avi",
      "video/quicktime",
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

export function getFileType(mimetype: string): "pdf" | "docx" | "video" {
  if (mimetype === "application/pdf") return "pdf";
  if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimetype === "application/msword"
  ) {
    return "docx";
  }
  return "video";
}

// Extract text content from uploaded files
export async function extractTextContent(filePath: string, fileType: "pdf" | "docx" | "video"): Promise<string> {
  try {
    switch (fileType) {
      case "pdf":
        return await extractPDFText(filePath);
      case "docx":
        return await extractDOCXText(filePath);
      case "video":
        // For video files, we'll return basic metadata
        // In a real implementation, you might use speech-to-text services
        return await extractVideoMetadata(filePath);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error(`Error extracting content from ${fileType} file:`, error);
    throw new Error(`Failed to extract content from ${fileType} file`);
  }
}

async function extractPDFText(filePath: string): Promise<string> {
  try {
    const pdf = require('pdf-parse');
    const fs = require('fs');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text || 'No text content found in PDF';
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return 'PDF text extraction failed. Please ensure the file is a valid PDF.';
  }
}

async function extractDOCXText(filePath: string): Promise<string> {
  try {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || 'No text content found in DOCX';
  } catch (error) {
    console.error('Error extracting DOCX text:', error);
    return 'DOCX text extraction failed. Please ensure the file is a valid Word document.';
  }
}

async function extractVideoMetadata(filePath: string): Promise<string> {
  // For video files, you might extract metadata and use speech-to-text
  // For now, we'll return basic file information
  const stats = await fs.stat(filePath);
  const fileName = path.basename(filePath);
  return `Video file: ${fileName}. Size: ${stats.size} bytes. Video content analysis would require speech-to-text processing or manual transcription. This is a training video file that contains visual and audio content.`;
}

export async function processUploadedFile(
  filePath: string,
  originalName: string,
  fileType: "pdf" | "docx" | "video"
): Promise<{
  content: string;
  analysis: {
    summary: string;
    keyTopics: string[];
    learningStage: "onboarding" | "foundational" | "intermediate" | "advanced";
    suggestedTitle: string;
  };
}> {
  try {
    // Extract text content from the file
    const content = await extractTextContent(filePath, fileType);
    
    // Analyze the content using OpenAI
    const analysis = await analyzeDocument(content, originalName);
    
    return {
      content,
      analysis,
    };
  } catch (error) {
    console.error("Error processing uploaded file:", error);
    throw new Error("Failed to process uploaded file");
  }
}

// Clean up temporary files
export async function cleanupFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error("Error cleaning up file:", error);
    // Don't throw error for cleanup failures
  }
}
