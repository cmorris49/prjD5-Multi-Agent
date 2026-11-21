export class NavigationService {
    constructor(locationObject = window.location) {
        this.location = locationObject;
    }

    goToLogin(reason = null) {
        const url = this.#createUrl("index.html");

        if (reason) {
            url.searchParams.set("status", reason);
        }

        this.location.replace(url.href);
    }

    goToUser(user) {
        const page = user.role === "administrator"
            ? "admin.html"
            : "user.html";

        this.location.replace(this.#createUrl(page).href);
    }

    getStatus() {
        return new URL(this.location.href).searchParams.get("status");
    }

    #createUrl(page) {
        return new URL(page, this.location.href);
    }
}
