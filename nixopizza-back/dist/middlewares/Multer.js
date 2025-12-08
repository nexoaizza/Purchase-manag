"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
// Memory storage so it works on Vercel (no local disk writes)
const storage = multer_1.default.memoryStorage();
// Base upload instance
const baseUpload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
    },
    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowed.includes(file.mimetype)) {
            req.fileValidationError = "Invalid file type";
            return cb(null, false);
        }
        cb(null, true);
    },
});
/**
 * Backwards compatible function signature so existing code that did upload("categories")
 * does not crash. We ignore the folder argument now because we use blob storage.
 */
const upload = ( /* _folder?: string */) => baseUpload;
exports.upload = upload;
//# sourceMappingURL=Multer.js.map