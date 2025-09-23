import { GoogleGenerativeAI } from '@google/generative-ai';
import { type Message } from '@/server/db/schema';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_KEY || '');

const SYSTEM_PROMPT = `You are a professional career counselor with extensive experience in career guidance, job market trends, and professional development. Your role is to:

1. Provide thoughtful, personalized career advice
2. Help users explore career options based on their interests and skills
3. Offer guidance on job searching, resume building, and interview preparation
4. Suggest relevant skills to develop and resources for learning
5. Be encouraging and supportive while being realistic about challenges
6. Consider the user's experience level, education, and goals in your responses

Keep your responses concise but comprehensive, and always maintain a professional yet friendly tone.`;

interface GenerateAIResponseParams {
  message: string;
  previousMessages: Message[];
  sessionContext?: {
    title: string;
    summary: string | null;
  };
}

export async function generateAIResponse({
  message,
  previousMessages,
  sessionContext,
}: GenerateAIResponseParams) {
  try {
    // Get the model
    const model = genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    });

    // Build conversation history
    let conversationContext = SYSTEM_PROMPT + '\n\n';
    
    // Add session context if available
    if (sessionContext?.summary) {
      conversationContext += `Previous conversation summary: ${sessionContext.summary}\n\n`;
    }

    // Add previous messages for context (limit to last 10)
    const recentMessages = previousMessages.slice(-10);
    if (recentMessages.length > 0) {
      conversationContext += 'Previous conversation:\n';
      for (const msg of recentMessages) {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        conversationContext += `${role}: ${msg.content}\n`;
      }
      conversationContext += '\n';
    }

    // Add the current message
    conversationContext += `User: ${message}\n`;
    conversationContext += 'Assistant: ';

    // Generate response
    const result = await model.generateContent(conversationContext);
    const response = result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error('No response generated from AI');
    }

    // Gemini doesn't provide token count directly, estimate it
    const estimatedTokens = Math.ceil(text.length / 4);

    return {
      content: text,
      tokens: estimatedTokens,
    };
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    
    // Handle specific Gemini errors
    if (error.message?.includes('API key not valid')) {
      return {
        content: "The Gemini API key is not configured correctly. Please add your API key from Google AI Studio (makersuite.google.com) to continue.",
        tokens: 0,
      };
    }
    
    if (error.message?.includes('quota')) {
      return {
        content: "The AI service has reached its usage limit. Please try again later or check your Google AI Studio quota.",
        tokens: 0,
      };
    }

    // Fallback response for other errors
    return {
      content: "I apologize, but I'm having trouble generating a response right now. Please try again in a moment.",
      tokens: 0,
    };
  }
}

// Function to generate session title from first message
export async function generateSessionTitle(firstMessage: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    });

    const prompt = `Generate a concise 3-5 word title for this career counseling conversation based on the first message. Return only the title, no quotes or punctuation.

User message: ${firstMessage}

Title:`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    return text || 'Career Consultation';
  } catch (error) {
    console.error('Error generating title:', error);
    return 'Career Consultation';
  }
}

// Function to generate session summary
export async function generateSessionSummary(messages: Message[]): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    });

    const conversationText = messages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const prompt = `Summarize this career counseling conversation in 2-3 sentences, focusing on the main topics discussed and any key advice given.

Conversation:
${conversationText}

Summary:`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    return text || '';
  } catch (error) {
    console.error('Error generating summary:', error);
    return '';
  }
}