import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

let pool;

export const db = (() => {
  if (!pool) {
    if (!process.env.MYSQL_URL) {
      throw new Error("MYSQL_URL não definida nas Environment Variables da Vercel.");
    }

    pool = mysql.createPool({
      uri: process.env.MYSQL_URL,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      connectTimeout: 15000,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
})();
