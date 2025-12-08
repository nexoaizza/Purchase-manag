"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFcmToken = exports.updateUser = exports.refreshTokens = exports.logout = exports.login = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const Token_1 = require("../utils/Token");
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: "Email and password are required" });
            return;
        }
        const user = await user_model_1.default.findOne({ email }).select("+password");
        if (!user) {
            res.status(400).json({ message: "User not found" });
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(400).json({ message: "Invalid credentials" });
            return;
        }
        if (!user.isActive) {
            res.status(403).json({ message: "User is not active" });
            return;
        }
        const token = (0, Token_1.generateToken)(user._id, user.role === "admin");
        res.status(200).json({
            message: "Login successful",
            user: {
                _id: user._id,
                createdAt: user.createdAt,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                updatedAt: user.updatedAt,
                fullname: user.fullname,
                avatar: user.avatar,
            },
            access_token: token,
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.login = login;
const logout = async (_, res) => {
    try {
        // With single-token auth there is no server-side session to clear;
        // client should remove stored token on logout.
        res.status(200).json({ message: "Logout successful" });
    }
    catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.logout = logout;
const refreshTokens = async (req, res) => {
    try {
        // Expect current token in Authorization header and re-issue a fresh token
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            res.status(401).json({ message: "Unauthorized: No token provided" });
            return;
        }
        const currentToken = authHeader.split(" ")[1];
        const ACCESS_SECRET = process.env.ACCESS_SECRET || "default_secret_key";
        let decoded;
        // First try strict verification (will fail if token expired)
        try {
            decoded = (0, Token_1.verifyToken)(currentToken, ACCESS_SECRET);
        }
        catch (err) {
            // If verification fails, try verifying signature only (ignore expiration)
            try {
                decoded = (0, Token_1.verifyToken)(currentToken, ACCESS_SECRET, { ignoreExpiration: true });
            }
            catch (err2) {
                res.status(400).json({ message: "Invalid token" });
                return;
            }
        }
        if (typeof decoded === "string") {
            res.status(400).json({ message: "Invalid token" });
            return;
        }
        const userId = decoded.userId;
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        if (!user.isActive) {
            res.status(403).json({ message: "User is blocked" });
            return;
        }
        const token = (0, Token_1.generateToken)(user._id, user.role === "admin");
        res.status(200).json({ message: "Token refreshed", access_token: token });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Internal server error", error: error.message });
    }
};
exports.refreshTokens = refreshTokens;
const updateUser = async (req, res) => {
    try {
        const { password, newPassword } = req.body;
        const userId = req.user?.userId;
        const user = await user_model_1.default.findById(userId).select("+password");
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        if (newPassword && password) {
            const isMatch = await user.comparePassword(password.toString());
            if (!isMatch) {
                res
                    .status(400)
                    .json({ message: "The Password You provided is not correct" });
                return;
            }
            user.password = newPassword;
        }
        await user.save();
        res.status(200).json({
            message: " User Updated Successfully",
        });
    }
    catch (error) {
        console.error("Update user error:", error);
        res
            .status(500)
            .json({ message: "Internal server error", error: error.message });
    }
};
exports.updateUser = updateUser;
const updateFcmToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        if (!fcmToken || typeof fcmToken !== "string" || fcmToken.trim().length === 0) {
            res.status(400).json({ message: "Valid fcmToken is required" });
            return;
        }
        const userId = req.user?.userId;
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        user.fcmToken = fcmToken;
        await user.save();
        res.status(200).json({
            message: "FCM token updated successfully",
        });
    }
    catch (error) {
        console.error("Update FCM token error:", error);
        res
            .status(500)
            .json({ message: "Internal server error", error: error.message });
    }
};
exports.updateFcmToken = updateFcmToken;
//# sourceMappingURL=auth.controller.js.map