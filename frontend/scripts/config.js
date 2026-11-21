const LOCAL_HOSTS = new Set(["", "localhost", "127.0.0.1", "::1"]);
const isLocalDevelopment = LOCAL_HOSTS.has(window.location.hostname);

export const frontendConfig = Object.freeze({
    apiBaseUrl: isLocalDevelopment
        ? "http://localhost:3000"
        : "https://api.cmorris.xyz"
});
