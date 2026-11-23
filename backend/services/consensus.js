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

    // Models rarely return a bare "C1". They say "C1.", "**C1**",
    // "Candidate C2" or "I vote for C3". Accept any of those as long as
    // the response names exactly one valid candidate, or take the last
    // one named if the model mentions several.
    parseVote(response, candidates) {
        if (typeof response !== "string") {
            return null;
        }

        const validIds = new Set(candidates.map(candidate => candidate.id));
        const exact = response.trim().toUpperCase();

        if (validIds.has(exact)) {
            return exact;
        }

        const mentioned = [...response.matchAll(/\bC\s*-?\s*(\d+)\b/gi)]
            .map(match => `C${Number(match[1])}`)
            .filter(id => validIds.has(id));

        return mentioned.length > 0
            ? mentioned[mentioned.length - 1]
            : null;
    }

    // A strict majority of the agents that were asked to vote, so the
    // threshold still works when a provider is down (3 of 5, 3 of 4, 2 of 3).
    majorityOf(voterCount) {
        return Math.floor(voterCount / 2) + 1;
    }

    tally(candidates, votes, { voterCount = votes.length } = {}) {
        const counts = Object.fromEntries(
            candidates.map(candidate => [candidate.id, 0])
        );

        for (const vote of votes) {
            if (vote && Object.hasOwn(counts, vote)) {
                counts[vote] += 1;
            }
        }

        const required = voterCount > 0
            ? this.majorityOf(voterCount)
            : Infinity;
        const highestCount = Math.max(0, ...Object.values(counts));
        const winners = Object.entries(counts).filter(
            ([, count]) => count === highestCount && count >= required
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

    // Candidates for a runoff round: everyone tied for first, plus the
    // runners-up when a single leader fell short of a majority.
    // Returns [] when a runoff would just repeat the same vote.
    runoffFinalists(candidates, counts) {
        const ranked = candidates
            .map(candidate => ({ candidate, count: counts[candidate.id] ?? 0 }))
            .filter(item => item.count > 0)
            .sort((a, b) => b.count - a.count);

        if (ranked.length < 2) {
            return [];
        }

        const topCount = ranked[0].count;
        let finalists = ranked.filter(item => item.count === topCount);

        if (finalists.length === 1) {
            const secondCount = ranked[1].count;
            finalists = ranked.filter(item => item.count >= secondCount);
        }

        return finalists.length >= 2 && finalists.length < candidates.length
            ? finalists.map(item => item.candidate)
            : [];
    }
}
