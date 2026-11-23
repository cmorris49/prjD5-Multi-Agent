// Hashes passwords and verifies submitted passwords with bcrypt.
import bcrypt from "bcryptjs";

export class PasswordHasher {
    #dummyHashPromise = null;

    constructor(rounds = 12) {
        if (!Number.isInteger(rounds) || rounds < 10 || rounds > 15) {
            throw new Error("Bcrypt rounds must be an integer from 10 to 15.");
        }

        this.rounds = rounds;
    }

    async hash(password) {
        this.#assertSupportedPassword(password);

        return bcrypt.hash(password, this.rounds);
    }

    async verify(password, passwordHash) {
        this.#assertSupportedPassword(password);

        const hash = passwordHash ?? await this.#getDummyHash();

        try {
            return await bcrypt.compare(password, hash);
        } catch {
            return false;
        }
    }

    async #getDummyHash() {
        if (!this.#dummyHashPromise) {
            this.#dummyHashPromise = this.hash("invalid-login-placeholder");
        }

        return this.#dummyHashPromise;
    }

    #assertSupportedPassword(password) {
        if (
            typeof password !== "string" ||
            Buffer.byteLength(password, "utf8") > 72
        ) {
            throw new Error("Bcrypt passwords must not exceed 72 UTF-8 bytes.");
        }
    }
}
