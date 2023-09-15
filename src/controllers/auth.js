const {getUser, createUser, pool} = require("../database");
const bcrypt = require('bcrypt');

async function checkUserLocal(req, res, next){
    const {username, password} = req.body;
    const user = await getUser(username);
    if(!user){
        res.status(404).json({message: "User not found"});
    }
    const match = await bcrypt.compare(password, user.password);
    if(!match){
        res.status(403).json({message: "Invalid credentials"});
    }
    req.session.user = user.id;
    return res.redirect('/dashboard');
}

async function createUserLocal(req, res, next){
    const {username, password, email} = req.body;
    const user = await getUser(username);
    if(user){
        res.status(409).json({message: "User already exists"});
    }
    const newUser = await createUser(username, password, email);
    console.log("🚀 ~ file: auth.js:25 ~ createUserLocal ~ newUser:", newUser)
    req.session.user = newUser.id;
    return res.redirect('/dashboard');
}

module.exports = {
    checkUserLocal,
    createUserLocal,
}