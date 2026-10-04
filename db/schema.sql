CREATE TABLE IF NOT EXISTS posts (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug         VARCHAR(191) NOT NULL UNIQUE,
  title        VARCHAR(255) NOT NULL,
  description  VARCHAR(500) NOT NULL DEFAULT '',
  category     VARCHAR(100) NOT NULL DEFAULT 'General',
  cover        VARCHAR(500) NULL,
  content      MEDIUMTEXT NOT NULL,
  published    TINYINT(1) NOT NULL DEFAULT 0,
  published_at DATETIME NULL,
  created_at   DATETIME NOT NULL,
  updated_at   DATETIME NOT NULL,
  KEY posts_published_idx (published, published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
