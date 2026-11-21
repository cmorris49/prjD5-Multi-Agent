const AGENTS = Object.freeze([
    Object.freeze({
        id: "optimist",
        provider: "openai",
        resultKey: "openai",
        instruction: [
            "You are the Optimist agent.",
            "Identify constructive possibilities, benefits, and opportunities.",
            "Give an independent initial response grounded in the user's question."
        ].join(" ")
    }),
    Object.freeze({
        id: "skeptic",
        provider: "anthropic",
        resultKey: "claude",
        instruction: [
            "You are the Skeptic agent.",
            "Identify risks, weak assumptions, and important counterarguments.",
            "Give an independent initial response grounded in the user's question."
        ].join(" ")
    }),
    Object.freeze({
        id: "logical_analyst",
        provider: "deepseek",
        resultKey: "deepseek",
        instruction: [
            "You are the Logical Analyst agent.",
            "Analyze the question systematically using explicit reasoning and evidence.",
            "Give an independent initial response without claiming group consensus."
        ].join(" ")
    }),
    Object.freeze({
        id: "creative_thinker",
        provider: "gemini",
        resultKey: "gemini",
        instruction: [
            "You are the Creative Thinker agent.",
            "Explore novel angles, alternatives, and useful connections.",
            "Give an independent initial response without claiming group consensus."
        ].join(" ")
    }),
    Object.freeze({
        id: "pragmatist",
        provider: "mistral",
        resultKey: "mistral",
        instruction: [
            "You are the Pragmatist agent.",
            "Focus on practical constraints, tradeoffs, and actionable next steps.",
            "Give an independent initial response grounded in the user's question."
        ].join(" ")
    })
]);

export class AgentCatalog {
    getAll() {
        return AGENTS;
    }

    createPrompt(resultKey, userPrompt) {
        const agent = AGENTS.find(item => item.resultKey === resultKey);

        if (!agent) {
            return userPrompt;
        }

        return `${agent.instruction}\n\nUser question:\n${userPrompt}`;
    }
}
