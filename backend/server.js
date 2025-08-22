// File: api/server.js

import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const geminiApiKey = process.env.VITE_GEMINI_API_KEY2;
if (!geminiApiKey) {
  console.error("VITE_GEMINI_API_KEY is not set in your .env file.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

/**
 * ROUTE 1: Generate Quiz
 */
app.post("/api/generate-quiz", async (req, res) => {
  try {
    const { notes } = req.body;

    if (!notes || typeof notes !== "string" || notes.trim().length === 0) {
      return res.status(400).json({ error: "Notes content is required." });
    }

    const prompt = `
      You are an expert educational assistant named StudySpark. Your task is to create a high-quality, 7-question multiple-choice quiz from the user's notes provided below.

      **Instructions:**
      - Each question must be based ONLY on the notes.
      - Return ONLY valid JSON (no extra text or markdown).
      - Format:
      {
        "questions": [
          {
            "topic": "The specific sub-topic",
            "question": "The question text",
            "options": { "A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D" },
            "correct_answer": "C",
            "explanation": "A brief explanation"
          }
        ]
      }

      **User's Notes:**
      ---
      ${notes}
      ---
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let jsonText = response.text().trim();

    if (jsonText.startsWith("```")) {
      jsonText = jsonText
        .replace(/^```json\s*/, "")
        .replace(/```$/, "")
        .trim();
    }

    try {
      const quizData = JSON.parse(jsonText);
      res.status(200).json(quizData);
    } catch (parseError) {
      console.error("❌ Failed to parse JSON from Gemini API:", jsonText);
      res.status(500).json({ error: "Failed to parse the generated quiz." });
    }
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * ROUTE 2: Summarize Notes/PDF
 */
app.post("/api/summary", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res
        .status(400)
        .json({ error: "Text content is required for summary." });
    }

    const prompt = `
      You are StudySpark, a smart educational assistant.
      Please provide a **clear, structured summary** of the following notes/text.
      - Keep it concise but comprehensive.
      - Use bullet points or short paragraphs for readability.
      - Highlight key concepts, definitions, and important facts.

      **Text:**
      ---
      ${text}
      ---
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text().trim();

    res.status(200).json({ summary });
  } catch (err) {
    console.error("❌ Summary error:", err);
    res.status(500).json({ error: "Failed to generate summary." });
  }
});

/**
 * ROUTE 3: Quiz Feedback
 */
app.post("/api/quiz-feedback", async (req, res) => {
  try {
    const { questions, userAnswers } = req.body;
    if (!questions || !userAnswers)
      return res.status(400).json({ error: "Questions and answers required" });

    const prompt = `
      You are StudySpark. Compare user's answers with correct answers.
      Return ONLY JSON:
      {
        "feedback": [
          {
            "topic": "...",
            "question": "...",
            "user_answer": "...",
            "correct_answer": "...",
            "is_correct": true/false,
            "explanation": "2-3 sentence explanation"
          }
        ],
        "score": {
          "correct": X,
          "total": Y,
          "percentage": 85.7,
          "summary": "Overall performance summary..."
        }
      }
      Questions:
      ${JSON.stringify(questions, null, 2)}
      UserAnswers:
      ${JSON.stringify(userAnswers, null, 2)}
    `;

    const result = await model.generateContent(prompt);
    let jsonText = (await (await result.response).text()).trim();
    if (jsonText.startsWith("```"))
      jsonText = jsonText
        .replace(/^```json\s*/, "")
        .replace(/```$/, "")
        .trim();

    const feedbackData = JSON.parse(jsonText);
    res.json(feedbackData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get feedback" });
  }
});

/**
 * ROUTE 4: List Topics from Notes/PDF
 */
app.post("/api/list-topics", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res
        .status(400)
        .json({ error: "Text content is required to extract topics." });
    }

    const prompt = `
      You are StudySpark, an educational assistant.
      Extract and return a **list of all main topics and sub-topics** from the text below.
      - Return ONLY valid JSON with this format:
        { "topics": ["Topic 1", "Topic 2", "Topic 3", ...] }

      **Text:**
      ---
      ${text}
      ---
    `;

    const result = await model.generateContent(prompt);
    let jsonText = (await (await result.response).text()).trim();

    if (jsonText.startsWith("```")) {
      jsonText = jsonText
        .replace(/^```json\s*/, "")
        .replace(/```$/, "")
        .trim();
    }

    try {
      const topicsData = JSON.parse(jsonText);
      res.status(200).json(topicsData);
    } catch (parseError) {
      console.error("❌ Failed to parse JSON from Gemini API:", jsonText);
      res.status(500).json({ error: "Failed to extract topics." });
    }
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

/**
 * ROUTE 5: Chatbot
 */
app.post("/api/chatbot", async (req, res) => {
  try {
    const { message, systemInstruction } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required." });
    }

    const prompt = `
      ${
        systemInstruction ||
        "You are StudySpark, an academic assistant. Only answer academic questions such as study help, summaries, quizzes, explanations, and exam prep. If asked anything unrelated (shopping, groceries, etc.), politely refuse."
      }

      User: ${message}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const reply = response.text().trim();

    res.json({ reply });
  } catch (err) {
    console.error("❌ Chatbot error:", err);
    res.status(500).json({ error: "Failed to get chatbot response." });
  }
});

app.listen(port, () => {
  console.log(`✅ Backend server is running at http://localhost:${port}`);
});
