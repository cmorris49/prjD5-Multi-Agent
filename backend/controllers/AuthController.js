// Handles HTTP requests for user registration, login, logout, and authentication checks.
export class AuthController {
    constructor({
        authenticationService,
        authenticationGuard,
        authorizationService,
        userRepository,
        cookieService,
        loginRateLimiter,
        clientAddressResolver
    }) {
        this.authenticationService = authenticationService;
        this.authenticationGuard = authenticationGuard;
        this.authorizationService = authorizationService;
        this.userRepository = userRepository;
        this.cookieService = cookieService;
        this.loginRateLimiter = loginRateLimiter;
        this.clientAddressResolver = clientAddressResolver;
    }

    async register(body) {
        const user = await this.authenticationService.register(body);

        return {
            status: 201,
            body: { user }
        };
    }

    async login(request, body) {
        const clientAddress = this.clientAddressResolver.resolve(request);
        const rateLimitKey = this.#getRateLimitKey(clientAddress, body?.email);

        this.loginRateLimiter.assertAllowed(rateLimitKey);

        try {
            const result = await this.authenticationService.login(body);
            this.loginRateLimiter.reset(rateLimitKey);

            return {
                status: 200,
                headers: {
                    "Set-Cookie": this.cookieService.createHeader(result.token)
                },
                body: { user: result.user }
            };
        } catch (error) {
            if (error.status === 401) {
                this.loginRateLimiter.recordFailure(rateLimitKey);
            }

            throw error;
        }
    }

    async logout() {
        return {
            status: 200,
            headers: {
                "Set-Cookie": this.cookieService.createClearHeader()
            },
            body: { message: "Logged out." }
        };
    }

    async getCurrentUser(request) {
        const user = await this.authenticationGuard.authenticate(request);

        return {
            status: 200,
            body: {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role
                }
            }
        };
    }

    async getUsers(request) {
        const user = await this.authenticationGuard.authenticate(request);
        this.authorizationService.requireRole(user, "administrator");

        const users = await this.userRepository.findAllPublic();

        return {
            status: 200,
            body: { users }
        };
    }

    #getRateLimitKey(clientAddress, email) {
        const normalizedEmail = typeof email === "string"
            ? email.trim().toLowerCase().slice(0, 254)
            : "invalid-email";

        return `${clientAddress}:${normalizedEmail}`;
    }
}
