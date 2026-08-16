const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL error:", error);
});

const testDatabaseConnection = async () => {
  try {
    const client = await pool.connect();

    console.log("PostgreSQL database connected successfully.");

    client.release();
  } catch (error) {
    console.error("PostgreSQL connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = {
  pool,
  testDatabaseConnection,
};