import { MarkdownRenderer } from "./MarkdownRenderer.js";

export class ProviderInterface {
    constructor({
        collaborationClient,
        localization,
        navigation,
        form,
        promptInput,
        modeInput,
        agentInput,
        resultsContainer,
        consensusElement,
        messageElement,
        agentField,
        promptCount,
        dialog
    }) {
        this.collaborationClient = collaborationClient;
        this.localization = localization;
        this.navigation = navigation;
        this.form = form;
        this.promptInput = promptInput;
        this.modeInput = modeInput;
        this.agentInput = agentInput;
        this.submitButton = form.querySelector("button[type='submit']");
        this.resultsContainer = resultsContainer;
        this.consensusElement = consensusElement;
        this.messageElement = messageElement;
        this.agentField = agentField;
        this.promptCount = promptCount;
        this.dialog = dialog;
        this.outputs = new Map();
        this.cards = new Map();
        this.markdown = new MarkdownRenderer();
    }

    initialize() {
        this.#createResultSections();
        this.form.addEventListener("change", event => {
            if (event.target.name === "mode") {
                this.#syncAgentSelection();
            }
        });
        this.#syncAgentSelection();
        this.promptInput.addEventListener("input", () => this.#updateCount());
        this.promptInput.addEventListener("keydown", event => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                this.form.requestSubmit();
            }
        });
        this.#updateCount();
        this.dialog?.querySelector("#answerDialogClose")
            ?.addEventListener("click", () => this.dialog.close());
        this.dialog?.addEventListener("click", event => {
            // A click on the backdrop (outside the dialog box) closes it.
            if (event.target === this.dialog) {
                this.dialog.close();
            }
        });
        this.form.addEventListener("submit", event => this.#handleSubmit(event));
    }

    #syncAgentSelection() {
        const isSingleMode = this.modeInput.value === "single";
        this.agentField.disabled = !isSingleMode;
        this.agentField.hidden = !isSingleMode;
    }

    #createResultSections() {
        const agents = this.localization.language.agents;

        for (const [id, agent] of Object.entries(agents)) {
            const section = document.createElement("section");
            const header = document.createElement("header");
            const titles = document.createElement("div");
            const heading = document.createElement("h3");
            const provider = document.createElement("p");
            const badge = document.createElement("span");
            const output = document.createElement("div");

            section.className = "provider-result";
            header.className = "provider-result-header";
            heading.textContent = agent.role;
            provider.className = "agent-provider";
            provider.textContent = agent.provider;
            const actions = document.createElement("div");
            const expand = document.createElement("button");

            badge.className = "vote-badge";
            badge.hidden = true;
            actions.className = "provider-result-actions";
            expand.type = "button";
            expand.className = "expand-button";
            expand.textContent = this.localization.get("user.expandButton");
            expand.setAttribute("aria-label",
                `${this.localization.get("user.expandButton")}: ${agent.role}`);
            expand.hidden = true;
            expand.addEventListener("click", () => this.#openDialog(id));
            output.className = "agent-answer";

            titles.append(heading, provider);
            actions.append(badge, expand);
            header.append(titles, actions);
            section.append(header, output);
            this.resultsContainer.appendChild(section);
            this.outputs.set(id, output);
            this.cards.set(id, { section, badge, expand, agent });
            this.#setStatus(id, this.localization.get("user.noResponse"));
        }
    }

    async #handleSubmit(event) {
        event.preventDefault();

        const prompt = this.promptInput.value.trim();

        if (!prompt) {
            this.#setMessage("validation.promptRequired");
            return;
        }

        this.#setBusy(true);
        this.#showAll(this.localization.get("user.generating"), true);
        this.#clearConsensus();
        this.messageElement.textContent = "";

        try {
            const mode = this.modeInput.value;
            const data = await this.collaborationClient.ask(prompt, {
                mode,
                ...(mode === "single" ? { agent: this.agentInput.value } : {})
            });

            this.#renderAgents(data.agents);
            this.#renderConsensus(data);

            if (data.status === "partial_failure") {
                this.#setMessage("user.partialFailure");
            }
        } catch (error) {
            if (error.status === 401) {
                this.navigation.goToLogin("expired");
                return;
            }

            if (Array.isArray(error.details?.agents)) {
                const agents = error.details.agents;

                this.#renderAgents(agents);
                this.#clearConsensus();

                if (error.details.mode === "single" && agents.length === 1) {
                    this.messageElement.textContent =
                        this.localization.getError(
                            agents[0].error ?? "PROVIDER_FAILED"
                        );
                } else {
                    this.#setMessage("user.allProvidersFailed");
                }
            } else {
                this.#showAll(this.localization.getError(error.code));
                this.#clearConsensus();
            }
        } finally {
            this.#setBusy(false);
        }
    }

    #renderAgents(agents) {
        const results = new Map(
            (agents ?? []).map(agent => [agent.id, agent])
        );

        for (const [id, output] of this.outputs) {
            const result = results.get(id);

            const card = this.cards.get(id);

            card.section.classList.toggle(
                "is-idle",
                result?.status === "not_requested" || !result
            );

            if (result?.status === "success") {
                output.classList.remove("is-status", "is-loading");
                output.innerHTML = this.markdown.render(result.answer);
                output.scrollTop = 0;
                card.expand.hidden = false;
            } else if (result?.status === "not_requested" || !result) {
                this.#setStatus(id, this.localization.get("user.notSelected"));
            } else {
                this.#setStatus(id, this.localization.getError(
                    result.error ?? "PROVIDER_FAILED"
                ));
            }
        }
    }

    #renderConsensus(data) {
        if (data.mode !== "consensus") {
            this.#clearConsensus();
            return;
        }

        const votes = data.votes ?? {};
        const candidates = Array.isArray(data.candidates) ? data.candidates : [];
        const totalVotes = Object.values(votes)
            .reduce((sum, count) => sum + count, 0);

        // Older API responses have no candidate list; fall back to the
        // plain text summary with raw candidate IDs.
        if (!candidates.length) {
            this.#renderConsensusText(data, votes);
            return;
        }

        for (const candidate of candidates) {
            const count = votes[candidate.id] ?? 0;
            const isWinner = data.consensusReached &&
                candidate.id === data.winningCandidate;

            for (const agentId of candidate.agentIds ?? []) {
                const card = this.cards.get(agentId);

                if (!card) {
                    continue;
                }

                card.badge.textContent = isWinner
                    ? this.localization.get("user.winnerBadge")
                        .replace("{votes}", this.#voteLabel(count))
                    : this.#voteLabel(count);
                card.badge.hidden = false;
                card.badge.classList.toggle("is-winner", isWinner);
                card.section.classList.toggle("is-winner", isWinner);
            }
        }

        if (!data.consensusReached) {
            this.consensusElement.textContent =
                this.localization.get("user.noConsensus");
            this.consensusElement.classList.remove("success");
            this.consensusElement.classList.add("consensus-banner");
            return;
        }

        const winner = candidates.find(
            candidate => candidate.id === data.winningCandidate
        );
        const agents = this.localization.language.agents;
        const names = (winner?.agentIds ?? [])
            .map(id => agents[id]?.role ?? id)
            .join(" & ");

        this.consensusElement.textContent = this.localization
            .get("user.consensusWinner")
            .replace("{agents}", names)
            .replace("{votes}", String(votes[data.winningCandidate] ?? 0))
            .replace("{total}", String(totalVotes));
        this.consensusElement.classList.add("success", "consensus-banner");
    }

    #renderConsensusText(data, votes) {
        const counts = Object.entries(votes)
            .map(([candidate, count]) => `${candidate}: ${count}`)
            .join(", ");
        const countLabel = this.localization.get("user.voteCount")
            .replace("{counts}", counts);

        this.consensusElement.classList.add("consensus-banner");

        if (!data.consensusReached) {
            this.consensusElement.textContent =
                `${this.localization.get("user.noConsensus")} ${countLabel}`;
            this.consensusElement.classList.remove("success");
            return;
        }

        const prefix = this.localization.get("user.consensusReached")
            .replace("{votes}", String(votes[data.winningCandidate]));

        this.consensusElement.textContent =
            `${prefix}${data.answer} ${countLabel}`;
        this.consensusElement.classList.add("success");
    }

    #voteLabel(count) {
        return this.localization
            .get(count === 1 ? "user.voteSingular" : "user.votePlural")
            .replace("{votes}", String(count));
    }

    #clearConsensus() {
        this.consensusElement.textContent = "";
        this.consensusElement.classList.remove("success", "consensus-banner");

        for (const { section, badge } of this.cards.values()) {
            section.classList.remove("is-winner");
            badge.classList.remove("is-winner");
            badge.textContent = "";
            badge.hidden = true;
        }
    }

    #setStatus(id, message, isLoading = false) {
        const output = this.outputs.get(id);

        output.classList.add("is-status");
        output.classList.toggle("is-loading", isLoading);
        output.textContent = message;
        this.cards.get(id).expand.hidden = true;
    }

    #openDialog(id) {
        const card = this.cards.get(id);
        const output = this.outputs.get(id);

        if (!this.dialog || !card || !output) {
            return;
        }

        this.dialog.querySelector("#answerDialogTitle").textContent =
            card.agent.role;
        this.dialog.querySelector("#answerDialogProvider").textContent =
            card.agent.provider;
        this.dialog.querySelector("#answerDialogBody").innerHTML =
            output.innerHTML;
        this.dialog.classList.toggle(
            "is-winner",
            card.section.classList.contains("is-winner")
        );
        this.dialog.showModal();
    }

    #updateCount() {
        if (this.promptCount) {
            const max = this.promptInput.maxLength;
            this.promptCount.textContent =
                `${this.promptInput.value.length} / ${max}`;
        }
    }

    #showAll(message, isLoading = false) {
        for (const id of this.outputs.keys()) {
            this.cards.get(id).section.classList.remove("is-idle");
            this.#setStatus(id, message, isLoading);
        }
    }

    #setMessage(key) {
        this.messageElement.textContent = this.localization.get(key);
    }

    #setBusy(isBusy) {
        this.submitButton.disabled = isBusy;
        this.promptInput.disabled = isBusy;
        this.form.classList.toggle("is-busy", isBusy);
    }
}
