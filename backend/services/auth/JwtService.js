import jwt from "jsonwebtoken";
import { HttpError } from "../../errors/HttpError.js";

const ALLOWED_ROLES = new Set(["user", "administrator"]);

export class JwtService {
    constructor({
        secret = process.env.JWT_SECRET,
        ttlSeconds = Number(process.env.JWT_TTL_SECONDS || 3600),
        issuer = "multi-agent-api",
        audience = "multi-agent-web"
    } = {}) {
        if (!Number.isInteger(ttlSeconds) || ttlSeconds < 60 || ttlSeconds > 86400) {
            throw new Error("JWT_TTL_SECONDS must be from 60 to 86400.");
        }

        this.secret = secret;
        this.ttlSeconds = ttlSeconds;
        this.issuer = issuer;
        this.audience = audience;
    }

    create(identity) {
        return jwt.sign(
            { role: identity.role },
            this.#getSecret(),
            {
                algorithm: "HS256",
                subject: String(identity.id),
                issuer: this.issuer,
                audience: this.audience,
                expiresIn: this.ttlSeconds
            }
        );
    }

    verify(token) {
        let payload;

        try {
            payload = jwt.verify(token, this.#getSecret(), {
                algorithms: ["HS256"],
                issuer: this.issuer,
                audience: this.audience
            });
        } catch (error) {
            if (error.code === "AUTH_CONFIGURATION_ERROR") {
                throw error;
            }

            throw new HttpError(401, "UNAUTHORIZED");
        }

        const userId = Number(payload.sub);

        if (
            !Number.isSafeInteger(userId) ||
            userId <= 0 ||
            !ALLOWED_ROLES.has(payload.role)
        ) {
            throw new HttpError(401, "UNAUTHORIZED");
        }

        return { userId, role: payload.role };
    }

    #getSecret() {
        if (typeof this.secret !== "string" || this.secret.length < 32) {
            const error = new Error(
                "JWT_SECRET must contain at least 32 characters."
            );
            error.code = "AUTH_CONFIGURATION_ERROR";

            throw error;
        }

        return this.secret;
    }
}
