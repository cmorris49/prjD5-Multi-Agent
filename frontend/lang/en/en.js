export const en = {
    locale: "en-CA",

    common: {
        logout: "Log out",
        loggingOut: "Logging out..."
    },

    forms: {
        emailLabel: "Email",
        passwordLabel: "Password",
        confirmPasswordLabel: "Confirm password"
    },

    login: {
        pageTitle: "Login | Multi-Agent AI Collaboration",
        heading: "Log in",
        submitButton: "Log in",
        submitting: "Logging in...",
        registrationPrompt: "Need an account?",
        registrationLink: "Register",
        registrationSuccess: "Registration complete. You can now log in.",
        sessionExpired: "Your session has expired. Please log in again."
    },

    registration: {
        pageTitle: "Register | Multi-Agent AI Collaboration",
        heading: "Create an account",
        submitButton: "Register",
        submitting: "Creating account...",
        loginPrompt: "Already have an account?",
        loginLink: "Log in"
    },

    user: {
        pageTitle: "Multi-Agent Tribunal",
        heading: "Multi-Agent Tribunal",
        promptHeading: "Ask the agents",
        promptLabel: "Prompt",
        promptPlaceholder: "Put a question before the tribunal...",
        modeLabel: "Response mode",
        consensusMode: "Consensus",
        consensusHint: "All five agents debate and vote on the best answer",
        singleMode: "Single agent",
        singleHint: "Ask one agent directly for a quick answer",
        agentLabel: "Choose an agent",
        submitButton: "Ask the tribunal",
        shortcutHint: "Ctrl + Enter to send",
        expandButton: "Expand",
        closeButton: "Close",
        resultsHeading: "Agent responses",
        noResponse: "No response yet.",
        notSelected: "Not selected for this request.",
        generating: "Generating responses...",
        partialFailure: "Some agents could not respond.",
        allProvidersFailed: "No agents could respond. Please try again later.",
        consensusReached: "Consensus reached ({votes} votes): ",
        noConsensus: "The agents did not reach a majority consensus.",
        voteCount: "Votes: {counts}",
        consensusWinner: "Consensus reached: {agents} won with {votes} of {total} votes.",
        winnerBadge: "Winner \u00b7 {votes}",
        voteSingular: "{votes} vote",
        votePlural: "{votes} votes"
    },

    admin: {
        pageTitle: "Administration | Multi-Agent AI Collaboration",
        heading: "Administration",
        usersHeading: "Registered users",
        emailColumn: "Email",
        roleColumn: "Role",
        createdColumn: "Registered",
        loadingUsers: "Loading users...",
        noUsers: "No registered users were found.",
        unknownRole: "Unknown",
        unknownDate: "Not available"
    },

    roles: {
        user: "User",
        administrator: "Administrator"
    },

    agents: {
        optimist: {
            role: "Optimist",
            provider: "OpenAI"
        },
        skeptic: {
            role: "Skeptic",
            provider: "Anthropic"
        },
        logical_analyst: {
            role: "Logical Analyst",
            provider: "DeepSeek"
        },
        creative_thinker: {
            role: "Creative Thinker",
            provider: "Gemini"
        },
        pragmatist: {
            role: "Pragmatist",
            provider: "Mistral"
        }
    },

    validation: {
        emailRequired: "Enter your email address.",
        emailInvalid: "Enter a valid email address.",
        passwordRequired: "Enter your password.",
        passwordWeak: "Use at least 8 characters with a letter and a number.",
        passwordTooLong: "The password is too long.",
        passwordsDoNotMatch: "The passwords do not match.",
        promptRequired: "Enter a prompt before submitting."
    },

    errors: {
        PROVIDER_FAILED: "This agent could not respond.",
        PROVIDER_CONFIGURATION_ERROR: "This agent is not configured correctly.",
        PROVIDER_AUTHENTICATION_ERROR: "This agent's provider credentials need attention.",
        PROVIDER_BILLING_ERROR: "This agent's provider account needs attention.",
        PROVIDER_RATE_LIMITED: "This agent is temporarily rate limited. Try again shortly.",
        PROVIDER_TIMEOUT: "This agent did not respond in time. Please try again.",
        PROVIDER_NETWORK_ERROR: "The server could not reach this agent's provider.",
        PROVIDER_UNAVAILABLE: "This agent's provider is temporarily unavailable.",
        PROVIDER_INVALID_RESPONSE: "This agent returned an unusable response.",
        ALL_PROVIDERS_FAILED: "No agents could respond. Please try again later.",
        INVALID_PROMPT: "Please enter a valid prompt of up to 2000 characters.",
        INVALID_MODE: "Choose a valid response mode.",
        INVALID_AGENT: "Choose a valid agent for single-agent mode.",
        INVALID_INCLUDE_HISTORY: "The includeHistory option must be true or false.",
        INVALID_EMAIL: "Enter a valid email address.",
        INVALID_PASSWORD: "Enter a valid password.",
        WEAK_PASSWORD: "Use at least 8 characters with a letter and a number.",
        ROLE_NOT_ALLOWED: "Account roles cannot be selected during registration.",
        EMAIL_ALREADY_REGISTERED: "An account already exists for this email address.",
        INVALID_CREDENTIALS: "The email or password is incorrect.",
        TOO_MANY_LOGIN_ATTEMPTS: "Too many login attempts. Please try again later.",
        UNAUTHORIZED: "Please log in to continue.",
        FORBIDDEN: "You do not have permission to view this page.",
        ORIGIN_NOT_ALLOWED: "This site is not permitted to access the API.",
        CORS_PREFLIGHT_REJECTED: "The browser request was rejected.",
        INVALID_JSON: "The request format is invalid.",
        INVALID_CONTENT_TYPE: "Unsupported request content type.",
        REQUEST_TOO_LARGE: "The request is too large.",
        NOT_FOUND: "The requested endpoint was not found.",
        SERVER_ERROR: "An unexpected server error occurred.",
        NETWORK_ERROR: "Could not connect to the server.",
        UNKNOWN: "An unexpected error occurred."
    }
};
