import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

// Constants
const GEMINI_API_KEY = process.env.GOOGLE_GENAI_API_KEY;

// Gemini models (uncomment the one you want to use)
// const GEMINI_MODEL = "gemini-3.5-flash";
// const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_MODEL = "gemini-3-flash-preview";
// const GEMINI_MODEL = 'gemini-3.1-flash-lite';
// const GEMINI_MODEL = 'gemini-2.5-flash-lite';

// Server setup
const PORT = 3000;

// Directory for static files (like index.html, script.js, style.css)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
const app = express();

// Initialize GoogleGenAI client
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Enable CORS for all routes
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// Run server on the defined PORT
app.listen(PORT, () => {
    console.log(`Server is ready on http://localhost:${PORT}`);
});

// API endpoint for chat
app.post("/api/chat", async (req, res) => {
    const { conversation } = req.body;
    try {
        // Validate that conversation is an array
        if (!Array.isArray(conversation)) {
            throw new Error("Messages must be an array!");
        }

        // Map conversation to the format expected by the Gemini API (ContentListUnion)
        const contents = conversation.map(({ role, text }) => ({
            role,
            parts: [{ text }],
        }));

        // Generate response from Gemini API
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: {
                temperature: 0.7,
                systemInstruction: `
                Do not create unverifiable information, if you are unsure of the answer, say "I don't know".
                If the user asks for information provide the least amount of information necessary to answer the question.
                Do not agree with the user's opinion.
                Ask clarifying questions if the user's request is ambiguous or unclear.
                Be argumentative and provide counterpoints.
                Provide reasoning and evidence to support your arguments.
                If user's request is already on point, acknowledge it but provide at least three alternative perspectives or counterarguments.
                Create a concise and clear response, avoiding unnecessary repetition or filler content.
                Use a professional and respectful tone, even when disagreeing.
                `,
            },
        });

        // Return the generated response to the client
        res.status(200).json({ result: response.text });
    } catch (error) {
        // Return a 500 status code with the error message
        res.status(500).json({ message: error.message, log: error });
    }
});
