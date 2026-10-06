export async function geminiGenerate(
  system,
  contents,
  schema,
  {
    apiKey = process.env.GEMINI_API_KEY,
    model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
    fetcher = fetch,
    signal,
  } = {},
) {
  if (!apiKey) throw new Error("Gemini API key is missing.");
  const response = await fetcher(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      signal: signal || AbortSignal.timeout(60000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: {
          thinkingConfig: { thinkingLevel: "minimal" },
          responseMimeType: "application/json",
          responseJsonSchema: schema,
        },
      }),
    },
  );
  if (!response.ok) throw new Error("Gemini model unavailable.");
  const body = await response.json();
  const output = body.candidates?.[0]?.content?.parts
    ?.filter((part) => typeof part.text === "string")
    .map((part) => part.text)
    .join("");
  if (!output) throw new Error("Gemini returned no text.");
  return JSON.parse(output);
}
