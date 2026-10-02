const PASSWORD = "bogado80";
const API = "https://script.google.com/macros/s/AKfycbzEP19g0fYckGm7u5vGC6yO4EGpb0amrLJjI_p6KHQUZUCRza35mM8ULqSdoKUBrl0l/exec";
const BASE_INVITATION_URL = "https://invitacion-giuliano.vercel.app/";

let datosGlobales = [];
let activeTab = "todos";

// Comprobación de sesión guardada
document.addEventListener("DOMContentLoaded", () => {
  const savedPass = sessionStorage.getItem("admin_pass");
  if (savedPass === PASSWORD) {
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("panel").style.display = "block";
    cargarDatos();
  }
});

function checkEnter(e) {
  if (e.key === "Enter") login();
}

function login() {
  const pass = document.getElementById("password").value;
  if (pass !== PASSWORD) {
    alert("Contraseña incorrecta");
    return;
  }
  sessionStorage.setItem("admin_pass", PASSWORD);
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("panel").style.display = "block";
  cargarDatos();
}

function logout() {
  sessionStorage.removeItem("admin_pass");
  location.reload();
}

async function cargarDatos() {
  try {
    const response = await fetch(`${API}?key=${PASSWORD}`, { redirect: 'follow' });
    const data = await response.json();

    if (!data.ok) {
      alert("Error al cargar los datos: " + (data.error || "Clave errónea"));
      return;
    }

    datosGlobales = data.invitados || [];

    calcularYMostrarMetricas();
    renderizarTablas();

  } catch (error) {
    console.error("Error al cargar datos:", error);
    alert("Error de conexión al cargar los datos del servidor");
  }
}

function formatearTelefono(rawTel) {
  if (!rawTel) return "";
  let clean = String(rawTel).replace(/\D/g, "");
  if (!clean) return "";
  // Si empieza con 098... (Paraguay), anteponer 595
  if (clean.length === 9 && clean.startsWith("09")) {
    clean = "595" + clean.substring(1);
  } else if (clean.length === 9 && clean.startsWith("9")) {
    clean = "595" + clean;
  }
  return clean;
}

function calcularYMostrarMetricas() {
  let totalCupoAdultos = 0;
  let totalCupoNinos = 0;
  let totalCupoNinas = 0;

  let confirmadosAdultos = 0;
  let confirmadosNinos = 0;
  let confirmadosNinas = 0;

  let pendientesAdultos = 0;
  let pendientesNinos = 0;
  let pendientesNinas = 0;

  let countConfirmados = 0;
  let countPendientes = 0;
  let countNoAsisten = 0;

  datosGlobales.forEach(inv => {
    const cAdulto = Number(inv.cupoAdulto) || 0;
    const cNino = Number(inv.cupoNino) || 0;
    const cNina = Number(inv.cupoNina) || 0;

    totalCupoAdultos += cAdulto;
    totalCupoNinos += cNino;
    totalCupoNinas += cNina;

    const est = String(inv.estado || "Pendiente").trim();

    if (est === "Confirma") {
      countConfirmados++;
      confirmadosAdultos += Number(inv.adultoConfirmado) || 0;
      confirmadosNinos += Number(inv.ninoConfirmado) || 0;
      confirmadosNinas += Number(inv.ninaConfirmada) || 0;
    } else if (est === "No asiste") {
      countNoAsisten++;
    } else {
      countPendientes++;
      pendientesAdultos += cAdulto;
      pendientesNinos += cNino;
      pendientesNinas += cNina;
    }
  });

  const totalCupos = totalCupoAdultos + totalCupoNinos + totalCupoNinas;
  const totalConfirmadosPersonas = confirmadosAdultos + confirmadosNinos + confirmadosNinas;

  // Actualizar Tarjetas KPI
  document.getElementById("kpi-totales").textContent = totalCupos;
  document.getElementById("kpi-desglose-cupos").innerHTML =
    `<span>Adultos: ${totalCupoAdultos}</span> | <span>Niños: ${totalCupoNinos}</span> | <span>Niñas: ${totalCupoNinas}</span>`;

  document.getElementById("kpi-confirmados-personas").textContent = totalConfirmadosPersonas;
  document.getElementById("kpi-desglose-confirmados").innerHTML =
    `<span>Adultos: ${confirmadosAdultos}</span> | <span>Niños: ${confirmadosNinos}</span> | <span>Niñas: ${confirmadosNinas}</span> (${countConfirmados} fam.)`;

  document.getElementById("kpi-pendientes").textContent = countPendientes;
  document.getElementById("kpi-desglose-pendientes").textContent =
    `Pases pendientes: ${pendientesAdultos + pendientesNinos + pendientesNinas} personas`;

  document.getElementById("kpi-no-asisten").textContent = countNoAsisten;

  // Actualizar badges de conteo en Tabs
  document.getElementById("count-tab-todos").textContent = datosGlobales.length;
  document.getElementById("count-tab-confirmados").textContent = countConfirmados;
  document.getElementById("count-tab-pendientes").textContent = countPendientes;
  document.getElementById("count-tab-noAsisten").textContent = countNoAsisten;
}

function renderizarTablas() {
  const query = document.getElementById("searchInput").value.toLowerCase().trim();

  const filtrados = datosGlobales.filter(item => {
    const nombre = String(item.nombre || "").toLowerCase();
    const id = String(item.id || "").toLowerCase();
    const tel = String(item.telefono || "").toLowerCase();
    return nombre.includes(query) || id.includes(query) || tel.includes(query);
  });

  renderTablaTodos(filtrados);
  renderTablaConfirmados(filtrados);
  renderTablaPendientes(filtrados);
  renderTablaNoAsisten(filtrados);
}

function renderTablaTodos(lista) {
  let html = "";
  let totA = 0, totN = 0, totNa = 0;

  lista.forEach(item => {
    const cA = Number(item.cupoAdulto) || 0;
    const cN = Number(item.cupoNino) || 0;
    const cNa = Number(item.cupoNina) || 0;
    const totCupo = cA + cN + cNa;

    totA += cA;
    totN += cN;
    totNa += cNa;

    const link = `${BASE_INVITATION_URL}?token=${encodeURIComponent(item.token)}`;
    const msgText =
      `¡Hola ${item.nombre}! \u{1F3CE}\u{2728}\n` +
      `Te escribo con mucha alegría de parte de la familia para invitarte a celebrar el 2do añito de nuestro pequeño Giuliano \u{1F973}\u{1F3C1}\n` +
      `Queremos compartir con ustedes una tarde llena de emoción, juegos y mucha diversión. \u{1F3C6}\n` +
      `Ingresa a tu invitación digital aquí: \u{1F447}\u{1F447}\u{1F447}\n` +
      `${link}\n` +
      `Por favor, ayúdanos confirmando tu asistencia antes del lunes 02/11.\n` +
      `¡Nos encantará contar con ustedes! \u{2764}\u{FE0F}\n` +
      `Un abrazo con cariño, Sus Papis y Flia. \u{1F3C1}`;
    const msg = encodeURIComponent(msgText);

    const telLimpio = formatearTelefono(item.telefono);
    const waButton = telLimpio
      ? `<a href="https://wa.me/${telLimpio}?text=${msg}" target="_blank" class="btn-wa">📲 Enviar Invitación</a>`
      : `<span class="no-phone">Sin teléfono</span>`;

    const badgeEstado = getBadgeEstado(item.estado);

    html += `
      <tr>
        <td><strong>#${item.id}</strong></td>
        <td><strong>${item.nombre}</strong></td>
        <td>${cA}</td>
        <td>${cN}</td>
        <td>${cNa}</td>
        <td><span class="badge-total">${totCupo}</span></td>
        <td>${badgeEstado}</td>
        <td>${item.telefono || '-'}</td>
        <td class="col-action">${waButton}</td>
      </tr>
    `;
  });

  document.getElementById("tbody-todos").innerHTML = html || '<tr><td colspan="9" class="text-center">No hay registros</td></tr>';
  document.getElementById("tot-todos-adultos").textContent = totA;
  document.getElementById("tot-todos-ninos").textContent = totN;
  document.getElementById("tot-todos-ninas").textContent = totNa;
  document.getElementById("tot-todos-cupos").textContent = totA + totN + totNa;
}

function renderTablaConfirmados(lista) {
  const confirmados = lista.filter(x => String(x.estado).trim() === "Confirma");
  let html = "";
  let totA = 0, totN = 0, totNa = 0;

  confirmados.forEach(item => {
    const cA = Number(item.adultoConfirmado) || 0;
    const cN = Number(item.ninoConfirmado) || 0;
    const cNa = Number(item.ninaConfirmada) || 0;
    const totConfirmado = cA + cN + cNa;

    totA += cA;
    totN += cN;
    totNa += cNa;

    html += `
      <tr>
        <td><strong>#${item.id}</strong></td>
        <td><strong>${item.nombre}</strong></td>
        <td>${cA}</td>
        <td>${cN}</td>
        <td>${cNa}</td>
        <td><span class="badge-total-confirmado">${totConfirmado}</span></td>
        <td>${item.telefono || '-'}</td>
        <td><small style="color:#666;">${item.timestamp || 'Registrado'}</small></td>
      </tr>
    `;
  });

  document.getElementById("tbody-confirmados").innerHTML = html || '<tr><td colspan="8" class="text-center">No hay confirmados aún</td></tr>';
  document.getElementById("tot-conf-adultos").textContent = totA;
  document.getElementById("tot-conf-ninos").textContent = totN;
  document.getElementById("tot-conf-ninas").textContent = totNa;
  document.getElementById("tot-conf-personas").textContent = totA + totN + totNa;
}

function renderTablaPendientes(lista) {
  const pendientes = lista.filter(x => String(x.estado || "Pendiente").trim() === "Pendiente");
  let html = "";
  let totA = 0, totN = 0, totNa = 0;

  pendientes.forEach(item => {
    const cA = Number(item.cupoAdulto) || 0;
    const cN = Number(item.cupoNino) || 0;
    const cNa = Number(item.cupoNina) || 0;
    const totCupo = cA + cN + cNa;

    totA += cA;
    totN += cN;
    totNa += cNa;

    const link = `${BASE_INVITATION_URL}?token=${encodeURIComponent(item.token)}`;
    const msgText =
      `¡Hola ${item.nombre}! \u{1F3CE}\u{2764}\u{FE0F}\n` +
      `Paso a saludarte y recordarte que estamos ajustando los últimos detalles para la fiesta del 2do añito de Giuliano \u{1F3C1}\u{1F973}\n` +
      `Aún tenemos pendiente tu confirmación de asistencia. Puedes verificar y confirmar tu invitación aquí: \u{1F447}\u{1F447}\u{1F447}\n` +
      `${link}\n` +
      `Te pedimos por favor confirmar antes del lunes 02/11 para poder organizar los Pits de la mejor manera.\n` +
      `¡Esperamos celebrar juntos! \u{2728}\n` +
      `Un abrazo, Andrea (Mami de Giuliano) \u{2764}\u{FE0F}`;
    const msg = encodeURIComponent(msgText);

    const telLimpio = formatearTelefono(item.telefono);
    const waButton = telLimpio
      ? `<a href="https://wa.me/${telLimpio}?text=${msg}" target="_blank" class="btn-wa btn-wa-recordatorio">📲 Enviar Recordatorio</a>`
      : `<span class="no-phone">Sin teléfono</span>`;

    html += `
      <tr>
        <td><strong>#${item.id}</strong></td>
        <td><strong>${item.nombre}</strong></td>
        <td>${cA}</td>
        <td>${cN}</td>
        <td>${cNa}</td>
        <td><span class="badge-total">${totCupo}</span></td>
        <td>${item.telefono || '-'}</td>
        <td class="col-action">${waButton}</td>
      </tr>
    `;
  });

  document.getElementById("tbody-pendientes").innerHTML = html || '<tr><td colspan="8" class="text-center">No hay pendientes</td></tr>';
  document.getElementById("tot-pend-adultos").textContent = totA;
  document.getElementById("tot-pend-ninos").textContent = totN;
  document.getElementById("tot-pend-ninas").textContent = totNa;
  document.getElementById("tot-pend-cupos").textContent = totA + totN + totNa;
}

function renderTablaNoAsisten(lista) {
  const noAsisten = lista.filter(x => String(x.estado).trim() === "No asiste");
  let html = "";

  noAsisten.forEach(item => {
    html += `
      <tr>
        <td><strong>#${item.id}</strong></td>
        <td><strong>${item.nombre}</strong></td>
        <td>${item.cupoAdulto || 0}</td>
        <td>${item.cupoNino || 0}</td>
        <td>${item.cupoNina || 0}</td>
        <td>${item.telefono || '-'}</td>
        <td><small style="color:#666;">${item.timestamp || 'Registrado'}</small></td>
      </tr>
    `;
  });

  document.getElementById("tbody-noAsisten").innerHTML = html || '<tr><td colspan="7" class="text-center">No hay registros de rechazo</td></tr>';
}

function getBadgeEstado(estado) {
  const est = String(estado || "Pendiente").trim();
  if (est === "Confirma") {
    return `<span class="badge badge-confirma">🟢 Confirma</span>`;
  } else if (est === "No asiste") {
    return `<span class="badge badge-noasiste">🔴 No asiste</span>`;
  }
  return `<span class="badge badge-pendiente">🟡 Pendiente</span>`;
}

function switchTab(tabName) {
  activeTab = tabName;
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));

  document.getElementById(`tab-btn-${tabName}`).classList.add("active");
  document.getElementById(`tab-content-${tabName}`).classList.add("active");
}

function filtrarTabla() {
  renderizarTablas();
}

// EXPORTACIÓN A EXCEL (3 APARTADOS / PESTAÑAS INTERNAS)
function exportarExcel() {
  if (!datosGlobales || datosGlobales.length === 0) {
    alert("No hay datos para exportar");
    return;
  }

  const wb = XLSX.utils.book_new();

  // 1. Pestaña "Invitados" (Listado completo)
  const dataInvitados = datosGlobales.map(item => ({
    "ID": item.id,
    "Nombre": item.nombre,
    "Cupo Adultos": Number(item.cupoAdulto) || 0,
    "Cupo Niños": Number(item.cupoNino) || 0,
    "Cupo Niñas": Number(item.cupoNina) || 0,
    "Cupo Total": (Number(item.cupoAdulto) || 0) + (Number(item.cupoNino) || 0) + (Number(item.cupoNina) || 0),
    "Estado": item.estado || "Pendiente",
    "Teléfono": item.telefono || "",
    "Enlace Invitación": `${BASE_INVITATION_URL}?token=${item.token}`
  }));
  const wsInvitados = XLSX.utils.json_to_sheet(dataInvitados);
  XLSX.utils.book_append_sheet(wb, wsInvitados, "Invitados");

  // 2. Pestaña "Confirmados"
  const confirmados = datosGlobales.filter(x => String(x.estado).trim() === "Confirma");
  const dataConfirmados = confirmados.map(item => ({
    "ID": item.id,
    "Nombre": item.nombre,
    "Adultos Confirmados": Number(item.adultoConfirmado) || 0,
    "Niños Confirmados": Number(item.ninoConfirmado) || 0,
    "Niñas Confirmadas": Number(item.ninaConfirmada) || 0,
    "Total Confirmados": (Number(item.adultoConfirmado) || 0) + (Number(item.ninoConfirmado) || 0) + (Number(item.ninaConfirmada) || 0),
    "Teléfono": item.telefono || "",
    "Fecha Respuesta": item.timestamp || ""
  }));
  const wsConfirmados = XLSX.utils.json_to_sheet(dataConfirmados);
  XLSX.utils.book_append_sheet(wb, wsConfirmados, "Confirmados");

  // 3. Pestaña "Pendientes"
  const pendientes = datosGlobales.filter(x => String(x.estado || "Pendiente").trim() === "Pendiente");
  const dataPendientes = pendientes.map(item => ({
    "ID": item.id,
    "Nombre": item.nombre,
    "Cupo Adultos": Number(item.cupoAdulto) || 0,
    "Cupo Niños": Number(item.cupoNino) || 0,
    "Cupo Niñas": Number(item.cupoNina) || 0,
    "Cupo Total": (Number(item.cupoAdulto) || 0) + (Number(item.cupoNino) || 0) + (Number(item.cupoNina) || 0),
    "Teléfono": item.telefono || "",
    "Enlace Recordatorio": `${BASE_INVITATION_URL}?token=${item.token}`
  }));
  const wsPendientes = XLSX.utils.json_to_sheet(dataPendientes);
  XLSX.utils.book_append_sheet(wb, wsPendientes, "Pendientes");

  XLSX.writeFile(wb, "Reporte_Giuliano_Cumple_Confirmaciones.xlsx");
}

function exportarPDF() {
  window.print();
}