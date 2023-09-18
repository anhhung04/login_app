const {Pool} = require('pg');
require('dotenv').config()
const bcrypt = require('bcrypt')
const salt = bcrypt.genSaltSync(10)

const pool = new Pool({
    user: process.env.PGUSER || 'login_app',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'login_app_db',
    password: process.env.PGPASSWORD || '123456789',
    port: process.env.PGPORT || 5432,
})

const getUser = async (username) => {
    const results = await pool.query('SELECT * FROM users WHERE username = $1', [username])
    return results.rows[0]
}

const getUserById = async (id) => {
    const results = await pool.query('SELECT * FROM users WHERE id = $1', [id])
    return results.rows[0]
}

const createUser = async (username, password, email, auth_id=0) => {
    const hash = bcrypt.hashSync(password, salt)
    const results = await pool.query('INSERT INTO users (username, password, email, auth_id) VALUES ($1, $2, $3, $4) RETURNING *', [username, hash, email, auth_id]);
    return results.rows[0]
};

const getLoginInfos = async function(user_id){
    const results = await pool.query('SELECT * FROM login_infos WHERE user_id = $1', [user_id]);
    return results.rows;
}

const createLoginInfo = async function({
    ip,
    location,
    device_type,
    device_id,
    loggedInAt,
    user_id,
}){
    const loginInfos = await getLoginInfos(user_id);
    let existLoginInfo = loginInfos.find(loginInfo => loginInfo.device_id === device_id);
    if(existLoginInfo){
        await pool.query('UPDATE login_infos SET ip = $1, location = $2, device_type = $3, loggedInAt = $4 WHERE device_id = $5', [ip, location, device_type,loggedInAt,device_id]);
        return existLoginInfo;
    }
    if(loginInfos.length >= 5){
        await pool.query('DELETE FROM login_infos WHERE id = $1', [loginInfos[0].id]);
    }
    const results = await pool.query('INSERT INTO login_infos (ip, location, device_type, device_id, loggedInAt,user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [ip, location, device_type, device_id, loggedInAt,user_id]);
    return results.rows[0]
}

const createAuthInfo = async function({
    provider,
    access_token,
    refresh_token,
    expire_in,
}){
    const results = await pool.query('INSERT INTO auth_infos (provider, access_token, refresh_token, expire_in) VALUES ($1, $2, $3, $4) RETURNING *', [provider, access_token, refresh_token, expire_in]);
    return results.rows[0]
}

const deleteLoginInfo = async function(device_id){
    const results = await pool.query('DELETE FROM login_infos WHERE device_id = $1', [device_id]);
    return results.rows[0]
}

const findValidSession = async function(device_id){
    const results = await pool.query('SELECT * FROM login_infos WHERE device_id = $1', [device_id]);
    return results.rows[0]
}

const storeApplication = async function ({ url_origin, user_id, uuid }) {
    const results = await pool.query('INSERT INTO sso_sessions (url_origin, user_id, uuid) VALUES ($1, $2, $3) RETURNING *', [url_origin, user_id, uuid]);
    return results.rows[0];
};

const getApplication = async function (uuid) {
    const results = await pool.query('SELECT * FROM sso_sessions WHERE uuid = $1', [uuid]);
    if (results.rows.length > 0) {
        await pool.query('DELETE FROM sso_sessions WHERE uuid = $1', [uuid]);
    }
    return results.rows[0];
}

module.exports = {
    pool,
    getUser,
    createUser,
    createLoginInfo,
    getLoginInfos,
    getUserById,
    createAuthInfo,
    deleteLoginInfo,
    findValidSession,
    storeApplication,
    getApplication
}
