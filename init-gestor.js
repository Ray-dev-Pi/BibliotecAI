// init-gestor.js
import dotenv from "dotenv";
dotenv.config();
import { getConnection } from "./db.js";
import bcrypt from "bcrypt";

const defaultUser = process.env.DEFAULT_GESTOR_USER || "admin";
const defaultPass = process.env.DEFAULT_GESTOR_PASS || "admin123";

async function run() {
  const conn = await getConnection();
  try {
    // create db + tables if needed
    const initSql = `
      CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "bibliotecai"}\`;
      USE \`${process.env.DB_NAME || "bibliotecai"}\`;
      CREATE TABLE IF NOT EXISTS gestores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario VARCHAR(100) UNIQUE,
        senha VARCHAR(255),
        nome VARCHAR(150),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await conn.query(initSql);

    // connect to DB to insert user
    const pool = (await import("./db.js")).createPool;
    const poolConn = await (await import("./db.js")).createPool();
    const [rows] = await poolConn.query("SELECT COUNT(*) as cnt FROM gestores");
    if (rows[0].cnt === 0) {
      const hash = await bcrypt.hash(defaultPass, 10);
      await poolConn.query("INSERT INTO gestores (usuario, senha, nome) VALUES (?, ?, ?)", [defaultUser, hash, "Administrador"]);
      console.log(` Gestor criado: user='${defaultUser}', senha='${defaultPass}' (senha criptografada no banco)`);
    } else {
      console.log(" nenhuma alteração feita.");
    }
    await poolConn.end();
  } catch (err) {
    console.error("Erro init-gestor:", err);
  } finally {
    await conn.end();
  }
}

run();
