// Registers AI providers and routes prompts to the requested provider implementation.
import { OpenAIProvider } from "./providers/openai.js";
import { AnthropicProvider } from "./providers/anthropic.js";
import { DeepSeekProvider } from "./providers/deepseek.js";
import { GeminiProvider } from "./providers/gemini.js";
import { MistralProvider } from "./providers/mistral.js";
import { ProviderError } from "./providers/baseProvider.js";
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

                const errorCode = this.describeFailure(
                    name,
                    response.reason
                );

                return [name, {
                    error: errorCode
                }];
            })
        );
    }

    async askAgent(agent, prompt) {
        const provider = this.providers[agent.resultKey];

        if (!provider) {
            throw new Error(`Provider is unavailable for agent ${agent.id}.`);
        }

        return provider.generate(prompt);
    }

    describeFailure(name, error) {
        const isProviderError = error instanceof ProviderError;
        const code = isProviderError ? error.code : "PROVIDER_FAILED";
        const details = [code];

        if (isProviderError && error.status !== null) {
            details.push(`HTTP ${error.status}`);
        }

        if (isProviderError && error.requestId) {
            details.push(`request ${error.requestId}`);
        }

        const message = error instanceof Error
            ? error.message
            : "Unknown provider error.";

        console.error(
            `${name} provider failed (${details.join(", ")}): ${message}`
        );

        return code;
    }
}
