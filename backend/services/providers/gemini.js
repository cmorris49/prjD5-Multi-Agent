import { BaseProvider } from "./baseProvider.js";

export class GeminiProvider extends BaseProvider {
    constructor() {
        super(
            "Gemini",
            process.env.GEMINI_API_KEY,
            process.env.GEMINI_MODEL
        );
    }

    async generate(prompt) {
        const url =
            `https://generativelanguage.googleapis.com/v1beta/models/` +
            `${encodeURIComponent(this.model)}:generateContent`;

        const data = await this.post(
            url,
            {
                "x-goog-api-key": this.apiKey
            },
            {
                contents: [
                    {
                        role: "user",
                        parts: [{ text: prompt }]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: 2000
                }
            }
        );

        const text = (data.candidates?.[0]?.content?.parts ?? [])
            .map(part => part.text ?? "")
            .join("");

        return this.getText(text);
    }
}