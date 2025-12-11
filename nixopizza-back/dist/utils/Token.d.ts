import jwt, { JwtPayload } from "jsonwebtoken";
export declare const generateToken: (userId: string, isAdmin: boolean, expiresIn?: string) => string;
export declare const verifyToken: (token: string, secret: string, options?: jwt.VerifyOptions) => string | JwtPayload;
//# sourceMappingURL=Token.d.ts.map