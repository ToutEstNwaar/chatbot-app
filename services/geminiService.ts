import { GoogleGenAI, Chat, Part, GenerateContentResponse } from "@google/genai";
import { Attachment } from '../types';

let ai: GoogleGenAI | null = null;

const getAI = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
}

export const initializeChat = (): Chat => {
    const aiInstance = getAI();
    const systemInstruction = `When answering, format your response like a professional knowledge explainer.
Use clear section titles with emojis/icons, short paragraphs, and bullet points for readability.
Avoid large text blocks.
Include concise explanations, examples, and highlight key terms in bold.
Make it visually clean and logically ordered.
Ensure generous use of whitespace and line breaks for a clean, scannable layout.

Example style:

⚙️ Concept Overview

Brief 1–2 sentence summary.

🧩 Key Components

Component A: short explanation

Component B: short explanation

🚀 Practical Takeaway

1–2 actionable lines.`;

    return aiInstance.chats.create({
        model: 'gemini-flash-latest',
        config: {
            systemInstruction: systemInstruction,
            tools: [{ googleSearch: {} }, { urlContext: {} }],
            thinkingConfig: {
                includeThoughts: true,
                thinkingBudget: -1, // Enable dynamic thinking
            },
        }
    });
};

const base64ToGeminiPart = async (base64Data: string, mimeType: string): Promise<Part> => {
    return {
        inlineData: {
            mimeType,
            data: base64Data.split(',')[1],
        },
    };
};

export const sendMessageToGemini = async (
    chat: Chat,
    prompt: string,
    attachments: Attachment[]
): Promise<GenerateContentResponse> => {
    
    const parts: Part[] = [];

    if (attachments.length > 0) {
        const attachmentParts = await Promise.all(
            attachments.map(att => base64ToGeminiPart(att.data, att.mimeType))
        );
        parts.push(...attachmentParts);
    }
    
    if (prompt) {
        parts.push({ text: prompt });
    }

    if (parts.length === 0) {
        throw new Error("Cannot send an empty message.");
    }

    // FIX: The parts array should be passed inside a `message` property.
    return await chat.sendMessage({ message: parts });
};