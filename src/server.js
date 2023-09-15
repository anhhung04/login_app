const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const redis = require('redis');
const RedisStore = require("connect-redis").default;
const device = require('express-device');
const useragent = require('express-useragent');

require('dotenv').config();
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});

let redisStore = new RedisStore({
    client: redisClient,
    prefix: "LoginOAuthSession:",
});

redisClient.on('error', err => console.log('Redis Client Error', err));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(cookieParser(process.env.COOKIE_SECRET));

app.use(device.capture());
app.use(useragent.express());

app.use(helmet({
    contentSecurityPolicy: true,
    referrerPolicy: true,
    frameguard: true,
    hidePoweredBy: true,
}));

app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60,
    },
    store: redisStore,
}));

app.use(function (req, res, next) {
    if (req.headers['cf-connecting-ip'] && process.env.USING_TUNNEL) {
        req.ipSource = req.headers['cf-connecting-ip'].split(/\s*,\s*/)[0];
    }
    next();
})

for (let route of fs.readdirSync(__dirname + '/routes')) {
    if (!route.endsWith(".js")) continue;
    route = route.split('.')[0];
    if (route === 'index') route = '';
    app.use("/" + route, require('./routes/' + route));
}

app.all('*', (req, res) => {
    return res.status(404).send('404 Not Found');
});

app.use(function (err, req, res, next) {
    console.log(err);
    return res.status(500).send('500 Internal Server Error');
});

module.exports = {
    redisClient,
    app,
};