// Provides database operations for creating, finding, and listing user accounts.
export class UserRepository {
    constructor(database) {
        this.database = database;
    }

    async findByEmail(email) {
        const [rows] = await this.database.execute(
            `SELECT
                id,
                email,
                password_hash AS passwordHash,
                role,
                created_at AS createdAt
             FROM users
             WHERE email = ?
             LIMIT 1`,
            [email]
        );

        return rows[0] ?? null;
    }

    async findPublicById(id) {
        const [rows] = await this.database.execute(
            `SELECT
                id,
                email,
                role,
                created_at AS createdAt
             FROM users
             WHERE id = ?
             LIMIT 1`,
            [id]
        );

        return rows[0] ?? null;
    }

    async create({ email, passwordHash, role }) {
        const [result] = await this.database.execute(
            `INSERT INTO users (email, password_hash, role)
             VALUES (?, ?, ?)`,
            [email, passwordHash, role]
        );

        return this.findPublicById(result.insertId);
    }

    async findAllPublic() {
        const [rows] = await this.database.execute(
            `SELECT
                id,
                email,
                role,
                created_at AS createdAt
             FROM users
             ORDER BY id ASC`
        );

        return rows;
    }
}
