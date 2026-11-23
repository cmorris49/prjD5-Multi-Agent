// Implements user registration and login by coordinating validation, hashing, storage, and tokens.
import { HttpError } from "../../errors/HttpError.js";

export class AuthenticationService {
    constructor(userRepository, passwordHasher, jwtService, authValidator) {
        this.userRepository = userRepository;
        this.passwordHasher = passwordHasher;
        this.jwtService = jwtService;
        this.authValidator = authValidator;
    }

    async register(body) {
        const credentials = this.authValidator.validateRegistration(body);
        const existingUser = await this.userRepository.findByEmail(
            credentials.email
        );

        if (existingUser) {
            throw new HttpError(409, "EMAIL_ALREADY_REGISTERED");
        }

        const passwordHash = await this.passwordHasher.hash(
            credentials.password
        );

        try {
            return await this.userRepository.create({
                email: credentials.email,
                passwordHash,
                role: "user"
            });
        } catch (error) {
            if (error.code === "ER_DUP_ENTRY") {
                throw new HttpError(409, "EMAIL_ALREADY_REGISTERED");
            }

            throw error;
        }
    }

    async login(body) {
        const credentials = this.authValidator.validateLogin(body);
        const user = await this.userRepository.findByEmail(credentials.email);
        const passwordMatches = await this.passwordHasher.verify(
            credentials.password,
            user?.passwordHash
        );

        if (!user || !passwordMatches) {
            throw new HttpError(401, "INVALID_CREDENTIALS");
        }

        const token = this.jwtService.create(user);

        return {
            token,
            user: this.#toPublicUser(user)
        };
    }

    #toPublicUser(user) {
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        };
    }
}
