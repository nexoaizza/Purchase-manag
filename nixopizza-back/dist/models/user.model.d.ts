import { Document } from "mongoose";
export interface IUser extends Document {
    fullname: string;
    email: string;
    password: string;
    avatar?: string;
    role: "admin" | "staff";
    isActive: boolean;
    phone1?: string;
    phone2?: string;
    phone3?: string;
    address: string;
    fcmToken?: string;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
declare const User: any;
export default User;
//# sourceMappingURL=user.model.d.ts.map