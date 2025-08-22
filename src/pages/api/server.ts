// File: api/server.ts (a standalone Express server)

import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Load environment variables from a .env file in the project root
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = 3001; // A separate port from your Vite dev server

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// 1. Initialize the Gemini AI Client
// Vite requires environment variables to be prefixed with VITE_
const geminiApiKey = process.env.VITE_GEMINI_API_KEY;
if (!geminiApiKey) {
  console.error(
    "VITE_GEMINI_API_KEY is not set. Please create a .env file in the root of your project."
  );
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// Define the API route
app.post("/api/generate-quiz", async (req, res) => {
  try {
    const { notes } = req.body;

    if (!notes || typeof notes !== "string" || notes.trim().length === 0) {
      return res.status(400).json({ error: "Notes content is required." });
    }

    // 2. The Master Prompt for the AI
    const prompt = `
      You are an expert educational assistant named StudySpark. Your task is to create a high-quality, 7-question multiple-choice quiz from the user's notes provided below.

      **Instructions:**
      1.  Carefully read and understand the entire text of the notes.
      2.  For each question you generate, identify the main sub-topic it relates to from the notes.
      3.  The questions must be based ONLY on the information present in the provided notes.
      4.  Return your response ONLY in a valid JSON format. The root object should have a "questions" key, which holds an array of question objects. Do not include any other text, explanation, or markdown formatting (like \`\`\`json) outside of the JSON structure.

      **JSON Format:**
      {
        "questions": [
          {
            "topic": "The specific sub-topic from the notes",
            "question": "The question text",
            "options": { "A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D" },
            "correct_answer": "C",
            "explanation": "A brief explanation of why the answer is correct, based on the notes."
          }
        ]
      }

      **User's Notes:**
      ---
      ${notes}
      ---
    `;

    // 3. Generate content using the AI
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text();

    // 4. Parse the response and send it back to the frontend
    try {
      const quizData = JSON.parse(jsonText);
      res.status(200).json(quizData);
    } catch (parseError) {
      console.error("Failed to parse JSON from Gemini API:", jsonText);
      res.status(500).json({
        error:
          "Failed to parse the generated quiz. The AI may have returned an invalid format.",
      });
    }
  } catch (error) {
    console.error("Error in /api/generate-quiz:", error);
    res
      .status(500)
      .json({ error: error.message || "An internal server error occurred." });
  }
});

app.listen(port, () => {
  console.log(`✅ Backend server is running at http://localhost:${port}`);
});
