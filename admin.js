const PASSWORD = "bogado80";

const API =
"https://script.google.com/macros/s/AKfycbx7piUVg84lj80nwA930A4OI8wbZWg0-r0pTwVfumtShDix6NjTWmfTwunpINw7HQA6/exec";

let datosGlobales = [];

function login(){

    const pass =
        document.getElementById("password").value;

    if(pass !== PASSWORD){
        alert("Contraseña incorrecta");
        return;
    }

    document.getElementById("loginBox").style.display="none";
    document.getElementById("panel").style.display="block";

    cargarDatos();
}

async function cargarDatos(){

    try{

        const response =
            await fetch(`${API}?key=${PASSWORD}`);

        const data =
            await response.json();

        datosGlobales = data.invitados;

        document.getElementById("confirmados").textContent =
            data.resumen.confirmados;

        document.getElementById("pendientes").textContent =
            data.resumen.pendientes;

        document.getElementById("noAsisten").textContent =
            data.resumen.noAsisten;

        document.getElementById("personas").textContent =
            data.resumen.personasConfirmadas;

        document.getElementById("cupos").textContent =
            data.resumen.totalCupos;

        cargarTablaGeneral(data.invitados);

        cargarConfirmados(data.invitados);

        cargarNoAsisten(data.invitados);

        cargarPendientes(data.invitados);

    }catch(error){

        console.error(error);

        alert("Error al cargar datos");

    }

}

function cargarTablaGeneral(lista){

    let html="";

    let totalCupos=0;
    let totalConfirmados=0;

    lista.forEach(item=>{

        totalCupos += Number(item.cupo || 0);
        totalConfirmados += Number(item.personas || 0);

        html += `
        <tr>
            <td>${item.id}</td>
            <td>${item.nombre}</td>
            <td>${item.estado}</td>
            <td>${item.cupo}</td>
            <td>${item.personas}</td>
        </tr>
        `;

    });

    document.getElementById("tbody").innerHTML=html;

    document.getElementById("totalCupos").textContent =
        totalCupos;

    document.getElementById("totalConfirmados").textContent =
        totalConfirmados;
}

function cargarConfirmados(lista){

    const datos =
        lista.filter(x=>x.estado==="Confirma");

    construirTabla(
        "tablaConfirmados",
        datos
    );
}

function cargarNoAsisten(lista){

    const datos =
        lista.filter(x=>x.estado==="No asiste");

    construirTabla(
        "tablaNoAsisten",
        datos
    );
}

function construirTabla(id,lista){

    let html=`
    <thead>
        <tr>
            <th>ID</th>
            <th>Invitado</th>
            <th>Cupo</th>
            <th>Confirmados</th>
        </tr>
    </thead>
    <tbody>
    `;

    lista.forEach(item=>{

        html+=`
        <tr>
            <td>${item.id}</td>
            <td>${item.nombre}</td>
            <td>${item.cupo}</td>
            <td>${item.personas}</td>
        </tr>
        `;

    });

    html += "</tbody>";

    document.getElementById(id).innerHTML = html;
}

function cargarPendientes(lista){

    const BASE_URL = "https://invitacioncarlosbogado.vercel.app/";

    const datos = lista.filter(x =>
        x.estado === "Pendiente"
    );

    let html = `
    <thead>
        <tr>
            <th>ID</th>
            <th>Invitado</th>
            <th>Cupo</th>
            <th>WhatsApp</th>
        </tr>
    </thead>
    <tbody>
    `;

    datos.forEach(item => {

        const link = `${BASE_URL}?token=${item.token}`;

        const mensaje = encodeURIComponent(
            `Hola ¿Qué tal? 🙋🏻‍♀️\n\n` +
            `Paso para recordarte que tu confirmación de asistencia sigue pendiente. ` +
            `Agradeceremos tu pronta respuesta. La fecha límite para confirmar es el 12 de junio.\n\n` +
            `${link}\n\n` +
            `¡Muchas gracias! 💙`
        );

        const telefono = item.telefono
            ? String(parseInt(item.telefono)).replace(/\D/g, "")
            : "";

        const waLink = telefono && telefono.length > 6
            ? `<a class="btn-wa" href="https://wa.me/${telefono}?text=${mensaje}" target="_blank">📲 Enviar recordatorio</a>`
            : `<span style="color:#aaa;font-size:12px;">Sin teléfono</span>`;

        html += `
        <tr>
            <td>${item.id}</td>
            <td>${item.nombre}</td>
            <td>${item.cupo}</td>
            <td>${waLink}</td>
        </tr>
        `;
    });

    html += "</tbody>";

    document.getElementById("tablaPendientes").innerHTML = html;
}

function exportarExcel(){

    const wb =
        XLSX.utils.book_new();

    const ws =
        XLSX.utils.table_to_sheet(
            document.getElementById("tablaGeneral")
        );

    XLSX.utils.book_append_sheet(
        wb,
        ws,
        "Invitados"
    );

    XLSX.writeFile(
        wb,
        "confirmaciones.xlsx"
    );
}

function exportarPDF(){

    window.print();
}