// Initializes the administrator page, session checks, user list, localization, and logout behavior.
import { ApiError } from "../ApiClient.js";
import { FrontendServices } from "../FrontendServices.js";
import { LogoutController } from "../LogoutController.js";
import { en } from "../../lang/en/en.js";

class AdminPage {
    constructor(services) {
        this.services = services;
        this.emailElement = document.getElementById("adminEmail");
        this.statusElement = document.getElementById("usersStatus");
        this.tableContainer = document.getElementById("usersTableContainer");
        this.tableBody = document.getElementById("usersTableBody");
    }

    async initialize() {
        this.services.localization.apply("admin.pageTitle");

        try {
            const user = await this.services.session.requireRole(
                "administrator"
            );

            if (!user) {
                return;
            }

            this.emailElement.textContent = user.email;
            this.#initializeLogout();
            await this.#loadUsers();
        } catch (error) {
            this.#handleError(error);
        }
    }

    async #loadUsers() {
        this.statusElement.textContent = this.services.localization.get(
            "admin.loadingUsers"
        );

        try {
            const users = await this.services.authenticationClient.getUsers();

            if (users.length === 0) {
                this.statusElement.textContent = this.services.localization.get(
                    "admin.noUsers"
                );
                return;
            }

            this.statusElement.textContent = "";
            this.tableContainer.hidden = false;

            for (const user of users) {
                this.tableBody.appendChild(this.#createUserRow(user));
            }
        } catch (error) {
            this.#handleError(error);
        }
    }

    #createUserRow(user) {
        const row = document.createElement("tr");
        const emailCell = document.createElement("td");
        const roleCell = document.createElement("td");
        const createdCell = document.createElement("td");

        emailCell.textContent = user.email;
        roleCell.textContent = this.services.localization.language.roles[
            user.role
        ] ?? this.services.localization.get("admin.unknownRole");
        createdCell.textContent = this.#formatDate(user.createdAt);

        row.append(emailCell, roleCell, createdCell);

        return row;
    }

    #formatDate(value) {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return this.services.localization.get("admin.unknownDate");
        }

        return new Intl.DateTimeFormat(en.locale, {
            dateStyle: "medium"
        }).format(date);
    }

    #initializeLogout() {
        const logoutController = new LogoutController({
            button: document.getElementById("logoutButton"),
            messageElement: this.statusElement,
            authenticationClient: this.services.authenticationClient,
            navigation: this.services.navigation,
            localization: this.services.localization
        });

        logoutController.initialize();
    }

    #handleError(error) {
        if (error instanceof ApiError && error.status === 401) {
            this.services.navigation.goToLogin("expired");
            return;
        }

        this.statusElement.textContent = this.services.localization.getError(
            error.code
        );
    }
}

const page = new AdminPage(new FrontendServices(en));
await page.initialize();
