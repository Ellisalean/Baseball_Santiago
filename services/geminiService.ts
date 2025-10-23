
import { GoogleGenAI, Type } from "@google/genai";
import { Question, HitType } from '../types';

// Fix: Per coding guidelines, assume process.env.API_KEY is available and initialize directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  const difficultySpanish = {
    [HitType.Single]: 'básica y sencilla',
    [HitType.Double]: 'de dificultad intermedia',
    [HitType.Triple]: 'avanzada y detallada',
    [HitType.Homerun]: 'muy compleja y que relacione conceptos de varios capítulos, pero centrada en el capítulo proveído'
  };

  const prompt = `Por favor, genera una pregunta de opción múltiple en español sobre el capítulo ${chapter} del libro de Santiago en la Biblia. La dificultad de la pregunta debe ser ${difficultySpanish[difficulty]}. La pregunta debe tener 4 opciones de respuesta, donde solo una es la correcta. Asegúrate de que las opciones incorrectas sean plausibles pero claramente equivocadas según el texto bíblico. La respuesta debe ser una de las opciones.`;

  try {
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
    
    // Basic validation
    if (parsed.question && Array.isArray(parsed.options) && parsed.options.length === 4 && parsed.answer) {
      return parsed as Question;
    } else {
      console.error("Generated question has invalid format:", parsed);
      return null;
    }

  } catch (error) {
    console.error("Error generating question from Gemini API:", error);
    return null;
  }
};
