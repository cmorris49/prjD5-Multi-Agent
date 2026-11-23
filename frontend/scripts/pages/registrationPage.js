// Initializes the registration page and handles account creation and form validation.
import { FrontendServices } from "../FrontendServices.js";
import { en } from "../../lang/en/en.js";

class RegistrationPage {
    constructor(services) {
        this.services = services;
        this.form = document.getElementById("registrationForm");
        this.emailInput = document.getElementById("email");
        this.passwordInput = document.getElementById("password");
        this.confirmPasswordInput = document.getElementById("confirmPassword");
        this.submitButton = document.getElementById("submitButton");
        this.messageElement = document.getElementById("formMessage");
    }

    async initialize() {
        this.services.localization.apply("registration.pageTitle");
        this.form.addEventListener("submit", event => this.#submit(event));

        try {
            await this.services.session.redirectIfAuthenticated();
        } catch (error) {
            this.#setError(error.code);
        }
    }

    async #submit(event) {
        event.preventDefault();

        const emailResult = this.services.validator.validateEmail(
            this.emailInput.value
        );
        const passwordResult = this.services.validator
            .validateRegistrationPassword(this.passwordInput.value);

        if (!emailResult.valid) {
            this.#setValidationError(emailResult);
            return;
        }

        if (!passwordResult.valid) {
            this.#setValidationError(passwordResult);
            return;
        }

        if (passwordResult.value !== this.confirmPasswordInput.value) {
            this.#setMessage(
                this.services.localization.get(
                    "validation.passwordsDoNotMatch"
                )
            );
            return;
        }

        this.#setBusy(true);
        this.#setMessage("");

        try {
            await this.services.authenticationClient.register(
                emailResult.value,
                passwordResult.value
            );
            this.services.navigation.goToLogin("registered");
        } catch (error) {
            this.#setError(error.code);
            this.#setBusy(false);
        }
    }

    #setValidationError(result) {
        this.#setMessage(this.services.localization.get(result.errorKey));
    }

    #setError(code) {
        this.#setMessage(this.services.localization.getError(code));
    }

    #setMessage(message) {
        this.messageElement.textContent = message;
    }

    #setBusy(isBusy) {
        this.emailInput.disabled = isBusy;
        this.passwordInput.disabled = isBusy;
        this.confirmPasswordInput.disabled = isBusy;
        this.submitButton.disabled = isBusy;
        this.submitButton.textContent = this.services.localization.get(
            isBusy
                ? "registration.submitting"
                : "registration.submitButton"
        );
    }
}

const page = new RegistrationPage(new FrontendServices(en));
await page.initialize();
