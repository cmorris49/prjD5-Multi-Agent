export class LogoutController {
    constructor({
        button,
        messageElement,
        authenticationClient,
        navigation,
        localization
    }) {
        this.button = button;
        this.messageElement = messageElement;
        this.authenticationClient = authenticationClient;
        this.navigation = navigation;
        this.localization = localization;
    }

    initialize() {
        this.button.addEventListener("click", () => this.#logout());
    }

    async #logout() {
        this.button.disabled = true;
        this.button.textContent = this.localization.get("common.loggingOut");
        this.messageElement.textContent = "";

        try {
            await this.authenticationClient.logout();
            this.navigation.goToLogin();
        } catch (error) {
            this.messageElement.textContent = this.localization.getError(
                error.code
            );
            this.button.disabled = false;
            this.button.textContent = this.localization.get("common.logout");
        }
    }
}
