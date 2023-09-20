const {createLoginInfo, findValidSession} = require('../database');
async function isAuthenticate(req, res, next) {
    let device_id = req.signedCookies.device_id;
    let user_id = req.session.user;
    if (!device_id || !user_id) {
        await req.session.destroy();
        return res.redirect('/');
    }

    let isValidSession = await findValidSession(device_id);

    if (req.session.justLogin) {
        delete req.session.justLogin;
        isValidSession = true;
    }

    if (!isValidSession) {
        await req.session.destroy();
        return res.redirect('/');
    }

    if (isValidSession) {
        let ip = req.ipSource

        if (ip === '::1' || ip === '::ffff:' || ip == '127.0.0.1' || ip.split('.').pop() === '1') {
            return next()
        }
        const { regionName, country } = await fetch(`http://ip-api.com/json/${ip}`).then(res => res.json());
        await createLoginInfo({
            ip: ip,
            location: `${regionName}, ${country}`,
            device_type: `${req.device.type} using ${req.useragent.browser}`,
            device_id,
            loggedInAt: Date.now(),
            user_id: req.session.user
        })
        return next();
    }

    await req.session.destroy()
    return res.redirect('/');
}


module.exports = {
    isAuthenticate
}