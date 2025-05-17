import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OpenAI } from "openai";

/**
 * API route for translating text using OpenAI API
 * This provides fallback translations for languages that aren't natively supported
 */
export async function POST(request: Request) {
  try {
    const { text, targetLanguage, sourceLanguage = 'en' } = await request.json();
    
    if (!text || !targetLanguage) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // If the OpenAI API key isn't configured, return an error
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Translation service is not configured" }, { status: 501 });
    }
    
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey
    });
    
    // Use OpenAI for translation
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text from ${sourceLanguage} to ${targetLanguage}. Maintain the formatting and tone of the original text. Only provide the translated text with no additional commentary.`
        },
        {
          role: "user",
          content: text
        }
      ]
    });
    
    const translatedText = response.choices[0]?.message?.content || "";
    
    // Return the translated text
    return NextResponse.json({ translatedText });
  } catch (error: any) {
    console.error("Translation error:", error);
    return NextResponse.json({ error: error.message || "Translation failed" }, { status: 500 });
  }
}
