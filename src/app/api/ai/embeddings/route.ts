import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client securely on the server side
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    // Validate the request
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Valid text string is required" },
        { status: 400 }
      );
    }

    // Generate embedding
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });

    // Return the embedding
    return NextResponse.json({
      embedding: response.data[0].embedding,
    });
  } catch (error) {
    console.error("Error generating embedding:", error);
    return NextResponse.json(
      { error: "Failed to generate embedding" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Simple health check endpoint to verify the API is working
  return NextResponse.json({
    status: "ok",
    message: "Embeddings API is operational",
  });
}
