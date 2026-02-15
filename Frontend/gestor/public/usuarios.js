const modalU = document.getElementById("modal-usuario");
const btnAddU = document.getElementById("btn-add-usuario");
const closeU = modalU.querySelector(".close");
const formU = document.getElementById("form-usuario");
const usuariosList = document.getElementById("usuarios-list");
const modalTitleU = document.getElementById("modal-title");
const tipoSelect = document.getElementById("tipo");
const extraFields = document.getElementById("extra-fields");
const usuarioIdInput = document.getElementById("usuario-id");

let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
let editIndexU = null;

// ---------- FUNÇÕES DE PERSISTÊNCIA ----------
function salvarNoLocalStorage() {
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
}

// ---------- MODAL ----------
btnAddU.onclick = () => {
  modalU.classList.add("show");
  formU.reset();
  extraFields.innerHTML = "";
  modalTitleU.textContent = "Adicionar Usuário";
  editIndexU = null;
};

closeU.onclick = () => modalU.classList.remove("show");
window.onclick = (e) => { if (e.target == modalU) modalU.classList.remove("show"); };

// ---------- CAMPOS DINÂMICOS ----------
tipoSelect.addEventListener("change", () => {
  const tipo = tipoSelect.value;
  extraFields.innerHTML = "";

  if (tipo === "Aluno") {
    extraFields.innerHTML = `
      <div>
        <label class="font-semibold">Matrícula:</label>
        <input type="text" id="matricula" class="w-full border rounded-lg p-2" required>
      </div>
      <div>
        <label class="font-semibold">Turma:</label>
        <input type="text" id="turma" class="w-full border rounded-lg p-2" required>
      </div>
      <div>
        <label class="font-semibold">Telefone:</label>
        <input type="text" id="telefone" class="w-full border rounded-lg p-2" required>
      </div>
    `;
  } else if (tipo === "Professor") {
    extraFields.innerHTML = `
      <div>
        <label class="font-semibold">CPF:</label>
        <input type="text" id="cpf" class="w-full border rounded-lg p-2" required>
      </div>
      <div>
        <label class="font-semibold">Telefone:</label>
        <input type="text" id="telefone" class="w-full border rounded-lg p-2" required>
      </div>
    `;
  }
});
window.onload = () => {
  carregarEmprestimos();
};

function carregarEmprestimos() {
  // Simulação de dados — depois trocaremos por MySQL
  const emprestimos = [
    { usuario: "Ana Souza", livro: "Dom Casmurro", data: "2025-10-10", status: "Em andamento" },
    { usuario: "Carlos Lima", livro: "O Cortiço", data: "2025-10-08", status: "Atrasado" },
    { usuario: "Mariana Alves", livro: "Iracema", data: "2025-10-07", status: "Concluído" },
    { usuario: "Pedro Santos", livro: "Vidas Secas", data: "2025-10-05", status: "Em andamento" },
  ];

  const totalEmprestimos = emprestimos.length;
  const atrasados = emprestimos.filter(e => e.status === "Atrasado").length;
  const concluidos = emprestimos.filter(e => e.status === "Concluído").length;

  renderizarCards(totalEmprestimos, atrasados, concluidos);
  renderizarTabela(emprestimos);
}

function renderizarCards(total, atrasados, concluidos) {
  const container = document.getElementById("cards-emprestimos");
  container.innerHTML = `
    ${criarCard("Total de Empréstimos", total, "fa-handshake", "text-green-700", "border-green-600")}
    ${criarCard("Pendências (Atrasos)", atrasados, "fa-exclamation-triangle", "text-red-700", "border-red-600")}
    ${criarCard("Concluídos", concluidos, "fa-check-circle", "text-blue-700", "border-blue-600")}
  `;
}

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

// ---------- SALVAR USUÁRIO ----------
formU.onsubmit = function(e) {
  e.preventDefault();
  const tipo = tipoSelect.value;

  const usuario = {
    nome: document.getElementById("nome").value,
    tipo,
    matricula: tipo === "Aluno" ? document.getElementById("matricula").value : "",
    turma: tipo === "Aluno" ? document.getElementById("turma").value : "",
    telefone: (tipo === "Aluno" || tipo === "Professor") ? document.getElementById("telefone").value : "",
    cpf: tipo === "Professor" ? document.getElementById("cpf").value : "",
    id: usuarioIdInput.value || Date.now()
  };

  if (editIndexU !== null) {
    usuarios[editIndexU] = usuario;
  } else {
    usuarios.push(usuario);
  }

  salvarNoLocalStorage();
  renderUsuarios();

  modalU.classList.remove("show");
  formU.reset();
  extraFields.innerHTML = "";
};

// ---------- RENDERIZAR TABELA ----------
function renderUsuarios() {
  usuariosList.innerHTML = "";

  usuarios.forEach((u, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="py-2 px-4">${u.nome}</td>
      <td class="py-2 px-4">${u.tipo}</td>
      <td class="py-2 px-4">${u.tipo === "Aluno" ? u.matricula : u.tipo === "Professor" ? u.cpf : "-"}</td>
      <td class="py-2 px-4">${u.tipo === "Aluno" ? u.turma : "-"}</td>
      <td class="py-2 px-4">${u.telefone || "-"}</td>
      <td class="py-2 px-4 text-center">
        <button class="text-blue-600 hover:text-blue-800" onclick="editUsuario(${index})"><i class="fas fa-pen"></i></button>
        <button class="text-red-600 hover:text-red-800 ml-3" onclick="deleteUsuario(${index})"><i class="fas fa-trash"></i></button>
      </td>
    `;
    usuariosList.appendChild(row);
  });
}

// ---------- EDITAR USUÁRIO ----------
function editUsuario(index) {
  const u = usuarios[index];
  usuarioIdInput.value = u.id;
  document.getElementById("nome").value = u.nome;
  tipoSelect.value = u.tipo;
  tipoSelect.dispatchEvent(new Event("change"));

  setTimeout(() => {
    if (u.tipo === "Aluno") {
      document.getElementById("matricula").value = u.matricula;
      document.getElementById("turma").value = u.turma;
      document.getElementById("telefone").value = u.telefone;
    } else if (u.tipo === "Professor") {
      document.getElementById("cpf").value = u.cpf;
      document.getElementById("telefone").value = u.telefone;
    }
  }, 50);

  modalTitleU.textContent = "Editar Usuário";
  editIndexU = index;
  modalU.classList.add("show");
}

// ---------- DELETAR USUÁRIO ----------
function deleteUsuario(index) {
  if (confirm("Deseja realmente deletar este usuário?")) {
    usuarios.splice(index, 1);
    salvarNoLocalStorage();
    renderUsuarios();
  }
}

// ---------- INICIALIZAÇÃO ----------
window.onload = () => renderUsuarios();
