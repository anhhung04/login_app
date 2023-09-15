const {getUser, createUser, pool} = require("../database");
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

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
    res.cookie('device_id', uuidv4(), { httpOnly: true, signed: true });
    req.session.justLogin = true
    return res.redirect('/dashboard');
}

async function createUserLocal(req, res, next){
    const {username, password, email} = req.body;
    const user = await getUser(username);
    if(user){
        res.status(409).json({message: "User already exists"});
    }
    const newUser = await createUser(username, password, email);
    req.session.user = newUser.id;
    req.session.justLogin = true;
    res.cookie('device_id', uuidv4(), { httpOnly: true, signed: true });
    return res.redirect('/dashboard');
}

module.exports = {
    checkUserLocal,
    createUserLocal,
}