// Resolves a request's client IP address with optional trusted-proxy support.
export class ClientAddressResolver {
    constructor(trustProxy = process.env.TRUST_PROXY === "true") {
        this.trustProxy = trustProxy;
    }

    resolve(request) {
        if (this.trustProxy) {
            const forwardedFor = request.headers["x-forwarded-for"];

            if (typeof forwardedFor === "string") {
                const address = forwardedFor.split(",", 1)[0].trim();

                if (address && address.length <= 64) {
                    return address;
                }
            }
        }

        return request.socket.remoteAddress ?? "unknown";
    }
}
