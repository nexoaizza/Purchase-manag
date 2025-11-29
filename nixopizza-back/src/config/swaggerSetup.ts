import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger.json";

export default function setupSwagger(app: express.Application) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument as any));
  app.get("/api-docs.json", (_req, res) => res.json(swaggerDocument));
}
