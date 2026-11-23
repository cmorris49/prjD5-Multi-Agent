// Manages the MySQL connection pool and database queries for the backend.
import mysql from "mysql2/promise";

export class Database {
    #environment;
    #pool = null;

    constructor(environment = process.env) {
        this.#environment = environment;
    }

    async execute(sql, parameters = []) {
        if (typeof sql !== "string" || !sql.trim()) {
            throw new TypeError("A non-empty SQL statement is required.");
        }

        if (!Array.isArray(parameters)) {
            throw new TypeError("Query parameters must be an array.");
        }

        const pool = this.#getPool();

        return pool.execute(sql, parameters);
    }

    async testConnection() {
        const pool = this.#getPool();
        let connection;

        try {
            connection = await pool.getConnection();
            await connection.ping();
        } catch (error) {
            throw new Error(
                `Database connection failed: ${error.message}`,
                { cause: error }
            );
        } finally {
            connection?.release();
        }
    }

    async close() {
        if (!this.#pool) {
            return;
        }

        const pool = this.#pool;
        this.#pool = null;

        await pool.end();
    }

    #getPool() {
        if (!this.#pool) {
            this.#pool = mysql.createPool(this.#getConfiguration());
        }

        return this.#pool;
    }

    #getConfiguration() {
        const requiredVariables = [
            "DB_HOST",
            "DB_NAME",
            "DB_USER",
            "DB_PASSWORD"
        ];

        const missingVariables = requiredVariables.filter(
            variable => !this.#environment[variable]?.trim()
        );

        if (missingVariables.length > 0) {
            throw new Error(
                `Missing database configuration: ${missingVariables.join(", ")}`
            );
        }

        return {
            host: this.#environment.DB_HOST.trim(),
            port: this.#parseInteger("DB_PORT", 3306, 1, 65535),
            database: this.#environment.DB_NAME.trim(),
            user: this.#environment.DB_USER.trim(),
            password: this.#environment.DB_PASSWORD,
            waitForConnections: true,
            connectionLimit: this.#parseInteger(
                "DB_CONNECTION_LIMIT",
                10,
                1,
                100
            ),
            queueLimit: 0,
            charset: "utf8mb4"
        };
    }

    #parseInteger(variable, defaultValue, minimum, maximum) {
        const rawValue = this.#environment[variable];

        if (rawValue === undefined || rawValue.trim() === "") {
            return defaultValue;
        }

        const value = Number(rawValue);

        if (!Number.isInteger(value) || value < minimum || value > maximum) {
            throw new Error(
                `${variable} must be an integer from ${minimum} to ${maximum}.`
            );
        }

        return value;
    }
}
