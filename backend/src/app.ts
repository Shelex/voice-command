import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { chatRouter } from "./routes/chat";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config({ path: "../.env" });

const app = express();
const PORT = process.env.PORT || 8003;

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
    })
);

app.use(express.json());
app.use("/api", chatRouter);
app.use(errorHandler);
app.get("/health", (_req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
