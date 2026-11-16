import { en } from "../lang/en/en.js";

class ProviderApp {
    constructor() {
        this.form = document.getElementById("promptForm");
        this.promptInput = document.getElementById("prompt");
        this.submitButton = this.form.querySelector("button");
        this.resultsContainer = document.getElementById("results");

        this.outputs = new Map();

        this.loadLanguage();
        this.createResultSections();

        this.form.addEventListener(
            "submit",
            (event) => this.handleSubmit(event)
        );
    }

    loadLanguage() {
        document.title = en.pageTitle;

        document.querySelectorAll("[data-i18n]").forEach(element => {
            const key = element.dataset.i18n;
            element.textContent = en[key] ?? "";
        });

        this.promptInput.placeholder = en.promptPlaceholder;
    }

    createResultSections() {
        for (const [id, name] of Object.entries(en.providers)) {
            const section = document.createElement("section");
            const heading = document.createElement("h3");
            const output = document.createElement("p");

            heading.textContent = name;
            output.textContent = en.noResponse;

            section.append(heading, output);
            this.resultsContainer.appendChild(section);

            this.outputs.set(id, output);
        }
    }

    showAll(message) {
        for (const output of this.outputs.values()) {
            output.textContent = message;
        }
    }

    async handleSubmit(event) {
        event.preventDefault();

        const prompt = this.promptInput.value.trim();

        if (!prompt) {
            return;
        }

        this.submitButton.disabled = true;
        this.showAll(en.generating);

        try {
            const response = await fetch("/api/dev/providers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ prompt })
            });

            const data = await response.json();

            if (!response.ok) {
                this.showAll(
                    en.errors[data.error] ?? en.errors.UNKNOWN
                );
                return;
            }

            for (const [name, output] of this.outputs) {
                const result = data.results?.[name];

                output.textContent = result?.answer ??
                    en.errors[result?.error] ??
                    en.errors.UNKNOWN;
            }

        } catch {
            this.showAll(en.errors.NETWORK_ERROR);

        } finally {
            this.submitButton.disabled = false;
        }
    }
}

new ProviderApp();