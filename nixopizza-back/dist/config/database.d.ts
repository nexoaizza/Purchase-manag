import mongoose from "mongoose";
declare global {
    var __mongooseConn: Promise<typeof mongoose> | undefined;
}
/**
 * Append dbName to an Atlas SRV URI if it has no path already.
 */
export declare function ensureDbInUri(uri: string, dbName: string | undefined): string;
export default function connectDB(): Promise<typeof mongoose | mongoose.Connection>;
//# sourceMappingURL=database.d.ts.map