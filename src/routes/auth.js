const {Router} = require('express');
const  {validationResult, body} = require('express-validator')
const router = Router();
const {checkUserLocal, createUserLocal} = require("../controllers/auth")


router.post("*", [
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

router.post('/login', checkUserLocal);
router.post('/signup', createUserLocal)


module.exports = router;