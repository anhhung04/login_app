const {Router} = require('express');
const { rateLimit } = require('express-rate-limit');
const  {validationResult, body} = require('express-validator')
const router = Router();
const {checkUserLocal, createUserLocal} = require("../controllers/auth")
const Recaptcha = require('express-recaptcha').RecaptchaV2;
const recaptcha = new Recaptcha(process.env.CAPTCHA_SITE_KEY, process.env.CAPTCHA_SECRET_KEY);


router.post("*", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false
}), [
    body('username').isLength({min: 3}).withMessage(message = "Username must be at least 3 characters long"),

    body('password').isLength({min: 8}).withMessage(message = "Password must be at least 8 characters long"),
], (req, res, next)=> {
    if(req.path === '/signup'){
        body('email').isEmail().withMessage(message = "Email must be a valid email address")
    }
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()})
    }
    next();
})

router.use(recaptcha.middleware.verify);

router.use((req, res, next) => {
    if (req.recaptcha.error) {
        if (req.path === '/signup') {
            return res.render('signup', {
                captcha: res.recaptcha,
                error: req.recaptcha.error,
                data: req.recaptcha.data
            });
        } else {
            return res.render('index', {
                captcha: res.recaptcha,
                error: req.recaptcha.error,
                data: req.recaptcha.data
            });
        }
    }
    next();
});

router.post('/login', checkUserLocal);
router.post('/signup', createUserLocal)


module.exports = router;