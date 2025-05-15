CREATE TABLE permissions
(
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category    VARCHAR(50) NOT NULL
);

INSERT INTO permissions (name, description, category) VALUES
('SYSTEM_ADMIN_ACCESS', 'Grants full administrative access to the system (highest level)', 'ADMINISTRATION'),

('EVENT_MANAGE_ALL', 'Allows creating, reading, updating, and deleting any event', 'EVENT_MANAGEMENT'),
('EVENT_READ_PUBLIC', 'Allows reading all publicly available event listings and details', 'EVENT_OPERATIONS'),

('BOOKING_MANAGE_OWN', 'Allows creating, reading, and canceling own bookings', 'BOOKING_OPERATIONS'),
('BOOKING_MANAGE_ALL', 'Allows admin to view/manage all bookings (e.g., for support)', 'BOOKING_MANAGEMENT'),

('USER_PROFILE_ACCESS_SELF', 'Allows accessing and managing own user profile', 'USER_PROFILE');

CREATE TABLE role_permissions
(
    role_id       BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
);

CREATE INDEX idx_role_permissions_role_id ON role_permissions (role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions (permission_id);

-- Assign Permissions to Roles
-- ROLE_USER permissions:
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'ROLE_USER'
  AND p.name IN (
    'EVENT_READ_PUBLIC',
    'BOOKING_MANAGE_OWN',
    'USER_PROFILE_ACCESS_SELF'
  );

-- ROLE_ADMIN permissions:
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'ROLE_ADMIN'
  AND p.name IN (
    'SYSTEM_ADMIN_ACCESS',
    'EVENT_MANAGE_ALL',
    'EVENT_READ_PUBLIC',
    'BOOKING_MANAGE_ALL',
    'BOOKING_MANAGE_OWN',
    'USER_PROFILE_ACCESS_SELF'
  );
