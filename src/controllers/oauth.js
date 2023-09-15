const oauthLinks = require('../config/oauthLinks');
const oauthCred = require('../config/oauthCred');
require('dotenv').config();
const { createAuthInfo, createUser, getUser } = require("../database");

async function getAuthorizationCode(req, res, next) {
    let state = Math.random().toString(36).substring(7) + Date.now().toString() + Math.random().toString(36).substring(7);
    let paramsObj = {
        redirect_uri: `https://${process.env.DOMAIN}/oauth/${req.service}/call`,
        response_type: 'code',
        client_id: oauthCred[req.service].client_id,
        state,
    }
    if(req.service != 'facebook'){
        paramsObj.scope = oauthLinks[req.service].scope
    }
    let params = new URLSearchParams(paramsObj).toString();
    res.cookie('state', state, { maxAge: 5 * 60 * 1000, httpOnly: true, signed: true });
    return res.redirect(`${oauthLinks[req.service].auth_uri}?${params}`);
}

async function getAccessToken(req, res, next) {
    if (!req.query.code) {
        return res.status(400).json({ message: 'Code not found' });
    }
    if (!req.query.state) {
        return res.status(400).json({ message: 'State not found' });
    }

    if (req.query.state !== req.signedCookies.state) {
        return res.status(400).json({ message: 'State not match' });
    }
    let tokenData = await fetch(`${oauthLinks[req.service].token_url}`, {
        method: 'POST',
        body: new URLSearchParams({
            client_id: oauthCred[req.service].client_id,
            client_secret: oauthCred[req.service].client_secret,
            code: req.query.code,
            grant_type: 'authorization_code',
            redirect_uri: `https://${process.env.DOMAIN}/oauth/${req.service}/call`,
        }).toString(),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    }).then(res => res.json());
    if (!tokenData.access_token) {
        return res.status(400).json({ message: tokenData });
    }
    let authInfo = await createAuthInfo({
        provider: req.service,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expire_in: 3600 * 1000 + Date.now(),
    });
    let userInfoFromProvider;
    if (tokenData.token_type == 'Bearer') {
        userInfoFromProvider = await fetch(`${oauthLinks[req.service].userInfo}`, {
            method: 'GET',
            headers: {
                'Authorization': `${tokenData.token_type} ${tokenData.access_token}`,
            }
        }).then(res => res.json());
    } else {
        userInfoFromProvider = await fetch(`${oauthLinks[req.service].userInfo}?access_token=${tokenData.access_token}&field=${oauthLinks[req.service].scope}`, {
            method: 'GET',
        }).then(res => res.json());
    }
    let user;
    let username = userInfoFromProvider.sub || userInfoFromProvider.id;
    let email = userInfoFromProvider.email || `${username}@${req.service}.com`;
    let checkUserInDB = await getUser(username);
    if (checkUserInDB) {
        user = checkUserInDB;
    } else {
        user = await createUser(username, Math.random().toString(36).substring(2, 30) + Date.now().toString() + Math.random().toString(36).substring(7), email, authInfo.id);
    }
    req.session.user = user.id;
    return res.redirect('/dashboard');
}


module.exports = {
    getAuthorizationCode,
    getAccessToken,
}