import { FrontendServices } from "../FrontendServices.js";
import { LogoutController } from "../LogoutController.js";
import { ProviderInterface } from "../scripts.js";
import { en } from "../../lang/en/en.js";

class UserPage {
    constructor(services) {
        this.services = services;
        this.emailElement = document.getElementById("userEmail");
        this.messageElement = document.getElementById("pageMessage");
    }

    async initialize() {
        this.services.localization.apply("user.pageTitle");

        try {
            const user = await this.services.session.requireRole("user");

            if (!user) {
                return;
            }

            this.emailElement.textContent = user.email;
            this.#initializeLogout();
            this.#initializeProviderInterface();
        } catch (error) {
            this.messageElement.textContent = this.services.localization
                .getError(error.code);
        }
    }

    #initializeLogout() {
        const logoutController = new LogoutController({
            button: document.getElementById("logoutButton"),
            messageElement: this.messageElement,
            authenticationClient: this.services.authenticationClient,
            navigation: this.services.navigation,
            localization: this.services.localization
        });

        logoutController.initialize();
    }

    #initializeProviderInterface() {
        const providerInterface = new ProviderInterface({
            collaborationClient: this.services.collaborationClient,
            localization: this.services.localization,
            navigation: this.services.navigation,
            form: document.getElementById("promptForm"),
            promptInput: document.getElementById("prompt"),
            modeInput: document.getElementById("responseMode"),
            agentInput: document.getElementById("agent"),
            resultsContainer: document.getElementById("results"),
            consensusElement: document.getElementById("consensusResult"),
            messageElement: this.messageElement
        });

        providerInterface.initialize();
    }
}

const page = new UserPage(new FrontendServices(en));
await page.initialize();
