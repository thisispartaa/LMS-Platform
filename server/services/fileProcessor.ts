import multer from "multer";
import path from "path";
import fs from "fs/promises";
import mammoth from "mammoth";
import { nanoid } from "nanoid";
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
    // For now, we'll return a message indicating PDF text extraction needs implementation
    const fileName = path.basename(filePath);
    const stats = await fs.stat(filePath);
    const fileSizeKB = Math.round(stats.size / 1024);
    
    return `PDF Document: ${fileName} (${fileSizeKB}KB)

This PDF file has been uploaded successfully. However, full PDF text extraction requires additional setup. 

For now, please provide the key content or summary of this PDF document manually, or upload the same content as a DOCX file which can be fully processed.

The AI will generate training content based on the filename: "${fileName.replace(/\.(pdf)$/i, '').replace(/[-_]/g, ' ')}"`;
  } catch (error) {
    console.error("Error processing PDF file:", error);
    const fileName = path.basename(filePath);
    return `Training Document: ${fileName}

Error accessing PDF file. Please ensure the file is not corrupted and try uploading again.`;
  }
}

async function extractDOCXText(filePath: string): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    
    if (!result.value || result.value.trim().length === 0) {
      const fileName = path.basename(filePath);
      return `Training Document: ${fileName}

This DOCX file appears to be empty or contain only formatting/images that couldn't be extracted. Please ensure the document contains readable text content.`;
    }
    
    return result.value;
  } catch (error) {
    console.error("Error extracting DOCX text:", error);
    const fileName = path.basename(filePath);
    return `Training Document: ${fileName}

Error reading DOCX content. The file may be corrupted or in an unsupported format.`;
  }
}

async function extractVideoMetadata(filePath: string): Promise<string> {
  // For video files, we'll return metadata since we can't extract speech-to-text
  const stats = await fs.stat(filePath);
  const fileName = path.basename(filePath);
  return `Video Training Content: ${fileName}

This is a video training file containing ${Math.round(stats.size / (1024 * 1024))}MB of content. Video analysis requires speech-to-text processing which is not currently implemented. Please provide a transcript or summary document for this video content.`;
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
