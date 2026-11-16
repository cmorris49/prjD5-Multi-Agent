export const en = {
    pageTitle: "Multi-Agent AI Collaboration",
    heading: "Multi-Agent AI Collaboration",
    promptLabel: "Enter your prompt:",
    promptPlaceholder: "Ask a question...",
    submitButton: "Submit",
    resultsHeading: "Provider Responses",

    noResponse: "No response yet.",
    generating: "Generating response...",

    providers: {
        openai: "OpenAI",
        claude: "Claude",
        deepseek: "DeepSeek",
        gemini: "Gemini",
        mistral: "Mistral"
    },

    errors: {
        PROVIDER_FAILED: "This provider could not respond. Check the server logs.",
        INVALID_PROMPT: "Please enter a valid prompt of up to 2000 characters.",
        INVALID_JSON: "The request format is invalid.",
        INVALID_CONTENT_TYPE: "Unsupported request content type.",
        REQUEST_TOO_LARGE: "The request is too large.",
        NOT_FOUND: "The requested endpoint was not found.",
        SERVER_ERROR: "An unexpected server error occurred.",
        NETWORK_ERROR: "Could not retrieve a response from the server.",
        UNKNOWN: "An unexpected error occurred."
    }
};