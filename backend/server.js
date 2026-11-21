import http from "node:http";
import { readFile } from "node:fs/promises";
import { AuthController } from "./controllers/AuthController.js";
import { CollaborationController } from "./controllers/CollaborationController.js";
import { Database } from "./database/Database.js";
import { HttpError } from "./errors/HttpError.js";
import { UserRepository } from "./repositories/UserRepository.js";
import { ClientAddressResolver } from "./security/ClientAddressResolver.js";
import { CorsPolicy } from "./security/CorsPolicy.js";
import { FixedWindowRateLimiter } from "./security/FixedWindowRateLimiter.js";
import { AuthenticationGuard } from "./services/auth/AuthenticationGuard.js";
import { AuthenticationService } from "./services/auth/AuthenticationService.js";
import { AuthorizationService } from "./services/auth/AuthorizationService.js";
import { AuthValidator } from "./services/auth/AuthValidator.js";
import { CookieService } from "./services/auth/CookieService.js";
import { JwtService } from "./services/auth/JwtService.js";
import { PasswordHasher } from "./services/auth/PasswordHasher.js";
import { AgentCatalog } from "./services/agents.js";
import { CollaborationService } from "./services/CollaborationService.js";
import { ProviderService } from "./services/providerService.js";

const PORT = Number(process.env.PORT || 3000);
const MAX_BODY_SIZE = 10000;
const MAX_PROMPT_LENGTH = 2000;

const STATIC_FILES = new Map([
    ["/", {
        file: new URL("../frontend/index.html", import.meta.url),
        type: "text/html; charset=utf-8"
    }],
    ["/index.html", {
        file: new URL("../frontend/index.html", import.meta.url),
        type: "text/html; charset=utf-8"
    }],
    ["/register.html", {
        file: new URL("../frontend/register.html", import.meta.url),
        type: "text/html; charset=utf-8"
    }],
    ["/user.html", {
        file: new URL("../frontend/user.html", import.meta.url),
        type: "text/html; charset=utf-8"
    }],
    ["/admin.html", {
        file: new URL("../frontend/admin.html", import.meta.url),
        type: "text/html; charset=utf-8"
    }],
    ["/css/styles.css", {
        file: new URL("../frontend/css/styles.css", import.meta.url),
        type: "text/css; charset=utf-8"
    }],
    ["/scripts/scripts.js", {
        file: new URL("../frontend/scripts/scripts.js", import.meta.url),
        type: "text/javascript; charset=utf-8"
    }],
    ["/scripts/ApiClient.js", {
        file: new URL("../frontend/scripts/ApiClient.js", import.meta.url),
        type: "text/javascript; charset=utf-8"
    }],
    ["/scripts/AuthenticationClient.js", {
        file: new URL("../frontend/scripts/AuthenticationClient.js", import.meta.url),
        type: "text/javascript; charset=utf-8"
    }],
    ["/scripts/CollaborationClient.js", {
        file: new URL("../frontend/scripts/CollaborationClient.js", import.meta.url),
        type: "text/javascript; charset=utf-8"
    }],
    ["/scripts/config.js", {
        file: new URL("../frontend/scripts/config.js", import.meta.url),
        type: "text/javascript; charset=utf-8"
    }],
    ["/scripts/FormValidator.js", {
        file: new URL("../frontend/scripts/FormValidator.js", import.meta.url),
        type: "text/javascript; charset=utf-8"
    }],
    ["/scripts/FrontendServices.js", {
        file: new URL("../frontend/scripts/FrontendServices.js", import.meta.url),
        type: "text/javascript; charset=utf-8"
    }],
    ["/scripts/LocalizationService.js", {
        file: new URL("../frontend/scripts/LocalizationService.js", import.meta.url),
        type: "text/javascript; charset=utf-8"
    }],
    ["/scripts/LogoutController.js", {
        file: new URL("../frontend/scripts/LogoutController.js", import.meta.url),
        type: "text/javascript; charset=utf-8"
    }],
    ["/scripts/NavigationService.js", {
        file: new URL("../frontend/scripts/NavigationService.js", import.meta.url),
        type: "text/javascript; charset=utf-8"
    }],
    ["/scripts/SessionService.js", {
        file: new URL("../frontend/scripts/SessionService.js", import.meta.url),
        type: "text/javascript; charset=utf-8"
    }],
    ["/scripts/pages/loginPage.js", {
        file: new URL("../frontend/scripts/pages/loginPage.js", import.meta.url),
        type: "text/javascript; charset=utf-8"
    }],
    ["/scripts/pages/registrationPage.js", {
        file: new URL("../frontend/scripts/pages/registrationPage.js", import.meta.url),
        type: "text/javascript; charset=utf-8"
    }],
    ["/scripts/pages/userPage.js", {
        file: new URL("../frontend/scripts/pages/userPage.js", import.meta.url),
        type: "text/javascript; charset=utf-8"
    }],
    ["/scripts/pages/adminPage.js", {
        file: new URL("../frontend/scripts/pages/adminPage.js", import.meta.url),
        type: "text/javascript; charset=utf-8"
    }],
    ["/lang/en/en.js", {
        file: new URL("../frontend/lang/en/en.js", import.meta.url),
        type: "text/javascript; charset=utf-8"
    }]
]);

class ApiServer {
    constructor({
        providerService = new ProviderService(),
        database = new Database(),
        corsPolicy = new CorsPolicy(),
        authController = null,
        collaborationController = null
    } = {}) {
        this.providerService = providerService;
        this.database = database;
        this.corsPolicy = corsPolicy;
        this.authController = authController ?? this.#createAuthController();
        this.collaborationController = collaborationController ??
            this.#createCollaborationController();
        this.isStopping = false;

        this.server = http.createServer(
            (req, res) => this.handleRequest(req, res)
        );
    }

    sendJson(res, status, data, headers = {}) {
        res.writeHead(status, {
            "Content-Type": "application/json; charset=utf-8",
            "X-Content-Type-Options": "nosniff",
            ...headers
        });

        res.end(JSON.stringify(data));
    }

    async readJson(req) {
        if (!req.headers["content-type"]?.startsWith("application/json")) {
            throw new HttpError(415, "INVALID_CONTENT_TYPE");
        }

        const chunks = [];
        let size = 0;

        for await (const chunk of req) {
            size += chunk.length;

            if (size > MAX_BODY_SIZE) {
                throw new HttpError(413, "REQUEST_TOO_LARGE");
            }

            chunks.push(chunk);
        }

        try {
            return JSON.parse(Buffer.concat(chunks).toString("utf8"));
        } catch {
            throw new HttpError(400, "INVALID_JSON");
        }
    }

    async handleRequest(req, res) {
        const pathname = new URL(req.url, "http://localhost").pathname;

        try {
            if (pathname.startsWith("/api/")) {
                const isPreflight = this.corsPolicy.prepare(req, res);

                if (isPreflight) {
                    res.writeHead(204);
                    return res.end();
                }
            }

            if (req.method === "GET" && pathname === "/health") {
                return this.sendJson(res, 200, { status: "ok" });
            }

            if (req.method === "GET" && STATIC_FILES.has(pathname)) {
                const resource = STATIC_FILES.get(pathname);
                const file = await readFile(resource.file);

                res.writeHead(200, {
                    "Content-Type": resource.type,
                    "X-Content-Type-Options": "nosniff"
                });

                return res.end(file);
            }

            const authResult = await this.#handleAuthRequest(req, pathname);

            if (authResult) {
                return this.sendJson(
                    res,
                    authResult.status,
                    authResult.body,
                    authResult.headers
                );
            }

            if (req.method === "POST" && pathname === "/api/collab/ask") {
                const body = await this.readJson(req);
                const result = await this.collaborationController.ask(
                    req,
                    body
                );

                return this.sendJson(
                    res,
                    result.status,
                    result.body,
                    result.headers
                );
            }

            if (req.method === "POST" &&
                pathname === "/api/dev/providers") {

                if (
                    process.env.NODE_ENV === "production" ||
                    process.env.ENABLE_DEV_ENDPOINT !== "true"
                ) {
                    return this.sendJson(res, 404, {
                        error: "NOT_FOUND"
                    });
                }

                const body = await this.readJson(req);
                const prompt = body?.prompt;

                if (typeof prompt !== "string" ||
                    !prompt.trim() ||
                    prompt.length > MAX_PROMPT_LENGTH) {

                    throw new HttpError(400, "INVALID_PROMPT");
                }

                const results = await this.providerService.askAll(
                    prompt.trim()
                );

                return this.sendJson(res, 200, { results });
            }

            return this.sendJson(res, 404, {
                error: "NOT_FOUND"
            });

        } catch (error) {
            if (error instanceof HttpError) {
                return this.sendJson(res, error.status, {
                    error: error.code
                }, error.headers);
            }

            console.error(
                "Server error:",
                error.code ?? error.name ?? "UNKNOWN_ERROR"
            );

            return this.sendJson(res, 500, {
                error: "SERVER_ERROR"
            });
        }
    }

    async #handleAuthRequest(request, pathname) {
        if (request.method === "POST" && pathname === "/api/auth/register") {
            const body = await this.readJson(request);

            return this.authController.register(body);
        }

        if (request.method === "POST" && pathname === "/api/auth/login") {
            const body = await this.readJson(request);

            return this.authController.login(request, body);
        }

        if (request.method === "POST" && pathname === "/api/auth/logout") {
            return this.authController.logout();
        }

        if (request.method === "GET" && pathname === "/api/auth/me") {
            return this.authController.getCurrentUser(request);
        }

        if (request.method === "GET" && pathname === "/api/admin/users") {
            return this.authController.getUsers(request);
        }

        return null;
    }

    #createAuthController() {
        const userRepository = new UserRepository(this.database);
        const passwordHasher = new PasswordHasher(
            Number(process.env.BCRYPT_ROUNDS || 12)
        );
        const jwtService = new JwtService();
        const cookieService = new CookieService();
        const authValidator = new AuthValidator();
        const authenticationService = new AuthenticationService(
            userRepository,
            passwordHasher,
            jwtService,
            authValidator
        );
        const authenticationGuard = new AuthenticationGuard(
            cookieService,
            jwtService,
            userRepository
        );

        return new AuthController({
            authenticationService,
            authenticationGuard,
            authorizationService: new AuthorizationService(),
            userRepository,
            cookieService,
            loginRateLimiter: new FixedWindowRateLimiter({
                maximumAttempts: Number(
                    process.env.LOGIN_RATE_LIMIT_MAX || 5
                ),
                windowMs: Number(
                    process.env.LOGIN_RATE_LIMIT_WINDOW_MS || 900000
                )
            }),
            clientAddressResolver: new ClientAddressResolver()
        });
    }

    #createCollaborationController() {
        const agentCatalog = new AgentCatalog();
        const collaborationService = new CollaborationService(
            this.providerService,
            agentCatalog
        );

        return new CollaborationController(
            this.authController.authenticationGuard,
            collaborationService,
            MAX_PROMPT_LENGTH
        );
    }

    start() {
        this.server.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });

        process.once("SIGINT", () => this.stop("SIGINT"));
        process.once("SIGTERM", () => this.stop("SIGTERM"));
    }

    async stop(signal) {
        if (this.isStopping) {
            return;
        }

        this.isStopping = true;
        console.log(`${signal} received. Shutting down.`);

        try {
            await new Promise((resolve, reject) => {
                this.server.close(error => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve();
                });
            });
        } catch (error) {
            console.error("Shutdown error:", error);
            process.exitCode = 1;
        } finally {
            try {
                await this.database.close();
            } catch (error) {
                console.error("Database shutdown error:", error);
                process.exitCode = 1;
            }
        }
    }
}

const app = new ApiServer();
app.start();
