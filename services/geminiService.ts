
import { GoogleGenAI, Type } from "@google/genai";

function cleanJsonResponse(text: string): string {
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    cleaned = cleaned.substring(start, end + 1);
  }
  return cleaned;
}

async function ensureApiKey() {
  const aistudio = (window as any).aistudio;
  if (aistudio && !(await aistudio.hasSelectedApiKey())) {
    await aistudio.openSelectKey();
  }
}

export async function generateTrainingProgram(category: string, focus: string) {
  try {
    // Ensure API key is selected before making call
    await ensureApiKey();
    // Create new instance to use the most recent API key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Upgraded to gemini-3-pro-preview for advanced reasoning in training plans
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Eres un entrenador de fútbol Pro. Crea un plan semanal para categoría ${category}. Enfoque: ${focus}.`,
      config: {
        responseMimeType: "application/json",
        // Using responseSchema for better structured output reliability
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sessions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING },
                  title: { type: Type.STRING },
                  activities: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  duration: { type: Type.STRING }
                },
                required: ["day", "title", "activities", "duration"]
              }
            }
          },
          required: ["sessions"]
        }
      }
    });

    const text = response.text || "";
    const cleanedText = cleanJsonResponse(text);
    return JSON.parse(cleanedText);
  } catch (error: any) {
    console.error("Gemini Error:", error);
    // Handle API key selection reset if requested entity not found
    if (error.message?.includes("Requested entity was not found") || error.message?.includes("API key")) {
      const aistudio = (window as any).aistudio;
      if (aistudio) await aistudio.openSelectKey();
    }
    throw new Error("La IA está ocupada o requiere verificar la API Key.");
  }
}

export async function analyzeFinancialState(transactions: any[]) {
  try {
    // Ensure API key is selected before making call
    await ensureApiKey();
    // Create new instance right before making an API call to ensure it always uses the most up-to-date API key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const summary = JSON.stringify(transactions.slice(-10));
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza estas finanzas y da 3 consejos cortos: ${summary}`,
    });
    // Accessing .text property directly as per guidelines
    return response.text;
  } catch (error: any) {
    console.error("Financial analysis error:", error);
    // Handle API key selection reset if requested entity not found or key issues occur
    if (error.message?.includes("Requested entity was not found") || error.message?.includes("API key")) {
      const aistudio = (window as any).aistudio;
      if (aistudio) await aistudio.openSelectKey();
    }
    return "Análisis no disponible actualmente.";
  }
}
