// Defines shared AI provider behavior, response parsing, timeouts, and provider errors.
export class ProviderError extends Error {
    constructor(code, message, {
        status = null,
        requestId = null,
        cause = null
    } = {}) {
        super(message);
        this.name = "ProviderError";
        this.code = code;
        this.status = status;
        this.requestId = requestId;
        this.cause = cause;
    }
}

export class BaseProvider {
    constructor(name, apiKey, model) {
        this.name = name;
        this.apiKey = apiKey;
        this.model = model;
    }

    async post(url, headers, body) {
        if (!this.apiKey || !this.model) {
            throw new ProviderError(
                "PROVIDER_CONFIGURATION_ERROR",
                `${this.name} configuration is missing.`
            );
        }

        let response;

        try {
            response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...headers
                },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(30000)
            });
        } catch (error) {
            const timedOut = ["AbortError", "TimeoutError"].includes(
                error?.name
            );

            throw new ProviderError(
                timedOut ? "PROVIDER_TIMEOUT" : "PROVIDER_NETWORK_ERROR",
                timedOut
                    ? `${this.name} request timed out.`
                    : `${this.name} could not be reached.`,
                { cause: error }
            );
        }

        const requestId = response.headers.get("request-id");
        let data;

        try {
            data = await response.json();
        } catch (error) {
            throw new ProviderError(
                response.ok
                    ? "PROVIDER_INVALID_RESPONSE"
                    : this.#getHttpErrorCode(response.status),
                `${this.name} returned invalid JSON (${response.status}).`,
                {
                    status: response.status,
                    requestId,
                    cause: error
                }
            );
        }

        if (!response.ok) {
            const message = data?.error?.message ??
                data?.message ??
                "Unknown API error.";

            throw new ProviderError(
                this.#getHttpErrorCode(response.status),
                `${this.name} API (${response.status}): ${message}`,
                {
                    status: response.status,
                    requestId: requestId ?? data?.request_id ?? null
                }
            );
        }

        return data;
    }

    getText(value) {
        if (typeof value !== "string" || !value.trim()) {
            throw new ProviderError(
                "PROVIDER_INVALID_RESPONSE",
                `${this.name} returned no text.`
            );
        }

        return value.trim();
    }

    #getHttpErrorCode(status) {
        if (status === 401) {
            return "PROVIDER_AUTHENTICATION_ERROR";
        }

        if (status === 402) {
            return "PROVIDER_BILLING_ERROR";
        }

        if (status === 429) {
            return "PROVIDER_RATE_LIMITED";
        }

        if ([408, 504].includes(status)) {
            return "PROVIDER_TIMEOUT";
        }

        if (status >= 500) {
            return "PROVIDER_UNAVAILABLE";
        }

        if ([400, 403, 404].includes(status)) {
            return "PROVIDER_CONFIGURATION_ERROR";
        }

        return "PROVIDER_FAILED";
    }
}
