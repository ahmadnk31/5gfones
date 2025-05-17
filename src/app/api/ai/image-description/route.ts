import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

// Initialize OpenAI client server-side
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Create authenticated Supabase client
    const supabase = createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const requestData = await request.json();
    const { imageUrl } = requestData;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Call OpenAI API to generate description from image
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this phone accessory product in detail for an e-commerce listing. Include key features, materials, benefits, and potential use cases. Keep it professional, engaging, and around 100 words. Focus on selling points.",
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

    // Extract the generated description
    const generatedDescription = response.choices[0]?.message?.content || "";

    return NextResponse.json({ description: generatedDescription });
  } catch (error: any) {
    console.error("Error generating image description:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate description" },
      { status: 500 }
    );
  }
}
