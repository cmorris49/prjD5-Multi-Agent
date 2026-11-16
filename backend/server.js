import http from "node:http";
import { readFile } from "node:fs/promises";
import { ProviderService } from "./services/providerService.js";

const PORT = Number(process.env.PORT || 3000);
const MAX_BODY_SIZE = 10000;
const MAX_PROMPT_LENGTH = 2000;

const STATIC_FILES = new Map([
    ["/", {
        file: new URL("../frontend/index.html", import.meta.url),
        type: "text/html; charset=utf-8"
    }],
    ["/scripts/scripts.js", {
        file: new URL("../frontend/scripts/scripts.js", import.meta.url),
        type: "text/javascript; charset=utf-8"
    }],
    ["/lang/en/en.js", {
        file: new URL("../frontend/lang/en/en.js", import.meta.url),
        type: "text/javascript; charset=utf-8"
    }]
]);

class RequestError extends Error {
    constructor(status, code) {
        super(code);
        this.status = status;
    }
}

class ApiServer {
    constructor() {
        this.providerService = new ProviderService();

        this.server = http.createServer(
            (req, res) => this.handleRequest(req, res)
        );
    }

    sendJson(res, status, data) {
        res.writeHead(status, {
            "Content-Type": "application/json; charset=utf-8",
            "X-Content-Type-Options": "nosniff"
        });

        res.end(JSON.stringify(data));
    }

    async readJson(req) {
        if (!req.headers["content-type"]?.startsWith("application/json")) {
            throw new RequestError(415, "INVALID_CONTENT_TYPE");
        }

        const chunks = [];
        let size = 0;

        for await (const chunk of req) {
            size += chunk.length;

            if (size > MAX_BODY_SIZE) {
                throw new RequestError(413, "REQUEST_TOO_LARGE");
            }

            chunks.push(chunk);
        }

        try {
            return JSON.parse(Buffer.concat(chunks).toString("utf8"));
        } catch {
            throw new RequestError(400, "INVALID_JSON");
        }
    }

    async handleRequest(req, res) {
        const pathname = new URL(req.url, "http://localhost").pathname;

        try {
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

            if (req.method === "POST" &&
                pathname === "/api/dev/providers") {

                if (process.env.ENABLE_DEV_ENDPOINT !== "true") {
                    return this.sendJson(res, 404, {
                        error: "NOT_FOUND"
                    });
                }

                const body = await this.readJson(req);
                const prompt = body?.prompt;

                if (typeof prompt !== "string" ||
                    !prompt.trim() ||
                    prompt.length > MAX_PROMPT_LENGTH) {

                    throw new RequestError(400, "INVALID_PROMPT");
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
            if (error instanceof RequestError) {
                return this.sendJson(res, error.status, {
                    error: error.message
                });
            }

            console.error("Server error:", error);

            return this.sendJson(res, 500, {
                error: "SERVER_ERROR"
            });
        }
    }

    start() {
        this.server.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    }
}

const app = new ApiServer();
app.start();