import { ChatMessage, OpenRouterResponse } from "../types";

export class OpenRouterService {
    private apiKey: string;
    private baseUrl = "https://openrouter.ai/api/v1";

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async *streamChat(
        messages: ChatMessage[],
        model: string = "deepseek/deepseek-chat-v3-0324:free"
    ) {
        const body = {
            model,
            messages,
            stream: true,
            temperature: 0.7,
            max_tokens: 500,
        };

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
                "X-Title": process.env.SITE_NAME || "Voice Assistant App",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(
                `OpenRouter API error: ${response.status} ${response.statusText}`
            );
        }

        if (!response.body) {
            throw new Error("No response body");
        }

        const decoder = new TextDecoder();

        try {
            for await (const chunk of response.body as any as AsyncIterable<Buffer>) {
                const text = decoder.decode(chunk, { stream: true });
                const lines = text.split("\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6).trim();

                        if (data === "[DONE]") {
                            return;
                        }

                        try {
                            const parsed: OpenRouterResponse = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;

                            if (content) {
                                yield content;
                            }
                        } catch (error) {
                            console.error(
                                "Error parsing OpenRouter response:",
                                error
                            );
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error reading response stream:", error);
        }
    }
}
