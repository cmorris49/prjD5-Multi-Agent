import { BaseProvider } from "./baseProvider.js";

export class DeepSeekProvider extends BaseProvider {
    constructor() {
        super(
            "DeepSeek",
            process.env.DEEPSEEK_API_KEY,
            process.env.DEEPSEEK_MODEL
        );
    }

    async generate(prompt) {
        const data = await this.post(
            "https://api.deepseek.com/chat/completions",
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
                max_tokens: 300
            }
        );

        const text = data.choices?.[0]?.message?.content;

        return this.getText(text);
    }
}