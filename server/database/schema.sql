CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  role ENUM('Admin','Seller','Customer') NOT NULL,
  status ENUM('Pending','Verified','Rejected','Inactive') NOT NULL DEFAULT 'Pending',
  login_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role_status (role, status)
);
CREATE TABLE IF NOT EXISTS email_otps (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(254) NOT NULL,
  otp_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_otps_lookup (email, created_at),
  INDEX idx_email_otps_expiry (expires_at)
);
CREATE TABLE IF NOT EXISTS seller_verifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  business_name VARCHAR(160) NOT NULL,
  gst_number CHAR(15) NOT NULL UNIQUE,
  contact_person VARCHAR(120) NOT NULL,
  verification_status ENUM('Pending','Verified','Rejected') NOT NULL DEFAULT 'Pending',
  verified_by BIGINT UNSIGNED NULL,
  verified_at TIMESTAMP NULL,
  remarks VARCHAR(500) NULL,
  CONSTRAINT fk_seller_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_seller_admin FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  jwt_token CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  device VARCHAR(255) NULL,
  ip_address VARCHAR(45) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_expiry (expires_at)
);
