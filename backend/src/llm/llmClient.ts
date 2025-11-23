// Simple Ollama client for generating short narration snippets.
type OllamaGenerateResponse = {
  model: string;
  created_at: string;
  response: string;
  [key: string]: unknown;
};

export async function generateNarration(prompt: string): Promise<string> {
  const llmUrl = process.env.LLM_URL;
  const llmModel = process.env.LLM_MODEL;

  if (!llmUrl) {
    throw new Error('LLM_URL is not set in environment variables');
  }
  if (!llmModel) {
    throw new Error('LLM_MODEL is not set in environment variables');
  }

  const endpoint = `${llmUrl.replace(/\/$/, '')}/api/generate`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: llmModel,
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LLM request failed with status ${response.status}: ${text}`);
  }

  const data = (await response.json()) as Partial<OllamaGenerateResponse>;

  if (!data || typeof data.response !== 'string') {
    throw new Error('LLM response was missing expected "response" field');
  }

  return data.response;
}
