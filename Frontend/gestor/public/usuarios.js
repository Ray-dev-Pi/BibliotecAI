const modalU = document.getElementById("modal-usuario");
const btnAddU = document.getElementById("btn-add-usuario");
const closeU = modalU.querySelector(".close");
const formU = document.getElementById("form-usuario");
const usuariosList = document.getElementById("usuarios-list");
const modalTitleU = document.getElementById("modal-title");
const tipoSelect = document.getElementById("tipo");
const extraFields = document.getElementById("extra-fields");
const usuarioIdInput = document.getElementById("usuario-id");

let usuarios = [];

// ================= API =================
async function carregarUsuarios() {
  try {
    const resp = await fetch("/api/usuarios");
    if (!resp.ok) throw new Error("Falha ao carregar usuários.");
    usuarios = await resp.json();
    renderUsuarios();
  } catch (err) {
    console.error("Erro ao carregar usuários:", err);
    alert("Não foi possível carregar usuários do banco.");
  }
}

async function salvarUsuarioAPI(usuario) {
  const resp = await fetch("/api/usuarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usuario),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.erro || "Erro ao salvar usuário.");
  return data;
}

// ================= MODAL =================
btnAddU.onclick = () => {
  modalU.classList.add("show");
  formU.reset();
  extraFields.innerHTML = "";
  modalTitleU.textContent = "Adicionar Usuário";
  usuarioIdInput.value = "";
};

closeU.onclick = () => modalU.classList.remove("show");
window.onclick = (e) => {
  if (e.target == modalU) modalU.classList.remove("show");
};

// ================= CAMPOS DINÂMICOS =================
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

// ================= SALVAR (BANCO) =================
formU.onsubmit = async (e) => {
  e.preventDefault();

  const tipo = tipoSelect.value;

  const usuario = {
    nome: document.getElementById("nome").value,
    tipo,
    matricula: tipo === "Aluno" ? document.getElementById("matricula")?.value : null,
    turma: tipo === "Aluno" ? document.getElementById("turma")?.value : null,
    cpf: tipo === "Professor" ? document.getElementById("cpf")?.value : null,
    telefone: (tipo === "Aluno" || tipo === "Professor") ? document.getElementById("telefone")?.value : null,
    email: null
  };

  try {
    await salvarUsuarioAPI(usuario);
    await carregarUsuarios();

    modalU.classList.remove("show");
    formU.reset();
    extraFields.innerHTML = "";
  } catch (err) {
    alert(err.message);
  }
};

// ================= RENDERIZAR =================
function renderUsuarios() {
  usuariosList.innerHTML = "";

  usuarios.forEach((u) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="py-2 px-4">${u.nome || "-"}</td>
      <td class="py-2 px-4">${u.tipo || "-"}</td>
      <td class="py-2 px-4">${u.tipo === "Aluno" ? (u.matricula || "-") : (u.tipo === "Professor" ? (u.cpf || "-") : "-")}</td>
      <td class="py-2 px-4">${u.tipo === "Aluno" ? (u.turma || "-") : "-"}</td>
      <td class="py-2 px-4">${u.telefone || "-"}</td>
      <td class="py-2 px-4 text-center">-</td>
    `;
    usuariosList.appendChild(row);
  });
}

// ================= INIT =================
window.onload = () => {
  carregarUsuarios();
};
