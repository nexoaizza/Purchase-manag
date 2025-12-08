import multer from "multer";
/**
 * Backwards compatible function signature so existing code that did upload("categories")
 * does not crash. We ignore the folder argument now because we use blob storage.
 */
export declare const upload: () => multer.Multer;
//# sourceMappingURL=Multer.d.ts.map