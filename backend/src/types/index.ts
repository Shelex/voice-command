export interface ChatMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface OpenRouterResponse {
    choices: Array<{
        delta?: {
            content?: string;
        };
        message?: {
            content: string;
        };
    }>;
}

export interface ChatRequest {
    message: string;
    conversationHistory?: Array<{ role: string; content: string }>;
}
