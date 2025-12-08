"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const generateToken = (userId, isAdmin, expiresIn = process.env.TOKEN_EXPIRES_IN || "7d") => {
    const access_secret = process.env.ACCESS_SECRET || "default_secret_key";
    const token = jsonwebtoken_1.default.sign({ userId, isAdmin }, access_secret, { expiresIn });
    return token;
};
exports.generateToken = generateToken;
const verifyToken = (token, secret, options) => {
    try {
        return jsonwebtoken_1.default.verify(token, secret, options);
    }
    catch (error) {
        throw new Error("Invalid token");
    }
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=Token.js.map