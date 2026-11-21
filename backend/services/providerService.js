import { OpenAIProvider } from "./providers/openai.js";
import { AnthropicProvider } from "./providers/anthropic.js";
import { DeepSeekProvider } from "./providers/deepseek.js";
import { GeminiProvider } from "./providers/gemini.js";
import { MistralProvider } from "./providers/mistral.js";
import { AgentCatalog } from "./agents.js";

export class ProviderService {
    constructor(providers = null, agentCatalog = new AgentCatalog()) {
        this.providers = providers ?? {
            openai: new OpenAIProvider(),
            claude: new AnthropicProvider(),
            deepseek: new DeepSeekProvider(),
            gemini: new GeminiProvider(),
            mistral: new MistralProvider()
        };
        this.agentCatalog = agentCatalog;
    }

    async askAll(prompt) {
        const entries = Object.entries(this.providers);

        const responses = await Promise.allSettled(
            entries.map(([name, provider]) => provider.generate(
                this.agentCatalog.createPrompt(name, prompt)
            ))
        );

        return Object.fromEntries(
            responses.map((response, index) => {
                const [name] = entries[index];

                if (response.status === "fulfilled") {
                    return [name, {
                        answer: response.value
                    }];
                }

                console.error(`${name} provider failed.`);

                return [name, {
                    error: "PROVIDER_FAILED"
                }];
            })
        );
    }
}
