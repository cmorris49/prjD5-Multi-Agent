export class ConsensusService {
    createCandidates(initialResponses) {
        const candidates = new Map();

        for (const agent of initialResponses) {
            if (agent.status !== "success") {
                continue;
            }

            const key = agent.answer.trim().replace(/\s+/g, " ").toLowerCase();
            const existing = candidates.get(key);

            if (existing) {
                existing.agentIds.push(agent.id);
                continue;
            }

            candidates.set(key, {
                id: `C${candidates.size + 1}`,
                agentIds: [agent.id],
                answer: agent.answer
            });
        }

        return [...candidates.values()];
    }

    parseVote(response, candidates) {
        const vote = response.trim();

        return candidates.some(candidate => candidate.id === vote)
            ? vote
            : null;
    }

    tally(candidates, votes) {
        const counts = Object.fromEntries(
            candidates.map(candidate => [candidate.id, 0])
        );

        for (const vote of votes) {
            if (vote && Object.hasOwn(counts, vote)) {
                counts[vote] += 1;
            }
        }

        const highestCount = Math.max(0, ...Object.values(counts));
        const winners = Object.entries(counts).filter(
            ([, count]) => count === highestCount && count >= 3
        );
        const winningCandidate = winners.length === 1
            ? candidates.find(candidate => candidate.id === winners[0][0])
            : null;

        return {
            consensusReached: winningCandidate !== null,
            winningCandidate: winningCandidate?.id ?? null,
            answer: winningCandidate?.answer ?? null,
            votes: counts
        };
    }
}
