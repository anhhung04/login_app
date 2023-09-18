const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();


app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


const isAuthenticated = async (req, res, next) => {
    const redirectURL = "https://ssodemo.hah4.me/sso/call";
    const params = new URLSearchParams({ redirectURL }).toString();
    if (req.signedCookies.user_info) {
        return next();
    }
    return res.redirect(`https://test.hah4.me/sso/login?${params}`);
};


app.get('/', isAuthenticated, (req, res) => {
    const { username, email } = req.signedCookies.user_info;
    return res.status(200).json({ message: 'Welcome to dashboard', username, email });
});

app.get('/sso/call', async function (req, res) {
    const { code } = req.query;
    if (!code) return res.status(400).json({ message: 'code is required' });
    const { jwtToken } = await fetch(`https://test.hah4.me/sso/jwtSSOVerify?code=${code}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${process.env.SSO_SECRET_KEY}`
        }
    }).then(res => res.json());
    if (!jwtToken) return res.status(400).json({ message: 'jwtToken is required' });
    const publicKey = await fetch('https://test.hah4.me/public/publicKey.pem').then(res => res.text());

    const decoded = jwt.verify(jwtToken, publicKey, { algorithms: ['RS256'] });
    const { username, email } = decoded;

    res.cookie('user_info', JSON.stringify({ username, email }), { signed: true, maxAge: 1000 * 60 * 60, httpOnly: true, secure: true, domain: 'ssodemo.hah4.me' });
    return res.redirect('/');
});


app.use(function (err, req, res, next) {
    console.log(err);
    return res.status(500).send('500 Internal Server Error');
});


app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
