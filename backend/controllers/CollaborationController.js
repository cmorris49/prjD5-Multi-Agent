// Handles HTTP requests for multi-agent collaboration and provider availability.
import { HttpError } from "../errors/HttpError.js";

export class CollaborationController {
    constructor(
        authenticationGuard,
        collaborationService,
        maximumPromptLength = 2000
    ) {
        this.authenticationGuard = authenticationGuard;
        this.collaborationService = collaborationService;
        this.maximumPromptLength = maximumPromptLength;
    }

    async ask(request, body) {
        await this.authenticationGuard.authenticate(request);

        const { prompt, options } = this.#validateRequest(body);
        const result = await this.collaborationService.ask(prompt, options);

        if (result.status === "failed") {
            return {
                status: 502,
                body: {
                    error: "ALL_PROVIDERS_FAILED",
                    ...result
                }
            };
        }

        return {
            status: 200,
            body: result
        };
    }

    #validateRequest(body) {
        if (!body || typeof body !== "object" || Array.isArray(body)) {
            throw new HttpError(400, "INVALID_PROMPT");
        }

        const prompt = typeof body.prompt === "string"
            ? body.prompt.trim()
            : "";

        if (!prompt || prompt.length > this.maximumPromptLength) {
            throw new HttpError(400, "INVALID_PROMPT");
        }

        const mode = body.mode ?? "consensus";

        if (mode !== "single" && mode !== "consensus") {
            throw new HttpError(400, "INVALID_MODE");
        }

        const validAgentIds = new Set([
            "optimist",
            "skeptic",
            "logical_analyst",
            "creative_thinker",
            "pragmatist"
        ]);
        const agentId = body.agent;

        if (mode === "single" && !validAgentIds.has(agentId)) {
            throw new HttpError(400, "INVALID_AGENT");
        }

        if (body.includeHistory !== undefined &&
            typeof body.includeHistory !== "boolean") {
            throw new HttpError(400, "INVALID_INCLUDE_HISTORY");
        }

        return {
            prompt,
            options: {
                mode,
                agentId,
                includeHistory: body.includeHistory ?? false
            }
        };
    }
}
