// Applies localized text and attributes to marked elements in the document.
export class LocalizationService {
    constructor(language, documentObject = document) {
        this.language = language;
        this.document = documentObject;
    }

    apply(pageTitleKey) {
        this.document.title = this.get(pageTitleKey);

        this.document.querySelectorAll("[data-i18n]").forEach(element => {
            element.textContent = this.get(element.dataset.i18n);
        });

        this.document
            .querySelectorAll("[data-i18n-placeholder]")
            .forEach(element => {
                element.placeholder = this.get(
                    element.dataset.i18nPlaceholder
                );
            });
    }

    get(key) {
        const value = key.split(".").reduce(
            (current, part) => current?.[part],
            this.language
        );

        return typeof value === "string" ? value : "";
    }

    getError(code) {
        return this.language.errors[code] ?? this.language.errors.UNKNOWN;
    }
}
