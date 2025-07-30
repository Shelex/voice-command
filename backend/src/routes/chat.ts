import { Router, Request, Response } from "express";
import { OpenRouterService } from "../services/openrouter";
import { ChatMessage, ChatRequest } from "../types";

const router = Router();

router.post("/chat", async (req: Request, res: Response) => {
    try {
        const { message, conversationHistory = [] }: ChatRequest = req.body;

        if (!message?.trim()) {
            res.status(400).json({ error: "Message is required" });
            return;
        }

        res.writeHead(200, {
            "Content-Type": "text/plain",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control",
        });

        const messages = [
            {
                role: "system",
                content: `You are a helpful AI assistant named Petro. 
                    Provide concise, helpful response. 
                    Do not include any technical information or special characters. 
                    Please note that answer will be voiced over,
                    so it should be clear and easy to understand.`,
            },
            ...conversationHistory,
            { role: "user", content: message },
        ];

        const openRouterService = new OpenRouterService(
            process.env.OPENROUTER_API_KEY || ""
        );

        try {
            for await (const chunk of openRouterService.streamChat(
                messages as ChatMessage[]
            )) {
                const sseData = `data: ${JSON.stringify({
                    choices: [{ delta: { content: chunk } }],
                })}\n\n`;

                res.write(sseData);
            }

            res.write("data: [DONE]\n\n");
            res.end();
            return;
        } catch (streamError) {
            console.error("Streaming error:", streamError);
            res.write(
                `data: ${JSON.stringify({
                    error: "Failed to get response from AI service",
                })}\n\n`
            );
            res.end();
            return;
        }
    } catch (error) {
        console.error("Chat endpoint error:", error);

        res.status(500).json({
            error: "Internal server error",
        });
        return;
    }
});

export { router as chatRouter };
