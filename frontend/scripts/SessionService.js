import { ApiError } from "./ApiClient.js";

export class SessionService {
    constructor(authenticationClient, navigationService) {
        this.authenticationClient = authenticationClient;
        this.navigationService = navigationService;
    }

    async redirectIfAuthenticated() {
        try {
            const user = await this.authenticationClient.getCurrentUser();
            this.navigationService.goToUser(user);

            return true;
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                return false;
            }

            throw error;
        }
    }

    async requireRole(role) {
        let user;

        try {
            user = await this.authenticationClient.getCurrentUser();
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                this.navigationService.goToLogin("expired");
                return null;
            }

            throw error;
        }

        if (user.role !== role) {
            this.navigationService.goToUser(user);
            return null;
        }

        return user;
    }
}
