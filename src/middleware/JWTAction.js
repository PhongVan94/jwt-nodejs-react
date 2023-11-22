import jwt from 'jsonwebtoken';
require("dotenv").config();

const nonSecurePaths = ['/', '/login', '/register', '/logout'];


const createJWT = (payload) => {
    let key = process.env.JWT_SECRET;
    let token = null;
    try {
        token = jwt.sign(payload, key, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });
    } catch (error) {
        console.log(error)
    }
    return token;
}

const verifyToken = (token) => {
    let key = process.env.JWT_SECRET;
    let decoded = null;

    try {
        decoded = jwt.verify(token, key);
    } catch (error) {
        console.log(error);
    }
    return decoded;
}
const extractToken = (req) => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
    }
    return null;
}


const checkUserJWT = (req, res, next) => {
    if (nonSecurePaths.includes(req.path)) return next();

    let cookies = req.cookies;
    let tokenFromHeader = extractToken(req);

    if (cookies && cookies.jwt || tokenFromHeader) {
        let token = cookies && cookies.jwt ? cookies.jwt : tokenFromHeader;
        let decoded = verifyToken(token);
        if (decoded) {
            req.user = decoded;
            req.token = token;

            next();
        } else {
            return res.status(401).json({
                EM: 'Not Authenticated User',
                EC: -1,
                DT: ''
            })
        }
    }

    else {
        return res.status(401).json({
            EM: 'Not Authenticated User',
            EC: -1,
            DT: ''
        })
    }
}

const checkUserPermission = (req, res, next) => {
    if (nonSecurePaths.includes(req.path) || (req.path === '/account')) return next();
    if (req.user) {
        let email = req.user.email;
        let roles = req.user.groupWithRoles.Roles;
        let currentUrl = req.path;
        if (!roles || roles.length === 0) {
            return res.status(403).json({
                EM: 'You dont have permission to access!',
                EC: -1,
                DT: ''
            })
        }
        let canAccess = roles.some(item => item.url === currentUrl || currentUrl.includes(item.url));
        if (canAccess) {
            next();
        } else {
            return res.status(403).json({
                EM: 'You dont have permission to access!',
                EC: -1,
                DT: ''
            })
        }


    } else {
        return res.status(401).json({
            EM: 'Not Authenticated User',
            EC: -1,
            DT: ''
        })
    }
}

module.exports = {
    createJWT, verifyToken, checkUserJWT, checkUserPermission
}