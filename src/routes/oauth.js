const {Router} = require("express")
const {getAuthorizationCode, getAccessToken} = require("../controllers/oauth")
const router = Router();

router.param('oauthService', function (req, res, next, oauthService) {
    let services = ['google', 'facebook', 'discord', 'twitter']
    if(services.includes(oauthService)){
        req.service = oauthService
        return next()
    }
    return res.status(404).json({message: "Service not found"})
})

router.get("/:oauthService", getAuthorizationCode);

router.get("/:oauthService/call", getAccessToken);

module.exports = router