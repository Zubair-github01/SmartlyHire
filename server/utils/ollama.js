// server/utils/ollama.js
const fetch = require("node-fetch");

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

/**
 * Simple helper to call Ollama using the /api/generate endpoint.
 * We combine systemPrompt + userPrompt into one string.
 */
async function callOllamaChat({ model, systemPrompt = "", userPrompt = "" }) {
  const prompt = `${systemPrompt}\n\n${userPrompt}`.trim();

  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false, // single full response
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama error: ${res.status} ${text}`);
  }

  const data = await res.json();
  // Ollama returns the text in "response"
  return data.response || "";
}

module.exports = { callOllamaChat };
