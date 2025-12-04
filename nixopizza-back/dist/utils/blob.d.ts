/**
 * Upload a Buffer to Vercel Blob and return { url, key }.
 * If BLOB_KEY_PREFIX is set, uses that; otherwise falls back to VERCEL_ENV or NODE_ENV.
 */
export declare function uploadBufferToBlob(key: string, buffer: Buffer, contentType: string): Promise<{
    url: string;
    key: string;
}>;
//# sourceMappingURL=blob.d.ts.map