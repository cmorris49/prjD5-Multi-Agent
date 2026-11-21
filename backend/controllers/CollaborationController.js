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

        const prompt = this.#validatePrompt(body);
        const result = await this.collaborationService.ask(prompt);

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

    #validatePrompt(body) {
        if (!body || typeof body !== "object" || Array.isArray(body)) {
            throw new HttpError(400, "INVALID_PROMPT");
        }

        const prompt = typeof body.prompt === "string"
            ? body.prompt.trim()
            : "";

        if (!prompt || prompt.length > this.maximumPromptLength) {
            throw new HttpError(400, "INVALID_PROMPT");
        }

        return prompt;
    }
}
