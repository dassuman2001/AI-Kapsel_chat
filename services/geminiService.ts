import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { User, Chat } from "../types";

// Helper to get API key safely
const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env?.API_KEY) {
      return process.env.API_KEY;
    }
    // Fallback for window polyfill if typescript/process definitions conflict
    if (typeof window !== 'undefined' && (window as any).process?.env?.API_KEY) {
      return (window as any).process.env.API_KEY;
    }
  } catch (e) {
    console.warn("Failed to read process.env");
  }
  return '';
};

// Lazy initialization to prevent app crash on load if key is missing temporarily
let aiClient: GoogleGenAI | null = null;

const getAI = () => {
  if (aiClient) return aiClient;
  
  const key = getApiKey();
  if (!key) {
    console.error("Gemini API Key is missing.");
    return null;
  }
  
  try {
    aiClient = new GoogleGenAI({ apiKey: key });
    return aiClient;
  } catch (error) {
    console.error("Failed to initialize Gemini Client:", error);
    return null;
  }
};

// --- Function Declarations for the AI ---

const navigateToChatTool: FunctionDeclaration = {
  name: 'navigateToChat',
  description: 'Open a chat window with a specific user by finding their name or mobile number.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'The name or mobile number of the user to chat with.'
      }
    },
    required: ['query']
  }
};

const sendMessageTool: FunctionDeclaration = {
  name: 'sendMessage',
  description: 'Send a message to a user. Must be used after finding a user or specifying one.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      recipientQuery: {
        type: Type.STRING,
        description: 'Name or mobile of recipient.'
      },
      messageContent: {
        type: Type.STRING,
        description: 'The actual text message content to send.'
      }
    },
    required: ['recipientQuery', 'messageContent']
  }
};

const updateProfileTool: FunctionDeclaration = {
  name: 'updateProfileName',
  description: 'Update the current user\'s profile name.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      newName: {
        type: Type.STRING,
        description: 'The new name for the user.'
      }
    },
    required: ['newName']
  }
};

const appTools = [navigateToChatTool, sendMessageTool, updateProfileTool];

// --- Service Methods ---

export interface AIResponse {
  text: string;
  toolCalls?: Array<{name: string, args: any}>;
}

/**
 * Sends a prompt to Gemini with system instructions to act as "Capsule Assistant".
 * It is aware of the current app context via the system prompt construction.
 */
export const sendToCapsuleAI = async (
  prompt: string, 
  availableUsers: User[]
): Promise<AIResponse> => {
  const ai = getAI();
  if (!ai) {
    return { text: "Configuration Error: API Key is missing. Please check your environment settings." };
  }

  // Create a context string about available users to help the AI resolution
  const userContext = availableUsers.map(u => `${u.name} (${u.mobileNumber})`).join(', ');

  const systemInstruction = `
    You are 'Capsule', an intelligent assistant integrated into the 'Capsule Chat' application.
    You can help users navigate the app, send messages, and manage their profile.
    
    Here is a list of known contacts in the user's phonebook:
    ${userContext}

    If a user asks to "Open John's chat", use the navigateToChat tool with "John".
    If a user asks to "Send hi to Sarah", use the sendMessage tool.
    If the user just wants to chat with you (the AI), just reply with text.
    Be concise, friendly, and futuristic in tone.
  `;

  try {
    const modelId = 'gemini-3-flash-preview'; 
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: appTools }],
        temperature: 0.7,
      }
    });

    const candidate = response.candidates?.[0];
    const text = candidate?.content?.parts?.find(p => p.text)?.text || '';
    
    // Extract function calls if any
    const functionCalls = candidate?.content?.parts
      ?.filter(p => p.functionCall)
      .map(p => ({
        name: p.functionCall!.name,
        args: p.functionCall!.args
      }));

    return {
      text,
      toolCalls: functionCalls
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "I'm having trouble connecting to the neural network right now. Please try again later." };
  }
};