export class CookieService {
    constructor({
        name = process.env.AUTH_COOKIE_NAME || "auth_session",
        maxAgeSeconds = Number(process.env.JWT_TTL_SECONDS || 3600),
        sameSite = process.env.AUTH_COOKIE_SAME_SITE || "lax",
        secure = true
    } = {}) {
        this.name = name.trim();
        this.maxAgeSeconds = maxAgeSeconds;
        this.sameSite = sameSite.toLowerCase();
        this.secure = secure;

        this.#validateConfiguration();
    }

    getToken(headers) {
        const cookieHeader = headers.cookie;

        if (typeof cookieHeader !== "string" || cookieHeader.length > 8192) {
            return null;
        }

        for (const segment of cookieHeader.split(";")) {
            const separatorIndex = segment.indexOf("=");

            if (separatorIndex < 1) {
                continue;
            }

            const name = segment.slice(0, separatorIndex).trim();

            if (name !== this.name) {
                continue;
            }

            try {
                const value = decodeURIComponent(
                    segment.slice(separatorIndex + 1).trim()
                );

                return value.length <= 4096 ? value : null;
            } catch {
                return null;
            }
        }

        return null;
    }

    createHeader(token) {
        return this.#serialize(encodeURIComponent(token), this.maxAgeSeconds);
    }

    createClearHeader() {
        return this.#serialize("", 0);
    }

    #serialize(value, maxAgeSeconds) {
        const attributes = [
            `${this.name}=${value}`,
            "HttpOnly",
            "Path=/",
            `Max-Age=${maxAgeSeconds}`,
            `SameSite=${this.#formatSameSite()}`
        ];

        if (maxAgeSeconds === 0) {
            attributes.push("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
        }

        if (this.secure) {
            attributes.push("Secure");
        }

        return attributes.join("; ");
    }

    #formatSameSite() {
        return this.sameSite[0].toUpperCase() + this.sameSite.slice(1);
    }

    #validateConfiguration() {
        if (!/^[A-Za-z0-9_-]+$/.test(this.name)) {
            throw new Error("AUTH_COOKIE_NAME contains invalid characters.");
        }

        if (
            !Number.isInteger(this.maxAgeSeconds) ||
            this.maxAgeSeconds < 60 ||
            this.maxAgeSeconds > 86400
        ) {
            throw new Error("JWT_TTL_SECONDS must be from 60 to 86400.");
        }

        if (!["lax", "strict", "none"].includes(this.sameSite)) {
            throw new Error(
                "AUTH_COOKIE_SAME_SITE must be lax, strict, or none."
            );
        }

        if (this.sameSite === "none" && !this.secure) {
            throw new Error("SameSite=None cookies must also be Secure.");
        }

        if (!this.secure) {
            throw new Error("Authentication cookies must be Secure.");
        }
    }
}
