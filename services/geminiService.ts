import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SlideAnalysis } from "../types";

// Updated models
const ANALYSIS_MODEL = 'gemini-3-pro-preview';
// "Nano Banana Pro" corresponds to gemini-3-pro-image-preview
const EDITING_MODEL = 'gemini-3-pro-image-preview'; 

// Helper to strip data URL prefix for API calls
const cleanBase64 = (dataUrl: string) => dataUrl.split(',')[1];

export const testApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const ai = new GoogleGenAI({ apiKey });
    // Simple fast query to test auth
    await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest', // Use a fast model for testing
      contents: { parts: [{ text: "Hello" }] }
    });
    return true;
  } catch (error) {
    console.error("API Key Test Failed:", error);
    return false;
  }
};

export const analyzeSlideImage = async (apiKey: string, base64Image: string, slideIndex: number): Promise<SlideAnalysis> => {
  const ai = new GoogleGenAI({ apiKey });
  const cleanData = cleanBase64(base64Image);

  const analysisSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      slide_number: { type: Type.INTEGER },
      title: { type: Type.STRING },
      key_data: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "A list of key data points, bullet points, or main text lines extracted from the slide."
      },
      visual_description: { type: Type.STRING, description: "A detailed visual description of the layout, colors, diagrams, and style." },
    },
    required: ["title", "key_data", "visual_description"],
  };

  try {
    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanData
            }
          },
          {
            text: `Analyze this presentation slide (Slide #${slideIndex + 1}). Extract the title and key data points into the specified JSON format.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    const result = JSON.parse(text) as SlideAnalysis;
    result.slide_number = slideIndex + 1;
    return result;

  } catch (error) {
    console.error("Analysis Failed:", error);
    throw error;
  }
};

export const editSlideImage = async (
  apiKey: string,
  originalBase64: string, 
  analysis: SlideAnalysis
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  const cleanData = cleanBase64(originalBase64);

  // Format the key data array into clear lines exactly as edited by user
  const contentString = analysis.key_data.join('\n');

  // Filter out the unwanted phrase from the visual description if it crept in
  let visualDesc = analysis.visual_description || "";
  const bannedPhrase = "A small logo for 'NotebookLM' is visible in the bottom right corner";
  // Case-insensitive remove
  visualDesc = visualDesc.replace(new RegExp(bannedPhrase, 'gi'), "").trim();

  const prompt = `
    You are an expert presentation designer.
    Recreate the provided slide image with high fidelity, but REPLACE the text content with the specific data provided below.
    
    STRICT TEXT REQUIREMENTS:
    1. The Title MUST be: "${analysis.title}"
    2. The Body Content MUST be exactly these lines as provided (DO NOT add dots, bullets, or numbers unless explicitly shown):
    ${contentString}
    
    NEGATIVE PROMPT (MANDATORY):
    - Do NOT include any "NotebookLM" logos, watermarks, or branding text anywhere in the image.
    - Do NOT include the text "A small logo for 'NotebookLM' is visible in the bottom right corner".
    - Do NOT include any text that is not in the Title or Body Content provided above.

    VISUAL INSTRUCTIONS:
    - Use the provided image as a strong reference for color palette and overall composition style.
    - Style Description (Reference): ${visualDesc}
    - ADAPTATION INSTRUCTION: The Style Description above describes the original slide. You MUST adapt the visual layout (boxes, list items, spacing) to perfectly fit the NEW 'Body Content' provided above. If the new content has more or fewer items than the original description implies, change the layout structure accordingly to make it look professional and balanced.
    - Ensure all text is legible, professional, and properly aligned.
  `;

  try {
    const response = await ai.models.generateContent({
      model: EDITING_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanData
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K"
        }
      }
    });

    let generatedImageBase64: string | undefined;

    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                generatedImageBase64 = part.inlineData.data;
                break;
            }
        }
    }

    if (!generatedImageBase64) {
        throw new Error("No image generated by the model.");
    }

    return `data:image/jpeg;base64,${generatedImageBase64}`;

  } catch (error) {
    console.error("Generation Failed:", error);
    throw error;
  }
};