import { ConsensusService } from "./consensus.js";
import { CollaborationOrchestrator } from "./orchestrator.js";

export class CollaborationService {
    constructor(providerService, agentCatalog) {
        this.providerService = providerService;
        this.agentCatalog = agentCatalog;
        this.consensusService = new ConsensusService();
        this.orchestrator = new CollaborationOrchestrator(
            providerService,
            agentCatalog,
            this.consensusService
        );
    }

    async ask(prompt, { mode = "consensus", agentId, includeHistory = false } = {}) {
        if (mode === "single") {
            return this.#askSingle(prompt, agentId);
        }

        return this.orchestrator.run(prompt, { includeHistory });
    }

    async #askSingle(prompt, agentId) {
        const agent = this.agentCatalog.getAll().find(
            item => item.id === agentId
        );

        if (!agent) {
            throw new Error("A valid agent is required for single-agent mode.");
        }

        try {
            const answer = await this.providerService.askAgent(
                agent,
                this.agentCatalog.createPrompt(agent.resultKey, prompt)
            );

            return {
                mode: "single",
                status: "success",
                answer,
                agents: [{
                    id: agent.id,
                    provider: agent.provider,
                    status: "success",
                    answer
                }]
            };
        } catch (error) {
            const errorCode = this.providerService.describeFailure(
                agent.resultKey,
                error
            );

            return {
                mode: "single",
                status: "failed",
                agents: [{
                    id: agent.id,
                    provider: agent.provider,
                    status: "failed",
                    error: errorCode
                }]
            };
        }
    }
}
