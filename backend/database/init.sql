CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'administrator') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS api_usage (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    status_code SMALLINT UNSIGNED NOT NULL,
    duration_ms INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_api_usage_user_created (user_id, created_at),
    KEY idx_api_usage_endpoint_created (endpoint, created_at),
    KEY idx_api_usage_created (created_at),
    CONSTRAINT fk_api_usage_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
