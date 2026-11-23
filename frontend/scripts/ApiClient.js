// Provides a shared HTTP client and normalized API errors for frontend requests.
export class ApiError extends Error {
    constructor(status, code, details = null) {
        super(code);
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

export class ApiClient {
    constructor(baseUrl, fetchImplementation = fetch) {
        this.baseUrl = baseUrl.replace(/\/$/, "");
        this.fetchImplementation = fetchImplementation.bind(globalThis);
    }

    async request(path, { method = "GET", body } = {}) {
        const options = {
            method,
            credentials: "include",
            headers: {}
        };

        if (body !== undefined) {
            options.headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(body);
        }

        let response;

        try {
            response = await this.fetchImplementation(
                `${this.baseUrl}${path}`,
                options
            );
        } catch {
            throw new ApiError(0, "NETWORK_ERROR");
        }

        const data = await this.#readJson(response);

        if (!response.ok) {
            throw new ApiError(
                response.status,
                typeof data?.error === "string" ? data.error : "UNKNOWN",
                data
            );
        }

        return data;
    }

    async #readJson(response) {
        const contentType = response.headers.get("content-type") ?? "";

        if (!contentType.includes("application/json")) {
            return null;
        }

        try {
            return await response.json();
        } catch {
            return null;
        }
    }
}
