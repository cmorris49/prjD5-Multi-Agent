// Wraps the backend authentication endpoints for the frontend.
export class AuthenticationClient {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    async register(email, password) {
        return this.apiClient.request("/api/auth/register", {
            method: "POST",
            body: { email, password }
        });
    }

    async login(email, password) {
        return this.apiClient.request("/api/auth/login", {
            method: "POST",
            body: { email, password }
        });
    }

    async logout() {
        return this.apiClient.request("/api/auth/logout", {
            method: "POST"
        });
    }

    async getCurrentUser() {
        const data = await this.apiClient.request("/api/auth/me");

        return data.user;
    }

    async getUsers() {
        const data = await this.apiClient.request("/api/admin/users");

        return data.users;
    }
}
