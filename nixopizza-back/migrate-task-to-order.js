/**
 * Migration script: Rename taskNumber field to orderNumber in the StaffOrders collection.
 *
 * The "tasks" feature has been renamed to "orders".
 * - The Mongoose model was renamed from "Task" to "StaffOrder" (collection: stafforders).
 * - The field "taskNumber" was renamed to "orderNumber".
 * - Existing documents that still have "taskNumber" need to be migrated.
 *
 * Usage:
 *   node migrate-task-to-order.js
 *
 * Ensure the MONGODB_URI environment variable is set, or update the connection
 * string below before running.
 */

const { MongoClient } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/your-database-name";

async function migrate() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();

    // Rename the collection from "tasks" (old model name "Task") to "stafforders" (new model name "StaffOrder")
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    if (collectionNames.includes("tasks") && !collectionNames.includes("stafforders")) {
      await db.collection("tasks").rename("stafforders");
      console.log('Renamed collection "tasks" -> "stafforders"');
    } else if (collectionNames.includes("stafforders")) {
      console.log('Collection "stafforders" already exists, skipping rename.');
    } else {
      console.log('Collection "tasks" not found. Nothing to rename.');
    }

    // Rename the "taskNumber" field to "orderNumber" in all documents
    const stafforders = db.collection("stafforders");
    const result = await stafforders.updateMany(
      { taskNumber: { $exists: true } },
      { $rename: { taskNumber: "orderNumber" } }
    );

    console.log(
      `Renamed "taskNumber" -> "orderNumber" in ${result.modifiedCount} document(s).`
    );

    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

migrate();
