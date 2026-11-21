import { HttpError } from "../../errors/HttpError.js";

export class AuthenticationGuard {
    constructor(cookieService, jwtService, userRepository) {
        this.cookieService = cookieService;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    async authenticate(request) {
        const token = this.cookieService.getToken(request.headers);

        if (!token) {
            throw new HttpError(401, "UNAUTHORIZED");
        }

        const identity = this.jwtService.verify(token);
        const user = await this.userRepository.findPublicById(identity.userId);

        if (!user) {
            throw new HttpError(401, "UNAUTHORIZED");
        }

        return user;
    }
}
