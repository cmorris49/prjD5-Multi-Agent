// Limits repeated actions per key within a fixed time window.
import { HttpError } from "../errors/HttpError.js";

export class FixedWindowRateLimiter {
    constructor({ maximumAttempts = 5, windowMs = 15 * 60 * 1000 } = {}) {
        if (!Number.isInteger(maximumAttempts) || maximumAttempts < 1) {
            throw new Error("Rate-limit attempts must be a positive integer.");
        }

        if (!Number.isInteger(windowMs) || windowMs < 1000) {
            throw new Error("Rate-limit window must be at least 1000 ms.");
        }

        this.maximumAttempts = maximumAttempts;
        this.windowMs = windowMs;
        this.entries = new Map();
    }

    assertAllowed(key) {
        const entry = this.#getCurrentEntry(key);

        if (!entry || entry.attempts < this.maximumAttempts) {
            return;
        }

        const retryAfterSeconds = Math.max(
            1,
            Math.ceil((entry.expiresAt - Date.now()) / 1000)
        );

        throw new HttpError(429, "TOO_MANY_LOGIN_ATTEMPTS", {
            "Retry-After": String(retryAfterSeconds)
        });
    }

    recordFailure(key) {
        const entry = this.#getCurrentEntry(key);

        if (entry) {
            entry.attempts += 1;
            return;
        }

        this.entries.set(key, {
            attempts: 1,
            expiresAt: Date.now() + this.windowMs
        });

        if (this.entries.size > 10000) {
            this.#removeExpiredEntries();
        }
    }

    reset(key) {
        this.entries.delete(key);
    }

    #getCurrentEntry(key) {
        const entry = this.entries.get(key);

        if (!entry) {
            return null;
        }

        if (entry.expiresAt <= Date.now()) {
            this.entries.delete(key);
            return null;
        }

        return entry;
    }

    #removeExpiredEntries() {
        const now = Date.now();

        for (const [key, entry] of this.entries) {
            if (entry.expiresAt <= now) {
                this.entries.delete(key);
            }
        }
    }
}
