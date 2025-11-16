
import { GoogleGenAI, GenerateContentResponse, GenerateImagesResponse, Part } from "@google/genai";
import { ReelSlide, ProcessedSearchResult, GroundingChunk } from '../types';

// Ensure API_KEY is handled by the environment.
// IMPORTANT: In a real production app, client-side API key exposure is a security risk.
// This setup assumes process.env.API_KEY is securely managed and made available
// during build or via a secure mechanism if this were a server-side component.
// For client-side browser environments without a build step that injects env vars,
// this will be undefined. The prompt assumes it's available.
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.warn(
    "API_KEY environment variable not set. Gemini API calls will likely fail. " +
    "Ensure it's configured if you're running this in an environment that supports process.env, " +
    "or provide the key through a secure mechanism."
  );
  // To allow the app to load and show UI even if API key is missing,
  // we don't throw an error here but API calls will fail.
}

const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_API_KEY" }); // Provide a fallback to avoid constructor error if key is undefined

const sanitizeJsonString = (jsonStr: string): string => {
  let sanitized = jsonStr.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = sanitized.match(fenceRegex);
  if (match && match[2]) {
    sanitized = match[2].trim();
  }
  return sanitized;
};

export const searchAndGenerateReelContent = async (query: string): Promise<ProcessedSearchResult> => {
  if (!apiKey || apiKey === "MISSING_API_KEY") {
    throw new Error("Gemini API key is not configured.");
  }
  
  // Step 1: Grounded search for initial information
  const searchResponse: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: query }] }],
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const searchResultText = searchResponse.text;
  const groundingMetadata = searchResponse.candidates?.[0]?.groundingMetadata;

  if (!searchResultText) {
    throw new Error("No information retrieved from search.");
  }

  // Step 2: Generate captions and image prompts from the search result
  const reelPrompt = `
    Based on the following information about "${query}", generate a concise slideshow presentation.
    You MUST output a valid JSON array of 5-7 objects. Each object in the array MUST conform to the following structure:
    {
      "id": "slideN", 
      "caption": "A short, engaging text for a slide (max 2 sentences, suitable for a reel).",
      "imagePrompt": "A detailed, descriptive prompt for an AI image generator to create a relevant and visually appealing SFW (Safe For Work) image for that caption. Focus on creating diverse and interesting imagery. Avoid generic prompts."
    }
    
    IMPORTANT: Strictly output *only* the JSON array. Do not include any other text, explanations, conversational filler, or markdown formatting (like \`\`\`json) before, after, or within the JSON structure itself. The response must be parsable as JSON directly.

    Example of the exact output format expected (ensure unique 'id' values):
    [
      { "id": "slide1-uniqueId", "caption": "Caption for slide 1...", "imagePrompt": "Image prompt for slide 1..." },
      { "id": "slide2-anotherUniqueId", "caption": "Caption for slide 2...", "imagePrompt": "Image prompt for slide 2..." }
    ]

    Information:
    ${searchResultText}
  `;

  const captionResponse: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: reelPrompt }] }],
    config: {
      responseMimeType: "application/json",
    },
  });
  
  const rawJson = captionResponse.text;
  const sanitizedJson = sanitizeJsonString(rawJson);

  try {
    const slidesData = JSON.parse(sanitizedJson);
    if (!Array.isArray(slidesData) || !slidesData.every(s => typeof s.caption === 'string' && typeof s.imagePrompt === 'string' && typeof s.id === 'string')) {
      console.error("Parsed JSON is not in the expected format or types are incorrect:", slidesData);
      throw new Error("Failed to generate reel content in the expected format.");
    }
    const slides: ReelSlide[] = slidesData.map((s, index) => ({
        id: s.id || `slide-${index}-${Date.now()}`, // Ensure unique id if API fails to provide one
        caption: s.caption,
        imagePrompt: s.imagePrompt,
    }));
    return { slides, groundingMetadata };
  } catch (e) {
    console.error("Failed to parse JSON response for reel content:", e, "Raw JSON:", rawJson, "Sanitized JSON:", sanitizedJson);
    throw new Error(`Failed to parse reel content from Gemini response. Error: ${e instanceof Error ? e.message : String(e)}`);
  }
};

export const generateImageForPrompt = async (prompt: string): Promise<string> => {
  if (!apiKey || apiKey === "MISSING_API_KEY") {
    throw new Error("Gemini API key is not configured for image generation.");
  }
  const response: GenerateImagesResponse = await ai.models.generateImages({
    model: 'imagen-3.0-generate-002',
    prompt: prompt,
    config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
  });

  if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
  } else {
    console.error("Image generation failed or returned no data for prompt:", prompt, response);
    // Fallback image or error handling
    return `https://picsum.photos/seed/${encodeURIComponent(prompt)}/540/960`; // Placeholder that fits reel aspect
  }
};
