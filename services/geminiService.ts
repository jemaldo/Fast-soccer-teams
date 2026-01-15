
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
    await ensureApiKey();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Configuración ultra-simple para evitar errores de cuota o tokens
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Eres un entrenador de fútbol Pro. Crea un plan semanal para categoría ${category}. Enfoque: ${focus}.
      Estructura JSON: { "sessions": [ { "day": "Día", "title": "Título", "activities": ["Actividad 1", "Actividad 2"], "duration": "90 min" } ] }`,
      config: {
        responseMimeType: "application/json",
        // No añadimos thinkingBudget ni maxTokens para máxima compatibilidad
      }
    });

    const text = response.text || "";
    const cleanedText = cleanJsonResponse(text);
    return JSON.parse(cleanedText);
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message?.includes("entity was not found") || error.message?.includes("API key")) {
      const aistudio = (window as any).aistudio;
      if (aistudio) await aistudio.openSelectKey();
    }
    throw new Error("La IA está ocupada o requiere verificar la API Key.");
  }
}

export async function analyzeFinancialState(transactions: any[]) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const summary = JSON.stringify(transactions.slice(-10)); // Solo las últimas 10 para no saturar
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza estas finanzas y da 3 consejos cortos: ${summary}`,
    });
    return response.text;
  } catch (error) {
    return "Análisis no disponible actualmente.";
  }
}
