import { HttpError } from "../errors/HttpError.js";

export class CorsPolicy {
    constructor(allowedOrigins = "https://cmorris.xyz") {
        this.allowedOrigins = new Set(
            allowedOrigins
                .split(",")
                .map(origin => origin.trim())
                .filter(Boolean)
                .map(origin => this.#validateOrigin(origin))
        );
    }

    prepare(request, response) {
        const origin = request.headers.origin;

        if (typeof origin === "string") {
            const allowed = this.#isSameOrigin(request, origin) ||
                this.allowedOrigins.has(origin);

            if (!allowed) {
                throw new HttpError(403, "ORIGIN_NOT_ALLOWED");
            }

            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
            response.setHeader("Vary", "Origin");
        } else if (request.headers["sec-fetch-site"] === "cross-site") {
            throw new HttpError(403, "ORIGIN_NOT_ALLOWED");
        }

        if (request.method !== "OPTIONS") {
            return false;
        }

        this.#validatePreflight(request);
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
        response.setHeader("Access-Control-Max-Age", "600");

        return true;
    }

    #validatePreflight(request) {
        const requestedMethod = request.headers["access-control-request-method"];

        if (!requestedMethod || !["GET", "POST"].includes(requestedMethod)) {
            throw new HttpError(403, "CORS_PREFLIGHT_REJECTED");
        }

        const requestedHeaders = request.headers["access-control-request-headers"];

        if (!requestedHeaders) {
            return;
        }

        const headers = requestedHeaders
            .split(",")
            .map(header => header.trim().toLowerCase());

        if (headers.some(header => header !== "content-type")) {
            throw new HttpError(403, "CORS_PREFLIGHT_REJECTED");
        }
    }

    #isSameOrigin(request, origin) {
        const host = request.headers.host;

        if (!host) {
            return false;
        }

        const forwardedProtocol = request.headers["x-forwarded-proto"];
        const protocol = typeof forwardedProtocol === "string"
            ? forwardedProtocol.split(",", 1)[0].trim()
            : request.socket.encrypted ? "https" : "http";

        return origin === `${protocol}://${host}`;
    }

    #validateOrigin(origin) {
        let url;

        try {
            url = new URL(origin);
        } catch {
            throw new Error(`Invalid CORS origin: ${origin}`);
        }

        if (url.origin !== origin || !["http:", "https:"].includes(url.protocol)) {
            throw new Error(`Invalid CORS origin: ${origin}`);
        }

        return origin;
    }
}
