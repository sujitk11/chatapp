import { GoogleGenerativeAI } from '@google/generative-ai';
import { type Message } from '@/server/db/schema';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_KEY || '');

interface StreamAIResponseOptions {
  message: string;
  previousMessages: Message[];
  sessionContext?: {
    title: string;
    summary?: string | null;
  };
}

export async function* streamAIResponse({
  message,
  previousMessages,
  sessionContext,
}: StreamAIResponseOptions) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    });

    // Build conversation history
    const conversationHistory = previousMessages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Career Counselor'}: ${msg.content}`)
      .join('\n');

    // Create a comprehensive prompt
    const prompt = `You are an experienced career counselor AI assistant. Your role is to provide helpful, empathetic, and professional career guidance.

${sessionContext ? `Session Context: ${sessionContext.title}` : ''}
${sessionContext?.summary ? `Previous Summary: ${sessionContext.summary}` : ''}

${conversationHistory ? `Previous Conversation:\n${conversationHistory}\n` : ''}

User: ${message}

Please provide a helpful, detailed response focusing on career guidance, professional development, and practical advice. Be encouraging and supportive while maintaining professionalism.

Career Counselor:`;

    // Generate streaming response
    const result = await model.generateContentStream(prompt);
    
    let fullText = '';
    let tokenCount = 0;
    
    // Start streaming
    yield { type: 'start' as const };
    
    // Stream each chunk
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        fullText += chunkText;
        tokenCount += Math.ceil(chunkText.length / 4); // Estimate tokens
        yield { 
          type: 'token' as const, 
          content: chunkText 
        };
      }
    }
    
    // End streaming with full content and token count
    yield { 
      type: 'end' as const, 
      fullContent: fullText,
      tokens: tokenCount 
    };
    
  } catch (error) {
    console.error('Streaming AI Error:', error);
    
    // Handle specific errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    yield { type: 'start' as const };
    
    if (errorMessage?.includes('API key not valid')) {
      yield { 
        type: 'error' as const, 
        content: "The Gemini API key is not configured correctly. Please check your configuration." 
      };
    } else if (errorMessage?.includes('quota')) {
      yield { 
        type: 'error' as const, 
        content: "The AI service has reached its usage limit. Please try again later." 
      };
    } else {
      yield { 
        type: 'error' as const, 
        content: "I apologize, but I encountered an error. Please try again." 
      };
    }
    
    yield { type: 'end' as const, fullContent: '', tokens: 0 };
  }
}