export class CollaborationClient {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    async ask(prompt) {
        return this.apiClient.request("/api/collab/ask", {
            method: "POST",
            body: { prompt }
        });
    }
}
