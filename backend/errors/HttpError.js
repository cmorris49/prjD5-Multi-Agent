// Defines an HTTP-aware error carrying a status code, error code, and response headers.
export class HttpError extends Error {
    constructor(status, code, headers = {}) {
        super(code);
        this.status = status;
        this.code = code;
        this.headers = headers;
    }
}
