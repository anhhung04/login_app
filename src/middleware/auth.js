const {createLoginInfo, findValidSession} = require('../database');
const { v4 : uuidv4 } = require('uuid');
async function isAuthenticate(req, res, next){
    if(req.session.user){
        let ip = req.ip;
        if(ip === '::1' || ip === '::ffff:' || ip == '127.0.0.1' || ip.split('.').pop() === '1'){
            ip='42.117.101.160'//return next()
        }
        const {regionName, country} = await fetch(`http://ip-api.com/json/${ip}`).then(res => res.json());
        let device_id = req.signedCookies.device_id;
        if (!device_id) {
            device_id = uuidv4();
            res.cookie('device_id', device_id, { httpOnly: true, signed: true})
        }
        let isValidSession = await findValidSession(device_id);
        if(!isValidSession){
            return res.redirect('/');
        }   
        await createLoginInfo({
            ip: ip,
            location: `${regionName}, ${country}`,
            device_type: req.device.type,
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