export class HttpError extends Error {
    constructor(status, code, headers = {}) {
        super(code);
        this.status = status;
        this.code = code;
        this.headers = headers;
    }
}
