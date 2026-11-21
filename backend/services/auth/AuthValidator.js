import { HttpError } from "../../errors/HttpError.js";

export class AuthValidator {
    constructor({ minimumPasswordLength = 8, maximumPasswordBytes = 72 } = {}) {
        this.minimumPasswordLength = minimumPasswordLength;
        this.maximumPasswordBytes = maximumPasswordBytes;
    }

    validateRegistration(body) {
        this.#assertObject(body);

        if (Object.hasOwn(body, "role")) {
            throw new HttpError(400, "ROLE_NOT_ALLOWED");
        }

        const email = this.#normalizeAndValidateEmail(body.email);
        const password = this.#validatePassword(body.password, true);

        return { email, password };
    }

    validateLogin(body) {
        this.#assertObject(body);

        const email = this.#normalizeAndValidateEmail(body.email);
        const password = this.#validatePassword(body.password, false);

        return { email, password };
    }

    normalizeEmail(email) {
        if (typeof email !== "string") {
            return "";
        }

        return email.trim().toLowerCase();
    }

    #assertObject(body) {
        if (!body || typeof body !== "object" || Array.isArray(body)) {
            throw new HttpError(400, "INVALID_REQUEST_BODY");
        }
    }

    #normalizeAndValidateEmail(value) {
        const email = this.normalizeEmail(value);
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email || email.length > 254 || !emailPattern.test(email)) {
            throw new HttpError(400, "INVALID_EMAIL");
        }

        return email;
    }

    #validatePassword(value, enforceStrength) {
        if (
            typeof value !== "string" ||
            Buffer.byteLength(value, "utf8") > this.maximumPasswordBytes
        ) {
            throw new HttpError(400, "INVALID_PASSWORD");
        }

        if (!enforceStrength && value.length > 0) {
            return value;
        }

        const hasLetter = /[A-Za-z]/.test(value);
        const hasNumber = /\d/.test(value);

        if (
            value.length < this.minimumPasswordLength ||
            !hasLetter ||
            !hasNumber
        ) {
            throw new HttpError(400, "WEAK_PASSWORD");
        }

        return value;
    }
}
