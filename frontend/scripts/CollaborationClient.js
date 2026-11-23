// Wraps the backend collaboration and provider endpoints for the frontend.
export class CollaborationClient {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    async ask(prompt, options = {}) {
        return this.apiClient.request("/api/collab/ask", {
            method: "POST",
            body: { prompt, ...options }
        });
    }
}
