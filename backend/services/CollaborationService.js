export class CollaborationService {
    constructor(providerService, agentCatalog) {
        this.providerService = providerService;
        this.agentCatalog = agentCatalog;
    }

    async ask(prompt) {
        const providerResults = await this.providerService.askAll(prompt);
        const agents = this.agentCatalog.getAll().map(agent => {
            const result = providerResults[agent.resultKey];

            if (result?.answer) {
                return {
                    id: agent.id,
                    provider: agent.provider,
                    status: "success",
                    answer: result.answer
                };
            }

            return {
                id: agent.id,
                provider: agent.provider,
                status: "failed",
                error: "PROVIDER_FAILED"
            };
        });
        const successfulAgents = agents.filter(
            agent => agent.status === "success"
        ).length;

        return {
            status: this.#getOverallStatus(successfulAgents, agents.length),
            agents
        };
    }

    #getOverallStatus(successfulAgents, totalAgents) {
        if (successfulAgents === totalAgents) {
            return "success";
        }

        if (successfulAgents === 0) {
            return "failed";
        }

        return "partial_failure";
    }
}
