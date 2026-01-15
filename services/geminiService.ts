
import { GoogleGenAI, Type } from "@google/genai";

function cleanJsonResponse(text: string): string {
  // Elimina cualquier rastro de ```json o ``` que la IA pueda incluir
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  // Busca el primer '{' y el último '}' por si hay texto extra
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
    await ensureApiKey();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Genera un programa de entrenamiento para fútbol categoría ${category}. Enfoque: ${focus}. 
      Responde SOLO el JSON con esta estructura: 
      { "sessions": [ { "day": "Lunes", "title": "...", "activities": ["...", "..."], "duration": "90 min" } ] }`,
      config: {
        responseMimeType: "application/json",
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
                  activities: { type: Type.ARRAY, items: { type: Type.STRING } },
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
    if (error.message?.includes("entity was not found")) {
      const aistudio = (window as any).aistudio;
      if (aistudio) await aistudio.openSelectKey();
    }
    throw error;
  }
}

export async function analyzeFinancialState(transactions: any[]) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const summary = JSON.stringify(transactions);
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza estas transacciones y da 3 consejos financieros: ${summary}`,
    });
    return response.text;
  } catch (error) {
    console.error(error);
    return "No se pudo realizar el análisis financiero en este momento.";
  }
}
