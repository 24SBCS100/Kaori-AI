const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

export function getAnthropicKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set in environment variables");
  return key;
}

export type AnthropicMessage = {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[];
};

export type AnthropicContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string };

export type AnthropicTool = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};

export async function streamChatCompletion({
  model,
  messages,
  system,
  tools,
  maxTokens = 4096,
  signal,
}: {
  model: string;
  messages: AnthropicMessage[];
  system?: string;
  tools?: AnthropicTool[];
  maxTokens?: number;
  signal?: AbortSignal;
}): Promise<Response> {
  const apiKey = getAnthropicKey();

  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: maxTokens,
    stream: true,
  };

  if (system) body.system = system;
  if (tools?.length) body.tools = tools;

  const resp = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!resp.ok) {
    const errBody = await resp.text();
    let userMsg = `API error (${resp.status})`;

    if (resp.status === 429) {
      userMsg = "Model quota ended. Please try again later.";
      const retryAfter = resp.headers.get("retry-after");
      if (retryAfter) {
        const seconds = parseInt(retryAfter, 10);
        if (!isNaN(seconds)) {
          if (seconds < 60) {
            userMsg = `Model quota ended. Please try again after ${seconds} seconds.`;
          } else {
            const minutes = Math.ceil(seconds / 60);
            userMsg = `Model quota ended. Please try again after ${minutes} minute${minutes > 1 ? 's' : ''}.`;
          }
        }
      } else {
        // Fallback for anthropic JSON parsing
        try {
           const errJson = JSON.parse(errBody);
           const msg = errJson.error?.message || "";
           const retryMatch = msg.match(/try again in ([0-9.]+)s/i) || msg.match(/retry in ([0-9.]+)s/i);
           if (retryMatch) {
             const seconds = parseFloat(retryMatch[1]);
             if (seconds < 60) {
               userMsg = `Model quota ended. Please try again after ${Math.ceil(seconds)} seconds.`;
             } else {
               const minutes = Math.ceil(seconds / 60);
               userMsg = `Model quota ended. Please try again after ${minutes} minute${minutes > 1 ? 's' : ''}.`;
             }
           }
        } catch(e) {}
      }
    } else {
      userMsg += `: ${errBody}`;
    }
    
    throw new Error(userMsg);
  }

  return resp;
}
