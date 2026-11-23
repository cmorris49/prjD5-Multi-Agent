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
        messageElement
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
        this.outputs = new Map();
    }

    initialize() {
        this.#createResultSections();
        this.modeInput.addEventListener("change", () =>
            this.#syncAgentSelection()
        );
        this.#syncAgentSelection();
        this.form.addEventListener("submit", event => this.#handleSubmit(event));
    }

    #syncAgentSelection() {
        const isSingleMode = this.modeInput.value === "single";
        this.agentInput.disabled = !isSingleMode;
        this.agentInput.parentElement.hidden = !isSingleMode;
    }

    #createResultSections() {
        const agents = this.localization.language.agents;

        for (const [id, agent] of Object.entries(agents)) {
            const section = document.createElement("section");
            const heading = document.createElement("h3");
            const provider = document.createElement("p");
            const output = document.createElement("p");

            section.className = "provider-result";
            heading.textContent = agent.role;
            provider.className = "agent-provider";
            provider.textContent = agent.provider;
            output.textContent = this.localization.get("user.noResponse");

            section.append(heading, provider, output);
            this.resultsContainer.appendChild(section);
            this.outputs.set(id, output);
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
        this.#showAll(this.localization.get("user.generating"));
        this.consensusElement.textContent = "";
        this.consensusElement.classList.remove("success");
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
                this.#renderAgents(error.details.agents);
                this.consensusElement.textContent = "";
                this.consensusElement.classList.remove("success");
                this.#setMessage("user.allProvidersFailed");
            } else {
                this.#showAll(this.localization.getError(error.code));
                this.consensusElement.textContent = "";
                this.consensusElement.classList.remove("success");
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

            if (result?.status === "success") {
                output.textContent = result.answer;
            } else if (result?.status === "not_requested" || !result) {
                output.textContent = this.localization.get("user.notSelected");
            } else {
                output.textContent = this.localization.getError(
                    result.error ?? "PROVIDER_FAILED"
                );
            }
        }
    }

    #renderConsensus(data) {
        if (data.mode !== "consensus") {
            this.consensusElement.textContent = "";
            this.consensusElement.classList.remove("success");
            return;
        }

        const counts = Object.entries(data.votes ?? {})
            .map(([candidate, votes]) => `${candidate}: ${votes}`)
            .join(", ");
        const countLabel = this.localization.get("user.voteCount")
            .replace("{counts}", counts);

        if (!data.consensusReached) {
            this.consensusElement.textContent =
                `${this.localization.get("user.noConsensus")} ${countLabel}`;
            this.consensusElement.classList.remove("success");
            return;
        }

        const prefix = this.localization.get("user.consensusReached")
            .replace("{votes}", String(data.votes[data.winningCandidate]));

        this.consensusElement.textContent =
            `${prefix}${data.answer} ${countLabel}`;
        this.consensusElement.classList.add("success");
    }

    #showAll(message) {
        for (const output of this.outputs.values()) {
            output.textContent = message;
        }
    }

    #setMessage(key) {
        this.messageElement.textContent = this.localization.get(key);
    }

    #setBusy(isBusy) {
        this.submitButton.disabled = isBusy;
        this.promptInput.disabled = isBusy;
    }
}
