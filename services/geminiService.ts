import { GoogleGenAI, Type } from "@google/genai";
import { Question, HitType } from '../types';

let aiInstance: GoogleGenAI | null = null;

/**
 * Initializes the GoogleGenAI client. Must be called once before using other service functions.
 * @param apiKey The Gemini API key.
 */
export const initializeAiClient = (apiKey: string) => {
  if (!apiKey) {
    throw new Error("API Key is required to initialize the AI service.");
  }
  aiInstance = new GoogleGenAI({ apiKey });
};

const getAiClient = (): GoogleGenAI => {
    if (!aiInstance) {
      throw new Error("AI Client has not been initialized. Call initializeAiClient first.");
    }
    return aiInstance;
}

const questionSchema = {
  type: Type.OBJECT,
  properties: {
    question: {
      type: Type.STRING,
      description: "La pregunta sobre el libro de Santiago."
    },
    options: {
      type: Type.ARRAY,
      description: "Cuatro opciones de respuesta, una de las cuales es correcta.",
      items: {
        type: Type.STRING
      }
    },
    answer: {
      type: Type.STRING,
      description: "La respuesta correcta, que debe coincidir exactamente con una de las opciones."
    }
  },
  required: ['question', 'options', 'answer']
};


export const generateQuestion = async (chapter: number, difficulty: HitType): Promise<Question | null> => {
  try {
    const ai = getAiClient();

    const difficultySpanish = {
        [HitType.Single]: 'básica y sencilla',
        [HitType.Double]: 'de dificultad intermedia',
        [HitType.Triple]: 'avanzada y detallada',
        [HitType.Homerun]: 'muy compleja y que relacione conceptos de varios capítulos, pero centrada en el capítulo proveído'
    };

    const prompt = `Por favor, genera una pregunta de opción múltiple en español sobre el capítulo ${chapter} del libro de Santiago en la Biblia. La dificultad de la pregunta debe ser ${difficultySpanish[difficulty]}. La pregunta debe tener 4 opciones de respuesta, donde solo una es la correcta. Asegúrate de que las opciones incorrectas sean plausibles pero claramente equivocadas según el texto bíblico. La respuesta debe ser una de las opciones.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        temperature: 0.8,
      }
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    
    if (parsed.question && Array.isArray(parsed.options) && parsed.options.length === 4 && parsed.answer) {
      return parsed as Question;
    } else {
      console.error("Generated question has invalid format:", parsed);
      return null;
    }

  } catch (error) {
    console.error("Error generating question from Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes("AI Client has not been initialized")) {
            alert("Error de configuración: La clave API de Gemini no ha sido configurada. Por favor, recarga la página e introdúcela.");
        } else if (error.message.includes('API_KEY_INVALID') || error.message.includes('permission denied') || error.message.toLowerCase().includes('api key not valid')) {
            alert('La clave API de Gemini no es válida o ha caducado. Por favor, verifica tu clave y recarga la página.');
            localStorage.removeItem('GEMINI_API_KEY');
            window.location.reload();
        }
    }
    return null;
  }
};