import { useState, useCallback } from "react";

interface OpenRouterHook {
    sendMessage: (message: string) => Promise<void>;
    response: string;
    isStreaming: boolean;
    error: string | null;
}

export const useOpenRouter = (): OpenRouterHook => {
    const [response, setResponse] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendMessage = useCallback(async (message: string) => {
        setIsStreaming(true);
        setResponse("");
        setError(null);

        try {
            const backendUrl =
                import.meta.env.VITE_BACKEND_URL || "http://localhost:8003";
            const response = await fetch(`${backendUrl}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("Failed to get response reader");
            }

            const decoder = new TextDecoder();
            let accumulatedResponse = "";

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6);
                        if (data === "[DONE]") {
                            setIsStreaming(false);
                            return;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            const content =
                                parsed.choices?.[0]?.delta?.content || "";
                            if (content) {
                                accumulatedResponse += content;
                                setResponse(accumulatedResponse);
                            }
                        } catch (parseError) {
                            console.error(
                                "Error parsing SSE data:",
                                parseError
                            );
                        }
                    }
                }
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Unknown error";
            setError(errorMessage);
            console.error("Error in sendMessage:", err);
        } finally {
            setIsStreaming(false);
        }
    }, []);

    return {
        sendMessage,
        response,
        isStreaming,
        error,
    };
};
