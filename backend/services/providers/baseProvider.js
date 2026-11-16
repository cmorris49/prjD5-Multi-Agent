export class BaseProvider {
    constructor(name, apiKey, model) {
        this.name = name;
        this.apiKey = apiKey;
        this.model = model;
    }

    async post(url, headers, body) {
        if (!this.apiKey || !this.model) {
            throw new Error(`${this.name} configuration is missing.`);
        }

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...headers
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(30000)
        });

        const data = await response.json();

        if (!response.ok) {
            const message = data.error?.message ??
                data.message ??
                "Unknown API error.";

            throw new Error(
                `${this.name} API (${response.status}): ${message}`
            );
        }

        return data;
    }

    getText(value) {
        if (typeof value !== "string" || !value.trim()) {
            throw new Error(`${this.name} returned no text.`);
        }

        return value.trim();
    }
}