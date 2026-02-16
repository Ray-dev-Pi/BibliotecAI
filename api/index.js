// /api/index.js — Backend Serverless do BibliotecAI

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "../db.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ======================== FRONTEND (static) ========================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir arquivos estáticos (CSS, JS, imagens, etc)
app.use(express.static(path.join(__dirname, "../Frontend/gestor/public")));

// Abrir login.html na rota principal "/"
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/gestor/public/login.html"));
});

// ======================== ROTAS (API) ========================

// 📚 LIVROS (LISTAR)
app.get("/api/livros", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM livros ORDER BY criado_em DESC");
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar livros:", err);
    res.status(500).json({ erro: "Erro ao buscar livros" });
  }
});

// 📚 LIVROS (CRIAR)
app.post("/api/livros", async (req, res) => {
  try {
    const { titulo, autor, estoque } = req.body;

    if (!titulo || !titulo.trim()) {
      return res.status(400).json({ erro: "Título é obrigatório." });
    }

    const estoqueNum = Number.isFinite(Number(estoque)) ? Number(estoque) : 0;

    const [result] = await db.query(
      "INSERT INTO livros (titulo, autor, estoque) VALUES (?, ?, ?)",
      [titulo.trim(), autor?.trim() || null, estoqueNum]
    );

    const [rows] = await db.query("SELECT * FROM livros WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Erro ao cadastrar livro:", err);
    res.status(500).json({ erro: "Erro ao cadastrar livro" });
  }
});

// 👥 USUÁRIOS (LISTAR)
app.get("/api/usuarios", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM usuarios ORDER BY criado_em DESC");
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar usuários:", err);
    res.status(500).json({ erro: "Erro ao buscar usuários" });
  }
});

// 👥 USUÁRIOS (CRIAR) — salva tipo, matricula, turma, cpf, telefone
app.post("/api/usuarios", async (req, res) => {
  try {
    const { nome, tipo, matricula, turma, cpf, telefone, email } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ erro: "Nome é obrigatório." });
    }

    const tipoFinal = (tipo === "Aluno" || tipo === "Professor") ? tipo : "Outro";

    // Regras mínimas (ajuste se quiser)
    if (tipoFinal === "Aluno" && (!matricula || !turma || !telefone)) {
      return res.status(400).json({ erro: "Aluno precisa de matrícula, turma e telefone." });
    }
    if (tipoFinal === "Professor" && (!cpf || !telefone)) {
      return res.status(400).json({ erro: "Professor precisa de CPF e telefone." });
    }

    const [result] = await db.query(
      `INSERT INTO usuarios (nome, tipo, matricula, turma, cpf, telefone, email)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nome.trim(),
        tipoFinal,
        matricula?.trim() || null,
        turma?.trim() || null,
        cpf?.trim() || null,
        telefone?.trim() || null,
        email?.trim() || null
      ]
    );

    const [rows] = await db.query("SELECT * FROM usuarios WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Erro ao cadastrar usuário:", err);
    res.status(500).json({ erro: "Erro ao cadastrar usuário" });
  }
});

// 🤝 EMPRÉSTIMOS (LISTAR)
app.get("/api/emprestimos", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.id, u.nome AS usuario, l.titulo AS livro,
             DATE_FORMAT(e.data_emprestimo, '%d/%m/%Y') AS data,
             e.status
      FROM emprestimos e
      LEFT JOIN usuarios u ON e.usuario_id = u.id
      LEFT JOIN livros l ON e.livro_id = l.id
      ORDER BY e.data_emprestimo DESC
      LIMIT 10;
    `);
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar empréstimos:", err);
    res.status(500).json({ erro: "Erro ao buscar empréstimos" });
  }
});

// 📊 RESUMO
app.get("/api/emprestimos/resumo", async (req, res) => {
  try {
    const [[totais]] = await db.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'Atrasado') AS atrasados,
        SUM(status = 'Concluído') AS concluidos
      FROM emprestimos;
    `);
    res.json(totais);
  } catch (err) {
    console.error("Erro ao gerar resumo:", err);
    res.status(500).json({ erro: "Erro ao gerar resumo" });
  }
});

// 🔐 LOGIN
app.post("/api/login", async (req, res) => {
  const { usuario, senha } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM gestores WHERE usuario = ?", [usuario]);

    if (rows.length === 0) {
      return res.status(401).json({ erro: "Usuário não encontrado." });
    }

    const gestor = rows[0];
    const senhaCorreta = await bcrypt.compare(senha, gestor.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ erro: "Senha incorreta." });
    }

    res.json({
      mensagem: "Login bem-sucedido!",
      gestor: { id: gestor.id, nome: gestor.nome, usuario: gestor.usuario }
    });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ erro: "Erro interno no servidor." });
  }
});

// ======================== DEBUG DB ========================

app.get("/api/health", async (req, res) => {
  try {
    const [[r]] = await db.query("SELECT NOW() as now, DATABASE() as db;");
    const [tables] = await db.query("SHOW TABLES;");
    res.json({ ok: true, r, tablesCount: tables.length });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message,
      code: err.code
    });
  }
});

// Cria/Atualiza tabelas quando acessar /api/setup
app.get("/api/setup", async (req, res) => {
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS gestores (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      usuario VARCHAR(100) UNIQUE NOT NULL,
      senha VARCHAR(255) NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await db.query(`CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      tipo ENUM('Aluno','Professor','Outro') NOT NULL DEFAULT 'Outro',
      matricula VARCHAR(50) NULL,
      turma VARCHAR(50) NULL,
      cpf VARCHAR(20) NULL,
      telefone VARCHAR(30) NULL,
      email VARCHAR(150) NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Upgrade seguro: adiciona colunas se não existirem
    await db.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tipo ENUM('Aluno','Professor','Outro') NOT NULL DEFAULT 'Outro'`);
    await db.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS matricula VARCHAR(50) NULL`);
    await db.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS turma VARCHAR(50) NULL`);
    await db.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cpf VARCHAR(20) NULL`);
    await db.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefone VARCHAR(30) NULL`);

    await db.query(`CREATE TABLE IF NOT EXISTS livros (
      id INT AUTO_INCREMENT PRIMARY KEY,
      titulo VARCHAR(150) NOT NULL,
      autor VARCHAR(100),
      estoque INT DEFAULT 0,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await db.query(`CREATE TABLE IF NOT EXISTS emprestimos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NULL,
      livro_id INT NULL,
      data_emprestimo DATE NULL,
      status VARCHAR(50) NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    const [tables] = await db.query("SHOW TABLES;");
    res.json({ ok: true, tables });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err.message,
      code: err.code
    });
  }
});

export default app;
