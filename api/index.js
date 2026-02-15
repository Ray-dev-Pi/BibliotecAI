// /api/index.js — Backend Serverless do BibliotecAI

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { db } from "../db.js"; // ⚠️ ajuste se seu db.js estiver em outro lugar

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ======================== ROTAS ========================

// 📚 LIVROS
app.get("/api/livros", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM livros ORDER BY criado_em DESC");
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar livros:", err);
    res.status(500).json({ erro: "Erro ao buscar livros" });
  }
});

// 👥 USUÁRIOS
app.get("/api/usuarios", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM usuarios ORDER BY criado_em DESC");
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar usuários:", err);
    res.status(500).json({ erro: "Erro ao buscar usuários" });
  }
});

// 🤝 EMPRÉSTIMOS
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

// =====================================================

// ❌ NÃO usar app.listen()
// Vercel cria o servidor automaticamente
// ======================== FRONTEND ========================

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir arquivos estáticos (CSS, JS, imagens, etc)
app.use(express.static(path.join(__dirname, "../Frontend/gestor/public")));

// Abrir login.html na rota principal "/"
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/gestor/public/login.html"));
});

export default app;
