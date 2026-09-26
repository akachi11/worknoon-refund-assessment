import OpenAI from "openai";
import { buildPrompt } from "../promptBuilder.js";

export const openaiProvider = {
  name: "openai",
  async classify(context) {
    const { systemPrompt, userPrompt } = buildPrompt(context);

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const text = completion.choices[0].message.content;
    return JSON.parse(text);
  },
};
