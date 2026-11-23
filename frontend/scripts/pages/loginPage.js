// Initializes the login page and handles credential submission and validation.
import { FrontendServices } from "../FrontendServices.js";
import { en } from "../../lang/en/en.js";

class LoginPage {
    constructor(services) {
        this.services = services;
        this.form = document.getElementById("loginForm");
        this.emailInput = document.getElementById("email");
        this.passwordInput = document.getElementById("password");
        this.submitButton = document.getElementById("submitButton");
        this.messageElement = document.getElementById("formMessage");
    }

    async initialize() {
        this.services.localization.apply("login.pageTitle");
        this.#showNavigationStatus();
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
        const passwordResult = this.services.validator.validateLoginPassword(
            this.passwordInput.value
        );
        const validationError = !emailResult.valid
            ? emailResult
            : !passwordResult.valid ? passwordResult : null;

        if (validationError) {
            this.#setMessage(
                this.services.localization.get(validationError.errorKey)
            );
            return;
        }

        this.#setBusy(true);
        this.#setMessage("");

        try {
            await this.services.authenticationClient.login(
                emailResult.value,
                passwordResult.value
            );
            const user = await this.services.authenticationClient
                .getCurrentUser();

            this.services.navigation.goToUser(user);
        } catch (error) {
            this.#setError(error.code);
            this.#setBusy(false);
        }
    }

    #showNavigationStatus() {
        const status = this.services.navigation.getStatus();

        if (status === "registered") {
            this.#setMessage(
                this.services.localization.get("login.registrationSuccess"),
                true
            );
        } else if (status === "expired") {
            this.#setMessage(
                this.services.localization.get("login.sessionExpired")
            );
        }
    }

    #setError(code) {
        this.#setMessage(this.services.localization.getError(code));
    }

    #setMessage(message, success = false) {
        this.messageElement.textContent = message;
        this.messageElement.classList.toggle("success", success);
    }

    #setBusy(isBusy) {
        this.emailInput.disabled = isBusy;
        this.passwordInput.disabled = isBusy;
        this.submitButton.disabled = isBusy;
        this.submitButton.textContent = this.services.localization.get(
            isBusy ? "login.submitting" : "login.submitButton"
        );
    }
}

const page = new LoginPage(new FrontendServices(en));
await page.initialize();
