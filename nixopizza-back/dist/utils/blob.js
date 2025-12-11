"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBufferToBlob = uploadBufferToBlob;
const blob_1 = require("@vercel/blob");
/**
 * Upload a Buffer to Vercel Blob and return { url, key }.
 * If BLOB_KEY_PREFIX is set, uses that; otherwise falls back to VERCEL_ENV or NODE_ENV.
 */
async function uploadBufferToBlob(key, buffer, contentType) {
    const explicitPrefix = (process.env.BLOB_KEY_PREFIX || "").replace(/^\/+|\/+$/g, "");
    const envName = (process.env.VERCEL_ENV || process.env.NODE_ENV || "development").toString();
    const derivedPrefix = envName.replace(/^\/+|\/+$/g, "");
    const prefix = explicitPrefix || derivedPrefix;
    const path = prefix ? `${prefix}/${key}` : key;
    const { url } = await (0, blob_1.put)(path, buffer, {
        access: "public",
        contentType,
    });
    return { url, key: path };
}
//# sourceMappingURL=blob.js.map