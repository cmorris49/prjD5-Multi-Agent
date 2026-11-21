import { ApiClient } from "./ApiClient.js";
import { AuthenticationClient } from "./AuthenticationClient.js";
import { CollaborationClient } from "./CollaborationClient.js";
import { FormValidator } from "./FormValidator.js";
import { LocalizationService } from "./LocalizationService.js";
import { NavigationService } from "./NavigationService.js";
import { SessionService } from "./SessionService.js";
import { frontendConfig } from "./config.js";

export class FrontendServices {
    constructor(language) {
        const apiClient = new ApiClient(frontendConfig.apiBaseUrl);

        this.authenticationClient = new AuthenticationClient(apiClient);
        this.collaborationClient = new CollaborationClient(apiClient);
        this.localization = new LocalizationService(language);
        this.navigation = new NavigationService();
        this.validator = new FormValidator();
        this.session = new SessionService(
            this.authenticationClient,
            this.navigation
        );
    }
}
