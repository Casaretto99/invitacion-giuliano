/**
 * GOOGLE APPS SCRIPT - INVITACIÓN CUMPLE GIULIANO (HOJA ÚNICA)
 * 
 * Nombre de la pestaña: "cumple_giuliano"
 * 
 * MAPEO DE COLUMNAS (Fila 1 = Cabecera, Datos desde Fila 2):
 * Col 1  (A) : ID
 * Col 2  (B) : NOMBRE
 * Col 3  (C) : CUPO ADULTO
 * Col 4  (D) : CUPO NIÑO
 * Col 5  (E) : CUPO NIÑA
 * Col 6  (F) : TOKEN
 * Col 7  (G) : RESPONDIDO (SI / NO / vacio)
 * Col 8  (H) : ASISTENCIA (Confirma / No asiste / Pendiente)
 * Col 9  (I) : ADULTO CONFIRMADO
 * Col 10 (J) : NIÑO CONFIRMADO
 * Col 11 (K) : NIÑA CONFIRMADO
 * Col 12 (L) : Telefono
 * Col 13 (M) : TIMESTAMP
 */

const NOMBRE_HOJA = "cumple_giuliano";

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(NOMBRE_HOJA) || ss.getActiveSheet();
}

function doGet(e) {
  const params = e.parameter;
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1); // Omitir cabecera (Fila 1)

  // -------------------------------------------------------------
  // 1. PANEL DE ADMINISTRACIÓN (?key=bogado80)
  // -------------------------------------------------------------
  if (params.key === "bogado80") {
    const invitados = [];
    let confirmados = 0, pendientes = 0, noAsisten = 0;
    
    let totalCupoAdultos = 0, totalCupoNinos = 0, totalCupoNinas = 0;
    let confirmadosAdultos = 0, confirmadosNinos = 0, confirmadosNinas = 0;

    rows.forEach((row, index) => {
      const id = row[0];
      const nombre = String(row[1] || "").trim();
      if (!id && !nombre) return;

      const cupoAdulto = Number(row[2]) || 0;
      const cupoNino = Number(row[3]) || 0;
      const cupoNina = Number(row[4]) || 0;
      const token = String(row[5] || "").trim();
      const respondido = String(row[6] || "").trim().toUpperCase();
      const estado = String(row[7] || "Pendiente").trim();
      const adultoConfirmado = Number(row[8]) || 0;
      const ninoConfirmado = Number(row[9]) || 0;
      const ninaConfirmada = Number(row[10]) || 0;
      const telefono = String(row[11] || "").trim();
      const timestamp = String(row[12] || "").trim();

      totalCupoAdultos += cupoAdulto;
      totalCupoNinos += cupoNino;
      totalCupoNinas += cupoNina;

      if (estado === "Confirma") {
        confirmados++;
        confirmadosAdultos += adultoConfirmado;
        confirmadosNinos += ninoConfirmado;
        confirmadosNinas += ninaConfirmada;
      } else if (estado === "No asiste") {
        noAsisten++;
      } else {
        pendientes++;
      }

      invitados.push({
        rowIndex: index + 2,
        id: id,
        nombre: nombre,
        cupoAdulto: cupoAdulto,
        cupoNino: cupoNino,
        cupoNina: cupoNina,
        token: token,
        respondido: respondido === "SI",
        estado: estado,
        adultoConfirmado: adultoConfirmado,
        ninoConfirmado: ninoConfirmado,
        ninaConfirmada: ninaConfirmada,
        telefono: telefono,
        timestamp: timestamp
      });
    });

    return jsonResponse({
      ok: true,
      invitados: invitados,
      resumen: {
        confirmados: confirmados,
        pendientes: pendientes,
        noAsisten: noAsisten,
        cuposTotales: { adultos: totalCupoAdultos, ninos: totalCupoNinos, ninas: totalCupoNinas },
        confirmadosTotales: { adultos: confirmadosAdultos, ninos: confirmadosNinos, ninas: confirmadosNinas }
      }
    });
  }

  // -------------------------------------------------------------
  // 2. CONSULTA INDIVIDUAL DEL INVITADO (?token=XYZ)
  // -------------------------------------------------------------
  if (params.token) {
    const tokenBuscado = params.token.trim();
    for (let i = 0; i < rows.length; i++) {
      const rowToken = String(rows[i][5] || "").trim();
      if (rowToken === tokenBuscado) {
        const estado = String(rows[i][7] || "Pendiente").trim();
        const respondido = String(rows[i][6] || "").trim().toUpperCase() === "SI";

        return jsonResponse({
          ok: true,
          id: rows[i][0],
          nombre: String(rows[i][1] || "").trim(),
          cupoAdulto: Number(rows[i][2]) || 0,
          cupoNino: Number(rows[i][3]) || 0,
          cupoNina: Number(rows[i][4]) || 0,
          token: tokenBuscado,
          yaRespondio: respondido || estado !== "Pendiente",
          asistencia: estado,
          adultoConfirmado: Number(rows[i][8]) || 0,
          ninoConfirmado: Number(rows[i][9]) || 0,
          ninaConfirmada: Number(rows[i][10]) || 0
        });
      }
    }

    return jsonResponse({ ok: false, error: "Token no encontrado" });
  }

  return jsonResponse({ ok: false, error: "Faltan parámetros requeridos" });
}

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const { token, id, asistencia, adultos, ninos, ninas } = contents;

    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      const rowId = data[i][0];
      const rowToken = String(data[i][5] || "").trim();

      if (rowId == id || rowToken === String(token).trim()) {
        const fila = i + 1; // 1-indexed en Sheets
        const fechaActual = new Date().toLocaleString("es-PY", { timeZone: "America/Asuncion" });

        // Actualización de columnas según la nueva estructura:
        sheet.getRange(fila, 7).setValue("SI");                        // G: RESPONDIDO
        sheet.getRange(fila, 8).setValue(asistencia);                  // H: ASISTENCIA
        sheet.getRange(fila, 9).setValue(asistencia === "Confirma" ? Number(adultos || 0) : 0);  // I: ADULTO CONFIRMADO
        sheet.getRange(fila, 10).setValue(asistencia === "Confirma" ? Number(ninos || 0) : 0);   // J: NIÑO CONFIRMADO
        sheet.getRange(fila, 11).setValue(asistencia === "Confirma" ? Number(ninas || 0) : 0);   // K: NIÑA CONFIRMADO
        sheet.getRange(fila, 13).setValue(fechaActual);                // M: TIMESTAMP

        return jsonResponse({ ok: true });
      }
    }

    return jsonResponse({ ok: false, error: "Invitado no encontrado" });

  } catch (err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
