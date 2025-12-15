"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const crypto_1 = __importDefault(require("crypto"));
const blob_1 = require("../utils/blob");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB - adjust as needed
});
router.post("/upload", upload.single("file"), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ error: "No file provided" });
        const ext = (req.file.originalname.match(/\.[^/.]+$/) || [".bin"])[0];
        const unique = crypto_1.default.randomBytes(8).toString("hex");
        const key = `${Date.now()}-${unique}${ext}`;
        const { url, key: storedKey } = await (0, blob_1.uploadBufferToBlob)(key, req.file.buffer, req.file.mimetype);
        // Save `url` or `storedKey` in DB if you need to associate with records.
        res.json({ url, key: storedKey });
    }
    catch (err) {
        console.error("Blob upload error:", err);
        res.status(500).json({ error: "Upload failed" });
    }
});
exports.default = router;
//# sourceMappingURL=blobUpload.router.js.map