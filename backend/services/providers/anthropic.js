// Implements the Anthropic API adapter for generating agent responses.
import { BaseProvider } from "./baseProvider.js";

export class AnthropicProvider extends BaseProvider {
    constructor() {
        super(
            "Anthropic",
            process.env.ANTHROPIC_API_KEY,
            process.env.ANTHROPIC_MODEL
        );
    }

    async generate(prompt) {
        const data = await this.post(
            "https://api.anthropic.com/v1/messages",
            {
                "x-api-key": this.apiKey,
                "anthropic-version": "2023-06-01"
            },
            {
                model: this.model,
                max_tokens: 2000,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            }
        );

        const text = (data.content ?? [])
            .filter(part => part.type === "text")
            .map(part => part.text)
            .join("\n");

        return this.getText(text);
    }
}