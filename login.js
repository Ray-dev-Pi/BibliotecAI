// login.js
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const usuario = document.getElementById("usuario").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const msgErro = document.getElementById("msgErro");

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, senha })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("gestor", JSON.stringify(data.gestor));
      window.location.href = "dashboard.html";
    } else {
      msgErro.textContent = data.erro || "Usuário ou senha inválidos.";
      msgErro.classList.remove("hidden");
    }
  } catch (err) {
    console.error("Erro ao tentar login:", err);
    msgErro.textContent = "Erro de conexão com o servidor.";
    msgErro.classList.remove("hidden");
  }
});
