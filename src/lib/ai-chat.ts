import { createClient } from "@/lib/supabase/client";

/**
 * Generate an AI response based on user input using the server-side API
 */
export async function generateAIResponse(userMessage: string): Promise<string> {
  try {
    // Call the secure server-side API for AI responses
    const response = await fetch("/api/chat/ai-response", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: userMessage }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return (
      data.response ||
      "I'm sorry, I'm having trouble processing your request right now. Please try again or contact our support team."
    );
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "I'm sorry, I'm having technical difficulties. Please try again later or contact our support team directly.";
  }
}

/**
 * Get recent product information to display in chat
 * This can be used to suggest products to the user based on their conversation
 */
export async function getRecentProducts(limit: number = 3): Promise<any[]> {
  try {
    const supabase = createClient();

    const { data: products } = await supabase
      .from("products")
      .select(
        `
        id, 
        name, 
        base_price,
        in_stock,
        brands (name)
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    return products || [];
  } catch (error) {
    console.error("Error getting recent products:", error);
    return [];
  }
}
