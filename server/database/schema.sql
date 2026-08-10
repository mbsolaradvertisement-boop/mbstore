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

CREATE TABLE IF NOT EXISTS customer_profiles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  customer_id VARCHAR(32) NOT NULL UNIQUE,
  customer_name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  phone_number VARCHAR(16) NULL UNIQUE,
  address VARCHAR(255) NULL,
  state VARCHAR(100) NULL,
  district VARCHAR(100) NULL,
  area VARCHAR(120) NULL,
  landmark VARCHAR(160) NULL,
  profile_completion TINYINT UNSIGNED NOT NULL DEFAULT 25,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_customer_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_customer_profile_search (customer_name, state, district),
  INDEX idx_customer_profile_phone (phone_number)
);

CREATE TABLE IF NOT EXISTS seller_profiles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  seller_id VARCHAR(32) NOT NULL UNIQUE,
  seller_name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  phone_number VARCHAR(16) NULL UNIQUE,
  address VARCHAR(255) NULL,
  state VARCHAR(100) NULL,
  district VARCHAR(100) NULL,
  area VARCHAR(120) NULL,
  landmark VARCHAR(160) NULL,
  company_name VARCHAR(160) NULL,
  business_email VARCHAR(254) NULL,
  gst CHAR(15) NULL UNIQUE,
  website VARCHAR(500) NULL,
  profile_completion TINYINT UNSIGNED NOT NULL DEFAULT 25,
  verification_status ENUM('Pending','Verified','Rejected') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_seller_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_seller_profile_search (seller_name, company_name),
  INDEX idx_seller_profile_location (state, district),
  INDEX idx_seller_profile_phone (phone_number)
);

CREATE TABLE IF NOT EXISTS companies (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id VARCHAR(32) NOT NULL UNIQUE,
  company_name VARCHAR(160) NOT NULL UNIQUE,
  logo_name VARCHAR(255) NOT NULL,
  logo_mime VARCHAR(50) NOT NULL,
  logo_data MEDIUMBLOB NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_company_admin FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_company_name (company_name),
  INDEX idx_company_created (created_at)
);

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_code VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL UNIQUE,
  slug VARCHAR(140) NOT NULL UNIQUE,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_categories_slug (slug),
  INDEX idx_categories_status (status)
);

CREATE TABLE IF NOT EXISTS category_field_templates (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT UNSIGNED NOT NULL,
  field_key VARCHAR(80) NOT NULL,
  field_label VARCHAR(120) NOT NULL,
  field_type ENUM('text','number','select','textarea','boolean') NOT NULL DEFAULT 'text',
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_category_template_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  UNIQUE KEY uq_category_field (category_id, field_key),
  INDEX idx_category_fields_order (category_id, sort_order)
);

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_code VARCHAR(32) NOT NULL UNIQUE,
  seller_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  company_id BIGINT UNSIGNED NULL,
  product_name VARCHAR(180) NOT NULL,
  brand VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('draft','active','inactive','pending','deleted') NOT NULL DEFAULT 'active',
  views INT UNSIGNED NOT NULL DEFAULT 0,
  enquiries INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  CONSTRAINT fk_product_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
  INDEX idx_products_seller (seller_id),
  INDEX idx_products_category (category_id),
  INDEX idx_products_company (company_id),
  INDEX idx_products_status (status),
  INDEX idx_products_code (product_code),
  INDEX idx_products_search (product_name, brand)
);

CREATE TABLE IF NOT EXISTS product_attributes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  field_key VARCHAR(80) NOT NULL,
  field_label VARCHAR(120) NOT NULL,
  field_value TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_attribute_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_product_attribute (product_id, field_key),
  INDEX idx_product_attributes_product (product_id),
  INDEX idx_product_attributes_key (field_key)
);

CREATE TABLE IF NOT EXISTS product_images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  image_url MEDIUMTEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_image_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_images_product (product_id, sort_order)
);

CREATE TABLE IF NOT EXISTS product_documents (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  document_type VARCHAR(50) NOT NULL DEFAULT 'datasheet',
  file_url VARCHAR(1000) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_document_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_documents_product (product_id)
);
