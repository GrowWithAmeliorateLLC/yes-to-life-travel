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
    return new Response(
      JSON.stringify({ message: "API key not configured." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
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

  // Detect tool type from prompt to allocate tokens appropriately
  const isRandomizer = prompt.includes("RESEARCH BRIEF") && prompt.includes("trips");
  const maxTokens = isRandomizer ? 4000 : 2500;
  // Timeout: give enough runway for larger responses (Netlify functions max 26s)
  const timeoutMs = 24000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: maxTokens,
        system: `You are a Yes To Life Travel deal specialist. You MUST respond with ONLY a valid JSON object — no markdown, no backticks, no preamble, no explanation. Pure raw JSON only, starting with { and ending with }. Never truncate the JSON — always close every array and object properly.`,
        messages: [
          { role: "user", content: prompt },
        ],
      }),
    });

    clearTimeout(timeoutId);

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
    clearTimeout(timeoutId);
    const isTimeout = err?.name === "AbortError";
    return new Response(
      JSON.stringify({
        message: isTimeout
          ? "Analysis took too long — try narrowing your dates or budget range and search again."
          : err?.message || "Internal server error",
      }),
      { status: isTimeout ? 504 : 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const config: Config = {
  path: "/api/analyze",
};
