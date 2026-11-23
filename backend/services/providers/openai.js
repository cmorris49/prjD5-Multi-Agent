import { BaseProvider } from "./baseProvider.js";

export class OpenAIProvider extends BaseProvider {
    constructor() {
        super(
            "OpenAI",
            process.env.OPENAI_API_KEY,
            process.env.OPENAI_MODEL
        );
    }

    async generate(prompt) {
        const data = await this.post(
            "https://api.openai.com/v1/responses",
            {
                Authorization: `Bearer ${this.apiKey}`
            },
            {
                model: this.model,
                input: prompt,
                max_output_tokens: 2000
            }
        );

        const text = (data.output ?? [])
            .flatMap(item => item.content ?? [])
            .filter(part => part.type === "output_text")
            .map(part => part.text)
            .join("\n");

        return this.getText(text);
    }
}