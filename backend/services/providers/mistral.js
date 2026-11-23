import { BaseProvider } from "./baseProvider.js";

export class MistralProvider extends BaseProvider {
    constructor() {
        super(
            "Mistral",
            process.env.MISTRAL_API_KEY,
            process.env.MISTRAL_MODEL
        );
    }

    async generate(prompt) {
        const data = await this.post(
            "https://api.mistral.ai/v1/chat/completions",
            {
                Authorization: `Bearer ${this.apiKey}`
            },
            {
                model: this.model,
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 2000
            }
        );

        const text = data.choices?.[0]?.message?.content;

        return this.getText(text);
    }
}