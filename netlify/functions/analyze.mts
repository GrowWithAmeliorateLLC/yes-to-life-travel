import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = Netlify.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ message: "API key not configured. Please add ANTHROPIC_API_KEY to your Netlify environment variables." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { prompt?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ message: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { prompt } = body;
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return new Response(JSON.stringify({ message: "Prompt is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: `You are a Yes To Life Travel elite travel intelligence system with encyclopedic knowledge of the global aviation market, hotel industry, loyalty programs, and travel pricing strategies. You provide expert, actionable intelligence to sophisticated travelers. Your responses are comprehensive, specific, and formatted clearly with headers and organized sections. You always provide concrete, practical information rather than generic advice. Format your response with clear sections using ## for main headings and ### for sub-headings.`,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errData = await anthropicResponse.json().catch(() => ({}));
      const errMsg = (errData as any)?.error?.message || `API error: ${anthropicResponse.status}`;
      return new Response(JSON.stringify({ message: errMsg }), {
        status: anthropicResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await anthropicResponse.json() as any;
    const result = data?.content?.[0]?.text || "";

    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ message: err?.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config: Config = {
  path: "/api/analyze",
};
