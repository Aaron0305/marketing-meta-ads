import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const apiKeyLine = env.split("\n").find(line => line.startsWith("GOOGLE_GEMINI_API_KEY="));
const apiKey = apiKeyLine ? apiKeyLine.split("=")[1].trim() : "";

async function listModels() {
  if (!apiKey) {
    console.error("No API key");
    return;
  }
  try {
    const models = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await models.json();
    console.log(data.models.map((m: any) => m.name).join("\n"));
  } catch (error) {
    console.error(error);
  }
}

listModels();
