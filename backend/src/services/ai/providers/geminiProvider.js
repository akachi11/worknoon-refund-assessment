import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildPrompt } from "../promptBuilder.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const geminiProvider = {
  name: "gemini",
  async classify(context) {
    const { systemPrompt, userPrompt } = buildPrompt(context);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const retries = 2;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await model.generateContent(userPrompt);
        return JSON.parse(result.response.text());
      } catch (error) {
        const isOverloaded = error.status === 503;
        if (!isOverloaded || attempt === retries) throw error;
        await sleep(500 * 2 ** attempt);
      }
    }
  },
};
