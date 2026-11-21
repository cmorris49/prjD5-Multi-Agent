export class FormValidator {
    validateEmail(value) {
        const email = typeof value === "string" ? value.trim() : "";

        if (!email) {
            return { valid: false, errorKey: "validation.emailRequired" };
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (email.length > 254 || !emailPattern.test(email)) {
            return { valid: false, errorKey: "validation.emailInvalid" };
        }

        return { valid: true, value: email.toLowerCase() };
    }

    validateLoginPassword(value) {
        if (typeof value !== "string" || value.length === 0) {
            return { valid: false, errorKey: "validation.passwordRequired" };
        }

        if (new TextEncoder().encode(value).length > 72) {
            return { valid: false, errorKey: "validation.passwordTooLong" };
        }

        return { valid: true, value };
    }

    validateRegistrationPassword(value) {
        const result = this.validateLoginPassword(value);

        if (!result.valid) {
            return result;
        }

        if (
            value.length < 8 ||
            !/[A-Za-z]/.test(value) ||
            !/\d/.test(value)
        ) {
            return { valid: false, errorKey: "validation.passwordWeak" };
        }

        return result;
    }
}
