"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const database_1 = __importDefault(require("./config/database"));
const auth_router_1 = __importDefault(require("./routes/auth.router"));
const product_router_1 = __importDefault(require("./routes/product.router"));
const category_router_1 = __importDefault(require("./routes/category.router"));
const order_router_1 = __importDefault(require("./routes/order.router"));
const admin_router_1 = __importDefault(require("./routes/admin.router"));
const task_router_1 = __importDefault(require("./routes/task.router"));
const supplier_router_1 = __importDefault(require("./routes/supplier.router"));
const notification_router_1 = __importDefault(require("./routes/notification.router"));
const blobUpload_router_1 = __importDefault(require("./routes/blobUpload.router"));
const user_model_1 = __importDefault(require("./models/user.model"));
const expirationMonitoring_controller_1 = require("./controllers/expirationMonitoring.controller");
const swaggerSetup_1 = __importDefault(require("./config/swaggerSetup"));
if (process.env.NODE_ENV !== "production") {
    dotenv_1.default.config();
}
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Static legacy uploads (still needed for old avatar/image paths)
const UPLOADS_DIR = path_1.default.resolve("src/uploads");
app.use("/uploads", express_1.default.static(UPLOADS_DIR));
/**
 * Simplified CORS configuration (removed verbose debug + endpoints).
 * Allow explicit origins from environment variables; allow requests without origin (e.g., curl).
 */
const allowedOrigins = [
    process.env.CLIENT_ORIGIN,
    process.env.ADMIN_ORIGIN,
    process.env.PROD_CLIENT_ORIGIN,
    process.env.PROD_ADMIN_ORIGIN,
    process.env.STAG_CLIENT_ORIGIN,
    process.env.STAG_ADMIN_ORIGIN,
    process.env.DEV_CLIENT_ORIGIN,
    process.env.DEV_ADMIN_ORIGIN,
]
    .filter(Boolean)
    .map((o) => o.replace(/\/+$/, "")); // normalize
app.use((0, cors_1.default)({
    origin(origin, cb) {
        if (!origin)
            return cb(null, true);
        const clean = origin.replace(/\/+$/, "");
        if (allowedOrigins.includes(clean))
            return cb(null, true);
        return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));
// Basic health (keep)
app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
});
// Removed: /api/debug-cors and /api/debug-db endpoints & detailed console diagnostics
app.use("/api/uploads", blobUpload_router_1.default);
// Swagger UI
(0, swaggerSetup_1.default)(app);
app.use("/api/auth", auth_router_1.default);
app.use("/api/admin", admin_router_1.default);
app.use("/api/products", product_router_1.default);
app.use("/api/orders", order_router_1.default);
app.use("/api/categories", category_router_1.default);
app.use("/api/tasks", task_router_1.default);
app.use("/api/suppliers", supplier_router_1.default);
app.use("/api/notifications", notification_router_1.default);
const PORT = process.env.PORT || 5000;
async function ensureAdmin() {
    try {
        const fullname = (process.env.ADMIN_FULLNAME || "").trim();
        const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
        const password = (process.env.ADMIN_PASSWORD || "").trim();
        if (!fullname || !email || !password)
            return;
        const existingAdmin = await user_model_1.default.findOne({ email, role: "admin" });
        if (existingAdmin)
            return;
        await user_model_1.default.create({ fullname, email, password, role: "admin" });
    }
    catch (e) {
        console.error("ensureAdmin error:", e.message);
    }
}
let initialized = false;
async function initializeApp() {
    if (initialized)
        return;
    try {
        await (0, database_1.default)();
        await ensureAdmin();
        (0, expirationMonitoring_controller_1.initializeExpirationMonitoring)();
        initialized = true;
        if (process.env.NODE_ENV !== "production") {
            console.log("Server initialized");
        }
    }
    catch (err) {
        console.error("Initialization failed:", err);
        initialized = false;
    }
}
initializeApp().catch((err) => console.error(err));
if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
exports.default = app;
//# sourceMappingURL=index.js.map