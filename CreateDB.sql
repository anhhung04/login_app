CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username varchar UNIQUE NOT NULL,
  password varchar,
  email varchar NOT NULL,
  auth_id integer
);

CREATE TABLE auth_infos (
  id SERIAL PRIMARY KEY,
  provider varchar,
  access_token varchar NOT NULL,
  refresh_token varchar,
  expire_in BIGINT
);

CREATE TABLE login_infos (
  id SERIAL PRIMARY KEY,
  ip varchar,
  location varchar,
  device_type varchar,
  device_id varchar UNIQUE,
  loggedInAt BIGINT,
  user_id integer
);

ALTER TABLE auth_infos ADD FOREIGN KEY (id) REFERENCES users (auth_id);

ALTER TABLE login_infos ADD FOREIGN KEY (user_id) REFERENCES users (id);
