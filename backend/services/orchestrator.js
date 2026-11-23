export class CollaborationOrchestrator {
    constructor(providerService, agentCatalog, consensusService) {
        this.providerService = providerService;
        this.agentCatalog = agentCatalog;
        this.consensusService = consensusService;
    }

    async run(prompt, { includeHistory = false } = {}) {
        const catalog = this.agentCatalog.getAll();
        const initialResults = await this.providerService.askAll(prompt);
        const agents = catalog.map(agent => {
            const result = initialResults[agent.resultKey];

            return result?.answer
                ? {
                    id: agent.id,
                    provider: agent.provider,
                    status: "success",
                    answer: result.answer
                }
                : {
                    id: agent.id,
                    provider: agent.provider,
                    status: "failed",
                    error: "PROVIDER_FAILED"
                };
        });
        const candidates = this.consensusService.createCandidates(agents);
        const successfulInitialAgents = agents.filter(
            agent => agent.status === "success"
        );
        const initialResponses = agents.map(agent => ({
            id: agent.id,
            status: agent.status,
            answer: agent.answer ?? null
        }));
        const history = {
            initialResponses,
            specializedAnalyses: [],
            discussion: [],
            finalVotes: []
        };
        const noConsensus = this.consensusService.tally(candidates, []);

        if (successfulInitialAgents.length < 3) {
            return this.#result({
                agents,
                candidates,
                consensus: noConsensus,
                history,
                includeHistory,
                status: successfulInitialAgents.length === 0
                    ? "failed"
                    : "partial_failure"
            });
        }

        const initialAgents = catalog.filter(agent =>
            candidates.some(candidate => candidate.agentIds.includes(agent.id))
        );
        const analysisContext = this.#formatCandidates(prompt, candidates);
        const analyses = await this.#runPhase(
            initialAgents,
            "analysis",
            analysisContext
        );
        history.specializedAnalyses = analyses.map(item => ({
            id: item.agent.id,
            response: item.response
        }));

        if (analyses.length < 3) {
            return this.#result({
                agents,
                candidates,
                consensus: noConsensus,
                history,
                includeHistory,
                status: "partial_failure"
            });
        }

        const discussionContext = [
            analysisContext,
            "Specialized analyses:",
            ...analyses.map(item =>
                `${item.agent.id}: ${item.response}`
            )
        ].join("\n\n");
        const discussions = await this.#runPhase(
            analyses.map(item => item.agent),
            "discussion",
            discussionContext
        );
        history.discussion = discussions.map(item => ({
            id: item.agent.id,
            response: item.response
        }));

        if (discussions.length < 3) {
            return this.#result({
                agents,
                candidates,
                consensus: noConsensus,
                history,
                includeHistory,
                status: "partial_failure"
            });
        }

        const voteContext = [
            discussionContext,
            "Discussion responses:",
            ...discussions.map(item =>
                `${item.agent.id}: ${item.response}`
            ),
            "Available candidates:",
            ...candidates.map(candidate =>
                `${candidate.id}: ${candidate.answer}`
            )
        ].join("\n\n");
        const voteResponses = await this.#runPhase(
            discussions.map(item => item.agent),
            "vote",
            voteContext
        );
        const voteByAgent = new Map(
            voteResponses.map(item => [
                item.agent.id,
                this.consensusService.parseVote(item.response, candidates)
            ])
        );
        const votes = discussions.map(item =>
            voteByAgent.get(item.agent.id) ?? null
        );
        const consensus = this.consensusService.tally(candidates, votes);
        history.finalVotes = discussions.map(item => ({
            id: item.agent.id,
            candidateId: voteByAgent.get(item.agent.id) ?? null
        }));

        return this.#result({
            agents,
            candidates,
            consensus,
            history,
            includeHistory,
            status: this.#hasFailures(
                agents,
                analyses,
                discussions,
                voteResponses
            ) || votes.some(vote => vote === null)
                ? "partial_failure"
                : "success"
        });
    }

    async #runPhase(agents, phase, context) {
        const results = await Promise.allSettled(
            agents.map(async agent => ({
                agent,
                response: await this.providerService.askAgent(
                    agent,
                    this.agentCatalog.createPhasePrompt(agent, phase, context)
                )
            }))
        );

        return results.flatMap((result, index) => {
            if (result.status === "fulfilled" &&
                typeof result.value.response === "string" &&
                result.value.response.trim()) {
                return [{
                    ...result.value,
                    response: result.value.response.trim()
                }];
            }

            console.error(
                `${agents[index].resultKey} provider failed during ${phase}.`
            );
            return [];
        });
    }

    #formatCandidates(prompt, candidates) {
        return [
            `User question: ${prompt}`,
            "Initial candidate answers:",
            ...candidates.map(candidate =>
                `${candidate.id} (from ${candidate.agentIds.join(", ")}): ${candidate.answer}`
            )
        ].join("\n\n");
    }

    #hasFailures(agents, analyses, discussions, votes) {
        return agents.some(agent => agent.status !== "success") ||
            analyses.length < agents.length ||
            discussions.length < analyses.length ||
            votes.length < discussions.length;
    }

    #result({
        agents,
        candidates,
        consensus,
        history,
        includeHistory,
        status
    }) {
        return {
            mode: "consensus",
            status,
            agents,
            candidates,
            ...consensus,
            ...(includeHistory ? { discussionHistory: history } : {})
        };
    }
}