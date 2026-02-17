// /api/index.js — Backend Serverless do BibliotecAI (Vercel + Railway MySQL)

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

app.use(express.static(path.join(__dirname, "../Frontend/gestor/public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/gestor/public/login.html"));
});

// ======================== ROTAS (API) ========================

// 📚 LIVROS (LISTAR) — completo
app.get("/api/livros", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, area, tombo, autor, titulo, vol, edicao, local, editora, ano, estoque, criado_em
      FROM livros
      ORDER BY criado_em DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar livros:", err);
    res.status(500).json({ erro: "Erro ao buscar livros" });
  }
});

// 📚 LIVROS (CRIAR) — completo
app.post("/api/livros", async (req, res) => {
  try {
    const { area, tombo, autor, titulo, vol, edicao, local, editora, ano, estoque } = req.body;

    if (!titulo || !titulo.trim()) return res.status(400).json({ erro: "Título é obrigatório." });
    if (!autor || !autor.trim()) return res.status(400).json({ erro: "Autor é obrigatório." });
    if (!area || !area.trim()) return res.status(400).json({ erro: "Área do conhecimento é obrigatória." });
    if (!editora || !editora.trim()) return res.status(400).json({ erro: "Editora é obrigatória." });

    if (tombo === undefined || tombo === null || String(tombo).trim() === "") {
      return res.status(400).json({ erro: "Tombo é obrigatório." });
    }
    if (ano === undefined || ano === null || String(ano).trim() === "") {
      return res.status(400).json({ erro: "Ano é obrigatório." });
    }

    const tomboNum = Number(tombo);
    const anoNum = Number(ano);
    const estoqueNum = Number.isFinite(Number(estoque)) ? Number(estoque) : 1;

    if (!Number.isFinite(tomboNum)) return res.status(400).json({ erro: "Tombo inválido." });
    if (!Number.isFinite(anoNum)) return res.status(400).json({ erro: "Ano inválido." });

    const [result] = await db.query(
      `INSERT INTO livros (area, tombo, autor, titulo, vol, edicao, local, editora, ano, estoque)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        area.trim(),
        tomboNum,
        autor.trim(),
        titulo.trim(),
        vol?.trim() || null,
        edicao?.trim() || null,
        local?.trim() || null,
        editora.trim(),
        anoNum,
        estoqueNum
      ]
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

// 👥 USUÁRIOS (CRIAR)
app.post("/api/usuarios", async (req, res) => {
  try {
    const { nome, tipo, matricula, turma, cpf, telefone, email } = req.body;

    if (!nome || !nome.trim()) return res.status(400).json({ erro: "Nome é obrigatório." });

    const tipoFinal = (tipo === "Aluno" || tipo === "Professor") ? tipo : "Outro";

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

// ======================== EMPRÉSTIMOS ========================

// 🤝 EMPRÉSTIMOS (CRIAR) — transaction + estoque seguro + data/hora + data prevista
app.post("/api/emprestimos", async (req, res) => {
  const { usuario_id, livro_id, data_prevista } = req.body;

  if (!usuario_id || !livro_id) {
    return res.status(400).json({ erro: "Usuário e livro são obrigatórios." });
  }
  if (!data_prevista) {
    return res.status(400).json({ erro: "Data prevista de devolução é obrigatória." });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [usuario] = await conn.query("SELECT id FROM usuarios WHERE id = ?", [usuario_id]);
    if (usuario.length === 0) {
      await conn.rollback();
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    const [livro] = await conn.query(
      "SELECT id, estoque FROM livros WHERE id = ? FOR UPDATE",
      [livro_id]
    );

    if (livro.length === 0) {
      await conn.rollback();
      return res.status(404).json({ erro: "Livro não encontrado." });
    }

    if (Number(livro[0].estoque) <= 0) {
      await conn.rollback();
      return res.status(400).json({ erro: "Livro sem estoque disponível." });
    }

    // Cria empréstimo (hora real no servidor)
    const [result] = await conn.query(
      `INSERT INTO emprestimos (usuario_id, livro_id, data_hora, data_prevista, status)
       VALUES (?, ?, NOW(), ?, 'Ativo')`,
      [usuario_id, livro_id, data_prevista]
    );

    await conn.query("UPDATE livros SET estoque = estoque - 1 WHERE id = ?", [livro_id]);

    await conn.commit();

    const [novo] = await db.query(
      `SELECT e.id, e.usuario_id, e.livro_id, e.data_hora, e.data_prevista, e.data_devolucao, e.status,
              u.nome AS usuario, l.titulo AS livro
       FROM emprestimos e
       LEFT JOIN usuarios u ON u.id = e.usuario_id
       LEFT JOIN livros l ON l.id = e.livro_id
       WHERE e.id = ?`,
      [result.insertId]
    );

    res.status(201).json(novo[0]);
  } catch (err) {
    await conn.rollback();
    console.error("Erro ao criar empréstimo:", err);
    res.status(500).json({ erro: "Erro ao criar empréstimo." });
  } finally {
    conn.release();
  }
});

// 🤝 EMPRÉSTIMOS (LISTAR) — ATIVOS
app.get("/api/emprestimos", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.id, e.usuario_id, e.livro_id,
             u.nome AS usuario, l.titulo AS livro,
             e.data_hora,
             DATE_FORMAT(e.data_prevista, '%Y-%m-%d') AS data_prevista,
             e.status
      FROM emprestimos e
      LEFT JOIN usuarios u ON e.usuario_id = u.id
      LEFT JOIN livros l ON e.livro_id = l.id
      WHERE e.status <> 'Concluído'
      ORDER BY e.data_hora DESC
      LIMIT 100;
    `);
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar empréstimos:", err);
    res.status(500).json({ erro: "Erro ao buscar empréstimos" });
  }
});

// 🚨 PENDÊNCIAS — passou 2 dias da data prevista e ainda não devolveu
app.get("/api/emprestimos/pendencias", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.id, e.usuario_id, e.livro_id,
             u.nome AS usuario, l.titulo AS livro,
             e.data_hora,
             DATE_FORMAT(e.data_prevista, '%Y-%m-%d') AS data_prevista,
             'Atrasado' AS status
      FROM emprestimos e
      LEFT JOIN usuarios u ON e.usuario_id = u.id
      LEFT JOIN livros l ON e.livro_id = l.id
      WHERE e.status <> 'Concluído'
        AND e.data_prevista IS NOT NULL
        AND CURDATE() > DATE_ADD(e.data_prevista, INTERVAL 2 DAY)
      ORDER BY e.data_prevista ASC
      LIMIT 200;
    `);

    // Opcional: marcar status no banco como Atrasado automaticamente
    await db.query(`
      UPDATE emprestimos
      SET status = 'Atrasado'
      WHERE status <> 'Concluído'
        AND data_prevista IS NOT NULL
        AND CURDATE() > DATE_ADD(data_prevista, INTERVAL 2 DAY)
    `);

    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar pendências:", err);
    res.status(500).json({ erro: "Erro ao buscar pendências" });
  }
});

// 📚 HISTÓRICO — concluídos
app.get("/api/emprestimos/historico", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT e.id, e.usuario_id, e.livro_id,
             u.nome AS usuario, l.titulo AS livro,
             e.data_hora,
             DATE_FORMAT(e.data_prevista, '%Y-%m-%d') AS data_prevista,
             e.data_devolucao,
             e.status
      FROM emprestimos e
      LEFT JOIN usuarios u ON e.usuario_id = u.id
      LEFT JOIN livros l ON e.livro_id = l.id
      WHERE e.status = 'Concluído'
      ORDER BY e.data_devolucao DESC
      LIMIT 200;
    `);
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar histórico:", err);
    res.status(500).json({ erro: "Erro ao buscar histórico" });
  }
});

// ✅ DEVOLVER — registra data_devolucao e devolve estoque
app.patch("/api/emprestimos/:id/devolver", async (req, res) => {
  const emprestimoId = req.params.id;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [emp] = await conn.query(
      "SELECT id, livro_id, status FROM emprestimos WHERE id = ? FOR UPDATE",
      [emprestimoId]
    );

    if (emp.length === 0) {
      await conn.rollback();
      return res.status(404).json({ erro: "Empréstimo não encontrado." });
    }

    if (emp[0].status === "Concluído") {
      await conn.rollback();
      return res.status(400).json({ erro: "Empréstimo já está concluído." });
    }

    await conn.query(
      "UPDATE emprestimos SET status = 'Concluído', data_devolucao = NOW() WHERE id = ?",
      [emprestimoId]
    );

    await conn.query("UPDATE livros SET estoque = estoque + 1 WHERE id = ?", [emp[0].livro_id]);

    await conn.commit();
    res.json({ ok: true, mensagem: "Empréstimo concluído e estoque devolvido." });
  } catch (err) {
    await conn.rollback();
    console.error("Erro ao devolver empréstimo:", err);
    res.status(500).json({ erro: "Erro ao devolver empréstimo." });
  } finally {
    conn.release();
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
    if (rows.length === 0) return res.status(401).json({ erro: "Usuário não encontrado." });

    const gestor = rows[0];
    const senhaCorreta = await bcrypt.compare(senha, gestor.senha);
    if (!senhaCorreta) return res.status(401).json({ erro: "Senha incorreta." });

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
    res.status(500).json({ ok: false, error: err.message, code: err.code });
  }
});

// ✅ /api/setup — cria/atualiza tabelas (compatível com Railway)
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
      email VARCHAR(150) NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    const addColumn = async (sql) => {
      try { await db.query(sql); }
      catch (err) { if (err.code !== "ER_DUP_FIELDNAME") throw err; }
    };

    // upgrade seguro (usuarios)
    await addColumn(`ALTER TABLE usuarios ADD COLUMN tipo VARCHAR(20) NOT NULL DEFAULT 'Outro'`);
    await addColumn(`ALTER TABLE usuarios ADD COLUMN matricula VARCHAR(50) NULL`);
    await addColumn(`ALTER TABLE usuarios ADD COLUMN turma VARCHAR(50) NULL`);
    await addColumn(`ALTER TABLE usuarios ADD COLUMN cpf VARCHAR(20) NULL`);
    await addColumn(`ALTER TABLE usuarios ADD COLUMN telefone VARCHAR(30) NULL`);

    // livros
    await db.query(`CREATE TABLE IF NOT EXISTS livros (
      id INT AUTO_INCREMENT PRIMARY KEY,
      titulo VARCHAR(150) NOT NULL,
      autor VARCHAR(100) NULL,
      estoque INT DEFAULT 0,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await addColumn(`ALTER TABLE livros ADD COLUMN area VARCHAR(120) NULL`);
    await addColumn(`ALTER TABLE livros ADD COLUMN tombo INT NULL`);
    await addColumn(`ALTER TABLE livros ADD COLUMN vol VARCHAR(30) NULL`);
    await addColumn(`ALTER TABLE livros ADD COLUMN edicao VARCHAR(30) NULL`);
    await addColumn(`ALTER TABLE livros ADD COLUMN local VARCHAR(80) NULL`);
    await addColumn(`ALTER TABLE livros ADD COLUMN editora VARCHAR(120) NULL`);
    await addColumn(`ALTER TABLE livros ADD COLUMN ano INT NULL`);

    // emprestimos (base)
    await db.query(`CREATE TABLE IF NOT EXISTS emprestimos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NULL,
      livro_id INT NULL,
      data_emprestimo DATE NULL,
      status VARCHAR(50) NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // upgrade seguro (emprestimos)
    await addColumn(`ALTER TABLE emprestimos ADD COLUMN data_hora DATETIME NULL`);
    await addColumn(`ALTER TABLE emprestimos ADD COLUMN data_prevista DATE NULL`);
    await addColumn(`ALTER TABLE emprestimos ADD COLUMN data_devolucao DATETIME NULL`);

    // migração leve: se data_hora estiver NULL mas data_emprestimo existir, preencher data_hora
    await db.query(`
      UPDATE emprestimos
      SET data_hora = CONCAT(data_emprestimo, ' 00:00:00')
      WHERE data_hora IS NULL AND data_emprestimo IS NOT NULL
    `);

    // garantir status padrão
    await db.query(`
      UPDATE emprestimos
      SET status = 'Ativo'
      WHERE (status IS NULL OR status = '')
        AND (data_devolucao IS NULL)
    `);

    const [colsUsuarios] = await db.query("SHOW COLUMNS FROM usuarios;");
    const [colsLivros] = await db.query("SHOW COLUMNS FROM livros;");
    const [colsEmp] = await db.query("SHOW COLUMNS FROM emprestimos;");

    res.json({
      ok: true,
      usuarios_columns: colsUsuarios.map(c => c.Field),
      livros_columns: colsLivros.map(c => c.Field),
      emprestimos_columns: colsEmp.map(c => c.Field),
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message, code: err.code });
  }
});

export default app;
