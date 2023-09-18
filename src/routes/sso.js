const { Router } = require('express');
const { validationResult, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { storeApplication, getApplication, getUserById } = require('../database');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const router = Router();

router.get('/login', [
    query('redirectURL').isURL().withMessage('redirectURL must be a valid URL')
], async (req, res) => {
    if (validationResult(req).errors.length > 0) {
        return res.status(400).json({ message: validationResult(req).errors[0].msg });
    }
    const { redirectURL } = req.query;
    const url = new URL(redirectURL);
    if (redirectURL) {
        if (url.hostname != 'ssodemo.hah4.me') {
            return res.status(400).json({ message: 'redirectURL must be a valid URL' });
        }
    }
    if (!req.session.user && !redirectURL) {
        return res.redirect('/');
    }
    if (req.session.user && redirectURL) {
        let uuid = uuidv4().replace(/-/gi, '');
        await storeApplication({ url_origin: url.hostname, user_id: req.session.user, uuid });
        return res.redirect(`${redirectURL}?code=${uuid}`);
    }
    return res.redirect("/");
});


router.get('/jwtSSOVerify', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).json({ message: 'code is required' });
    if (!req.headers.authorization) return res.status(400).json({ message: 'Authorization header is required' });
    if (req.headers.authorization.split(' ')[1] !== process.env.SSO_SECRET_KEY) return res.status(400).json({ message: 'Authorization header is invalid' });
    const application = await getApplication(code);
    if (!application) return res.status(400).json({ message: 'code is invalid' });
    const { user_id } = application;
    const { username, email } = await getUserById(user_id);
    const privateKey = fs.readFileSync(__dirname + "/../../certs/privateKey.pem");
    const jwtToken = jwt.sign({ username, email }, privateKey, {
        algorithm: 'RS256',
        expiresIn: 60 * 60,
        allowInsecureKeySizes: true
    });
    return res.status(200).json({ jwtToken });
});

module.exports = router;