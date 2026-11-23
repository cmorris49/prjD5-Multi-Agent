// Enforces role-based access requirements for authenticated users.
import { HttpError } from "../../errors/HttpError.js";

export class AuthorizationService {
    requireRole(user, requiredRole) {
        if (user.role !== requiredRole) {
            throw new HttpError(403, "FORBIDDEN");
        }
    }
}
