// db.js — Conexão MySQL para Vercel (usando MYSQL_URL)

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

let pool;

export const db = (() => {
  if (!pool) {
    pool = mysql.createPool(process.env.MYSQL_URL, {
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      connectTimeout: 10000,
    });
  }
  return pool;
})();
