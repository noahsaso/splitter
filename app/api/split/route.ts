import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Anthropic API key not found" },
      { status: 500 }
    );
  }

  let receipt: string;
  try {
    const data = await request.json();
    receipt = data.receipt;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Request parse failed: ${message}` },
      { status: 400 }
    );
  }

  if (!receipt) {
    return NextResponse.json({ error: "No receipt provided" }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.ANTHROPIC_API_KEY,
        "Anthropic-Version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: receipt,
                },
              },
              {
                type: "text",
                text: `Analyze this receipt image and extract the data as JSON.

IMPORTANT: If an item has a quantity > 1 (e.g., "3 Clam Chowder Cup" for $26.85), split it into separate individual items with the price divided (e.g., three items each at $8.95).

Return ONLY valid JSON in this exact format, no other text:
{"restaurant": "Restaurant Name", "subtotal": 0.00, "tax": 0.00, "tip": 0.00, "total": 0.00, "items": [{"id": 1, "name": "Item Name", "price": 0.00}]}

If tip is not on the receipt, set tip to 0. Make sure all prices are numbers, not strings.`,
              },
            ],
          },
        ],
      }),
    }).catch((err) => {
      throw new Error(`Network request failed: ${err.message}`);
    });

    const data = await response.json().catch((err) => {
      throw new Error(`Response parse failed: ${err.message}`);
    });

    if (!response.ok) {
      throw new Error(data.error?.message || `API error: ${response.status}`);
    }
    if (!data.content?.[0]?.text) {
      throw new Error("No content in API response");
    }

    const responseText = data.content[0].text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.items || !Array.isArray(parsed.items)) {
      throw new Error("Invalid receipt data: missing items array");
    }

    return NextResponse.json({
      receipt: parsed,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Processing failed: ${message}` },
      { status: 500 }
    );
  }
}
