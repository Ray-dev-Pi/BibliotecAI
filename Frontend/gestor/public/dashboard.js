// dashboard.js — Dashboard REAL (MySQL via API)

function criarCard(titulo, valor, icone, corTexto, corBorda) {
  return `
    <div class="bg-white rounded-xl p-6 shadow-md border-l-4 ${corBorda}">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-700">${titulo}</h2>
          <p class="text-3xl font-bold ${corTexto}">${valor}</p>
        </div>
        <i class="fas ${icone} ${corTexto} text-3xl"></i>
      </div>
    </div>
  `;
}

function fmtDataISOParaBR(iso) {
  // seu backend pode devolver "2026-02-16T..." ou "16/02/2026" dependendo da query
  if (!iso) return "-";
  if (String(iso).includes("/")) return iso;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// ---------- API ----------
async function apiGet(url) {
  const resp = await fetch(url);
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.erro || `Erro em ${url}`);
  return data;
}

async function carregarDashboard() {
  const kpiLivros = document.getElementById("kpi-livros");
  const kpiUsuarios = document.getElementById("kpi-usuarios");
  const kpiAtivas = document.getElementById("kpi-ativas");
  const kpiAlertas = document.getElementById("kpi-alertas");
  const cardsEmprestimos = document.getElementById("cards-emprestimos");
  const listaEmprestimos = document.getElementById("lista-emprestimos");
  const atividades = document.getElementById("atividades-recentes");

  try {
    // Em paralelo
    const [livros, usuarios, emprestimos, resumo] = await Promise.all([
      apiGet("/api/livros"),
      apiGet("/api/usuarios"),
      apiGet("/api/emprestimos"),
      apiGet("/api/emprestimos/resumo"),
    ]);

    // KPIs reais (contando o que veio do banco)
    const totalLivros = Array.isArray(livros) ? livros.length : 0;
    const totalUsuarios = Array.isArray(usuarios) ? usuarios.length : 0;

    const totalEmp = Number(resumo?.total || 0);
    const atrasados = Number(resumo?.atrasados || 0);
    const concluidos = Number(resumo?.concluidos || 0);
    const ativas = Math.max(0, totalEmp - concluidos);

    kpiLivros.textContent = totalLivros;
    kpiUsuarios.textContent = totalUsuarios;
    kpiAtivas.textContent = ativas;
    kpiAlertas.textContent = atrasados;

    // Cards de empréstimos (reais)
    cardsEmprestimos.innerHTML = `
      ${criarCard("Total de Empréstimos", totalEmp, "fa-handshake", "text-green-700", "border-green-600")}
      ${criarCard("Pendências (Atrasos)", atrasados, "fa-exclamation-triangle", "text-red-700", "border-red-600")}
      ${criarCard("Concluídos", concluidos, "fa-check-circle", "text-blue-700", "border-blue-600")}
    `;

    // Tabela últimos empréstimos (reais)
    listaEmprestimos.innerHTML = "";
    if (!Array.isArray(emprestimos) || emprestimos.length === 0) {
      listaEmprestimos.innerHTML = `
        <tr>
          <td class="py-3 px-4 text-center text-gray-500" colspan="4">Nenhum empréstimo encontrado.</td>
        </tr>
      `;
    } else {
      emprestimos.forEach((e) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="py-2 px-4">${e.usuario || "-"}</td>
          <td class="py-2 px-4">${e.livro || "-"}</td>
          <td class="py-2 px-4">${fmtDataISOParaBR(e.data)}</td>
          <td class="py-2 px-4">${e.status || "-"}</td>
        `;
        listaEmprestimos.appendChild(tr);
      });
    }

    // Atividades recentes (derivado dos empréstimos)
    atividades.innerHTML = "";
    const ultimos = (Array.isArray(emprestimos) ? emprestimos : []).slice(0, 3);

    if (ultimos.length === 0) {
      atividades.innerHTML = `<li class="text-gray-500">Sem atividades recentes ainda.</li>`;
    } else {
      ultimos.forEach((e) => {
        const li = document.createElement("li");
        li.className = "flex justify-between items-center border-b pb-2";
        li.innerHTML = `
          <span>📚 <b>${e.usuario || "Usuário"}</b> — <b>${e.livro || "Livro"}</b> (${e.status || "Status"})</span>
          <span class="text-sm text-gray-500">${fmtDataISOParaBR(e.data)}</span>
        `;
        atividades.appendChild(li);
      });
    }

  } catch (err) {
    console.error(err);
    alert("Erro ao carregar dados reais do dashboard: " + err.message);
  }
}

document.addEventListener("DOMContentLoaded", carregarDashboard);
