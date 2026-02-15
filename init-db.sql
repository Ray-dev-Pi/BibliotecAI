-- init-db.sql

CREATE DATABASE IF NOT EXISTS bibliotecai CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE bibliotecai;

CREATE TABLE IF NOT EXISTS gestores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario VARCHAR(100) UNIQUE,
  senha VARCHAR(255),
  nome VARCHAR(150),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150),
  tipo ENUM('Aluno','Professor','Outro') DEFAULT 'Outro',
  matricula VARCHAR(50),
  turma VARCHAR(50),
  cpf VARCHAR(30),
  telefone VARCHAR(30),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS livros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tombo VARCHAR(50),
  autor VARCHAR(150),
  titulo VARCHAR(250),
  volume VARCHAR(50),
  area_conhecimento VARCHAR(150),
  edicao VARCHAR(80),
  local_pub VARCHAR(150),
  editora VARCHAR(150),
  ano INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emprestimos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT,
  livro_id INT,
  data_emprestimo DATE,
  data_devolucao_prevista DATE,
  data_devolucao_real DATE DEFAULT NULL,
  status ENUM('Em andamento', 'Concluído', 'Atrasado') DEFAULT 'Em andamento',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (livro_id) REFERENCES livros(id) ON DELETE SET NULL
);
