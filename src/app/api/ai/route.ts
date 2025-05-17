import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

// Initialize OpenAI client securely on the server side
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    // Validate the request
    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Optional: Verify auth
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Call OpenAI to generate description from image
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this phone repair part in detail, including what it's for, its quality, and compatibility information. Keep it professional, focusing on technical specifications and quality indicators. Around 100 words.",
            },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const description = response.choices[0]?.message?.content || "";

    return NextResponse.json({ description });
  } catch (error: any) {
    console.error("Error generating description:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate description" },
      { status: 500 }
    );
  }
}
