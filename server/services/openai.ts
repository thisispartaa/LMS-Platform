import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface DocumentAnalysis {
  summary: string;
  keyTopics: string[];
  learningStage: "onboarding" | "foundational" | "intermediate" | "advanced";
  suggestedTitle: string;
}

export interface QuizQuestion {
  questionText: string;
  questionType: "multiple_choice" | "true_false";
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export async function analyzeDocument(content: string, fileName: string): Promise<DocumentAnalysis> {
  try {
    let prompt: string;
    
    // Check if this is placeholder/error content or actual document content
    if (content.includes("Please analyze this training document") || 
        content.includes("Error reading PDF content") ||
        content.includes("appears to contain images or non-text content") ||
        content.length < 50) {
      // This is placeholder text or error, generate content based on filename only
      const cleanFileName = fileName.replace(/\.(pdf|docx|doc)$/i, '').replace(/[-_]/g, ' ');
      
      prompt = `
        Create realistic training content based on the document title: "${cleanFileName}"
        
        Generate professional training material that would be appropriate for this topic.
        Provide a JSON response with:
        {
          "summary": "A comprehensive 2-3 paragraph summary based on what this document would likely contain given its title",
          "keyTopics": ["Array of 5-10 realistic key topics this document would cover based on the title"],
          "learningStage": "onboarding|foundational|intermediate|advanced",
          "suggestedTitle": "A professional title for this training module based on the filename"
        }
        
        Make the content professional, realistic, and suitable for corporate training.
      `;
    } else {
      // Process actual document content
      prompt = `
        Analyze the following training document content and provide a comprehensive analysis.
        Document Name: ${fileName}
        
        Content:
        ${content}
        
        Please provide a JSON response with the following structure:
        {
          "summary": "A comprehensive 2-3 paragraph summary of the ACTUAL document content provided above",
          "keyTopics": ["Array of 5-10 key topics actually covered in the document content"],
          "learningStage": "onboarding|foundational|intermediate|advanced",
          "suggestedTitle": "A descriptive title based on the actual content"
        }
        
        For learningStage, use:
        - "onboarding" for basic company policies, introductory material
        - "foundational" for basic technical concepts and fundamental skills
        - "intermediate" for more complex topics requiring some prior knowledge
        - "advanced" for expert-level content and specialized skills
        
        IMPORTANT: Base your analysis STRICTLY on the actual content provided above. Do not make assumptions.
      `;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert training content analyzer. Analyze documents and provide structured insights for creating effective training modules."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      summary: result.summary || "No summary available",
      keyTopics: result.keyTopics || [],
      learningStage: result.learningStage || "foundational",
      suggestedTitle: result.suggestedTitle || fileName,
    };
  } catch (error) {
    console.error("Error analyzing document:", error);
    throw new Error("Failed to analyze document content");
  }
}

export async function generateQuizQuestions(content: string, keyTopics: string[]): Promise<QuizQuestion[]> {
  try {
    const prompt = `
      Based on the following training content and key topics, generate 10-15 quiz questions.
      
      Content Summary: ${content}
      Key Topics: ${keyTopics.join(", ")}
      
      Generate a mix of multiple choice and true/false questions that test understanding of the material.
      
      Please provide a JSON response with the following structure:
      {
        "questions": [
          {
            "questionText": "The question text",
            "questionType": "multiple_choice|true_false",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"] (only for multiple_choice),
            "correctAnswer": "The correct answer",
            "explanation": "Brief explanation of why this is correct"
          }
        ]
      }
      
      For multiple choice questions, provide 4 options.
      For true/false questions, omit the options array and set correctAnswer to "True" or "False".
      Make questions practical and test real understanding, not just memorization.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert quiz designer. Create engaging and educational quiz questions that effectively test understanding of training material."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.questions || [];
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    throw new Error("Failed to generate quiz questions");
  }
}

export async function getChatbotResponse(
  userMessage: string,
  chatHistory: ChatMessage[],
  userId: string,
  storage?: any
): Promise<string> {
  try {
    // Get user's training documents and progress for context
    const storageInstance = storage || (await import("../storage")).storage;
    const userDocuments = await storageInstance.getDocumentsByUser(userId);
    const userModules = await storageInstance.getUserAssignments(userId);
    const allModules = await storageInstance.getTrainingModules();
    
    // Create context from uploaded documents and training modules
    const documentContext = userDocuments.map(doc => 
      `Document: ${doc.originalName}\nSummary: ${doc.summary || doc.aiSummary}\nKey Topics: ${doc.keyTopics?.join(", ") || "None"}`
    ).join("\n\n");

    const moduleContext = allModules.map(module => 
      `Module: ${module.title} (${module.learningStage})\nDescription: ${module.description}\nKey Topics: ${module.keyTopics?.join(", ") || "None"}`
    ).join("\n\n");

    const systemPrompt = `You are AmazeBot, an AI training assistant for the Amazech Training Platform. 
    You help employees with their training by:
    1. Answering questions based on their uploaded training documents
    2. Explaining quiz answers and concepts from their training materials
    3. Providing feedback on training progress
    4. Offering study guidance and learning tips
    
    AVAILABLE TRAINING MODULES:
    ${moduleContext || "No training modules available yet."}
    
    AVAILABLE TRAINING DOCUMENTS:
    ${documentContext || "No training documents uploaded yet."}
    
    USER TRAINING STATUS:
    - Has ${userModules.length} assigned training modules
    - Has access to ${userDocuments.length} training documents
    - Total available modules: ${allModules.length}
    
    Guidelines:
    - Always refer to the specific training materials when answering questions
    - If asked about topics not covered in their training materials, say so clearly
    - Be encouraging and supportive about their learning progress
    - Provide practical examples when explaining concepts
    - Keep responses concise but informative`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory.slice(-10).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.message
      })),
      { role: "user", content: userMessage }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      max_tokens: 800,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't process your request. Please try asking about your training materials or quiz questions.";
  } catch (error) {
    console.error("Error getting chatbot response:", error);
    return "I'm having trouble accessing your training information right now. Please try again in a moment, or contact support if the issue persists.";
  }
}

export async function suggestReviewModules(
  quizScore: number,
  totalQuestions: number,
  moduleTitle: string,
  availableModules: Array<{ id: number; title: string; learningStage: string }>
): Promise<{ shouldReview: boolean; suggestedModules: number[] }> {
  try {
    const scorePercentage = (quizScore / totalQuestions) * 100;
    
    if (scorePercentage >= 80) {
      return { shouldReview: false, suggestedModules: [] };
    }

    const prompt = `
      A user scored ${quizScore} out of ${totalQuestions} (${scorePercentage.toFixed(1)}%) on the quiz for "${moduleTitle}".
      
      Available modules for review:
      ${availableModules.map(m => `ID: ${m.id}, Title: ${m.title}, Stage: ${m.learningStage}`).join("\n")}
      
      Based on the low score, suggest up to 3 relevant modules that would help the user improve their understanding.
      Consider the learning progression and foundational concepts.
      
      Please provide a JSON response:
      {
        "shouldReview": true,
        "suggestedModules": [array of module IDs to review]
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an educational advisor. Suggest relevant review materials based on quiz performance."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      shouldReview: result.shouldReview || false,
      suggestedModules: result.suggestedModules || [],
    };
  } catch (error) {
    console.error("Error suggesting review modules:", error);
    return { shouldReview: false, suggestedModules: [] };
  }
}
