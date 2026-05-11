import OpenAI from "openai";

const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";

function createDeepSeekClient(): OpenAI {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY environment variable is not set");
  }
  return new OpenAI({ apiKey, baseURL: DEEPSEEK_BASE_URL });
}

let client: OpenAI | null = null;

function getDeepSeekClient(): OpenAI {
  if (!client) {
    client = createDeepSeekClient();
  }
  return client;
}

export async function generateAiReview(
  prompt: string,
  options?: { model?: string; maxTokens?: number },
): Promise<string> {
  const openai = getDeepSeekClient();
  const response = await openai.chat.completions.create({
    model: options?.model ?? "deepseek-chat",
    messages: [
      { role: "system", content: "你是一位资深教学评估专家。请根据提供的教学数据，严格按照要求的【】标题格式输出结构化的分析点评。直接输出内容，禁止任何开场白或确认语句（如'好的'、'以下是分析'等）。内容需客观、具体、有数据支撑，避免空泛套话。" },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: options?.maxTokens ?? 1200,
  });

  const content = response.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("AI response returned empty content");
  }
  return content;
}
