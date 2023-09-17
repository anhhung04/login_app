const {createLoginInfo, findValidSession} = require('../database');
const { v4 : uuidv4 } = require('uuid');
async function isAuthenticate(req, res, next){

    if(req.session.user){
        let device_id = req.signedCookies.device_id;
        let ip = req.ipSource;
        if(ip === '::1' || ip === '::ffff:' || ip == '127.0.0.1' || ip.split('.').pop() === '1'){
            return next()
        }

        if (req.session.justLogin != true) {
            delete req.session.justLogin;
            let isValidSession = await findValidSession(device_id);
            if (!isValidSession) {
                return res.redirect('/');
            }
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