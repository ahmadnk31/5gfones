import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

// Initialize OpenAI client securely on the server side
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { texts, auth = true } = await request.json();

    // Validate the request
    if (!Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json(
        { error: "Valid array of text strings is required" },
        { status: 400 }
      );
    }

    // Optional: Verify authentication for secure endpoints
    if (auth) {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Generate embeddings in batch
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: texts,
    });

    // Return the embeddings
    return NextResponse.json({
      embeddings: response.data.map((item) => item.embedding),
    });
  } catch (error) {
    console.error("Error generating embeddings:", error);
    return NextResponse.json(
      { error: "Failed to generate embeddings" },
      { status: 500 }
    );
  }
}
