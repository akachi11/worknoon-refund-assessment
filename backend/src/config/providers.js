import { geminiProvider } from "../services/ai/providers/geminiProvider.js";
import { openaiProvider } from "../services/ai/providers/openaiProvider.js";

const PROVIDERS = {
  gemini: geminiProvider,
  openai: openaiProvider,
};

export function resolveProviders() {
  const primaryName = process.env.AI_PRIMARY_PROVIDER === "openai" ? "openai" : "gemini";
  const secondaryName = primaryName === "gemini" ? "openai" : "gemini";

  return {
    primary: PROVIDERS[primaryName],
    secondary: PROVIDERS[secondaryName],
  };
}
