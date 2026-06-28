/**
 * =================================================================================
 * API Backend para Consultorio Dental v2.1 - con Devolución de Datos
 * =================================================================================
 * Este script actúa como un servidor backend (API) que se conecta a un Google Sheet.
 * 
 * MEJORAS v2.1:
 * - Las funciones add/update para Citas e Historial ahora devuelven la lista
 *   completa y actualizada de los datos del paciente para una experiencia de
 *   usuario más fluida en el frontend (evita recargas).
 * - Mapeo de datos consistente en getPacienteById.
 * =================================================================================
 */

// --- CONFIGURACIÓN GLOBAL ---
const ss = SpreadsheetApp.getActiveSpreadsheet();
const SHEET_PACIENTES = ss.getSheetByName("Pacientes");
const SHEET_CITAS = ss.getSheetByName("Citas");
const SHEET_HISTORIAL = ss.getSheetByName("Historial_Clinico");

// --- CONFIGURACIÓN DE CACHÉ PARA OPTIMIZACIÓN ---
const CACHE_DURATION = 300; // 5 minutos en segundos
const cache = CacheService.getScriptCache();

// Función para limpiar caché cuando se modifican datos
function clearCache() {
  try {
    cache.removeAll(['sheet_data_Pacientes', 'sheet_data_Citas', 'sheet_data_Historial_Clinico', 'pacientes_with_appointments']);
  } catch (e) {
    console.log('Error al limpiar caché:', e);
  }
}

// --- MANEJADOR DE PETICIONES OPTIONS (para CORS) ---
function doOptions(e) {
  return createJsonResponseWithCORS({ message: 'CORS preflight successful' });
}

// --- MANEJADOR DE PETICIONES GET ---
function doGet(e) {
  try {
    const action = e.parameter.action;
    let result;

    switch (action) {
      case 'getPacientes':
        result = getSheetData(SHEET_PACIENTES);
        break;
      case 'searchPacientes':
        const query = e.parameter.query;
        if (!query) throw new Error("El parámetro 'query' es requerido.");
        result = searchPacientes(query);
        break;
      case 'getPacienteById':
        const pacienteId = e.parameter.id;
        const forceRefresh = e.parameter.forceRefresh === 'true';
        if (!pacienteId) throw new Error("El parámetro 'id' es requerido.");
        if (forceRefresh) {
          clearCache(); // Limpiar caché si se solicita actualización forzada
        }
        result = getPacienteById(pacienteId, forceRefresh);
        break;
      case 'debugData':
        result = debugData();
        break;
      case 'debugHeaders':
        result = debugSheetHeaders();
        break;
      case 'getPacientesWithAppointments':
        result = getPacientesWithAppointments();
        break;
      case 'forceClearCache':
        clearCache();
        result = { message: "Caché limpiado exitosamente" };
        break;
      case 'getFreshData':
        clearCache(); // Limpiar caché primero
        result = getPacientesWithAppointments(); // Obtener datos frescos
        break;
      default:
        throw new Error("Acción GET no válida.");
    }
    return createJsonResponseWithCORS({ status: 'success', data: result });
  } catch (error) {
    return createJsonResponseWithCORS({ status: 'error', message: error.message });
  }
}

// --- MANEJADOR DE PETICIONES POST ---
function doPost(e) {
  // Configurar CORS headers para permitir peticiones desde Vercel
  const response = {
    status: 'error',
    message: 'Error desconocido'
  };
  
  try {
    // Log de la petición recibida para debugging
    console.log('POST request received:', {
      postData: e.postData ? e.postData.contents : 'No postData',
      parameters: e.parameter,
      timestamp: new Date().toISOString()
    });
    
    // Verificar que existe postData
    if (!e.postData || !e.postData.contents) {
      throw new Error('No se recibieron datos POST');
    }
    
    const request = JSON.parse(e.postData.contents);
    const { action, data } = request;
    
    console.log('Parsed request:', { action, dataKeys: Object.keys(data || {}) });
    
    if (!action) throw new Error("La solicitud POST debe incluir 'action'.");
    if (!data) throw new Error("La solicitud POST debe incluir 'data'.");

    let result;
    
    switch (action) {
      case 'addPaciente': 
        console.log('Executing addPaciente');
        result = addPaciente(data); 
        break;
      case 'updatePaciente': 
        console.log('Executing updatePaciente');
        result = updatePaciente(data); 
        break;
      case 'deletePaciente': 
        console.log('Executing deletePaciente');
        result = deleteRowById(SHEET_PACIENTES, data.ID_Paciente); 
        break;
      case 'deleteMultiplePacientes': 
        console.log('Executing deleteMultiplePacientes');
        result = deleteMultiplePacientes(data); 
        break;
      
      case 'addCita': 
        console.log('Executing addCita with data:', data);
        result = addCita(data); 
        break;
      case 'updateCita': 
        console.log('Executing updateCita');
        result = updateCita(data); 
        break;
      case 'getCitaById': 
        console.log('Executing getCitaById');
        result = getCitaById(data.ID_Cita); 
        break;
      case 'deleteCita': 
        console.log('Executing deleteCita');
        result = deleteCita(data); 
        break;

      case 'addHistorial': 
        console.log('Executing addHistorial with data:', data);
        result = addHistorial(data); 
        break;
      case 'updateHistorial': 
        console.log('Executing updateHistorial');
        result = updateHistorial(data); 
        break;
      case 'getHistorialById': 
        console.log('Executing getHistorialById');
        result = getHistorialById(data.ID_Historial); 
        break;
      case 'deleteHistorial': 
        console.log('Executing deleteHistorial');
        result = deleteHistorial(data); 
        break;

      case 'updateField': 
        console.log('Executing updateField');
        result = updateField(data); 
        break;

      case 'debugData': 
        console.log('Executing debugData');
        result = debugData(); 
        break;
      case 'debugHeaders': 
        console.log('Executing debugHeaders');
        result = debugSheetHeaders(); 
        break;

      default: 
        throw new Error(`Acción POST no válida: ${action}`);
    }
    
    console.log('Action executed successfully:', action);
    return createJsonResponseWithCORS({ status: 'success', data: result });
    
  } catch (error) {
    console.error('Error in doPost:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return createJsonResponseWithCORS({ status: 'error', message: error.message });
  }
}

// ================================================================
// --- FUNCIONES LÓGICAS (CRUD Y BÚSQUEDA) ---
// ================================================================

// --- PACIENTES ---
function addPaciente(data) {
  const newId = `PAC-${new Date().getTime()}`;
  const fechaNacimiento = new Date(data.Fecha_Nacimiento);
  const edad = new Date().getFullYear() - fechaNacimiento.getFullYear();
  
  const newRow = [
    newId, data.DNI, data.Nombres, data.Apellidos, data.Fecha_Nacimiento,
    edad, data.Genero, data.Telefono_Principal, data.Telefono_Alternativo,
    data.Email, data.Direccion, new Date(), 'Activo'
  ];
  SHEET_PACIENTES.appendRow(newRow);
  clearCache(); // Limpiar caché después de agregar paciente
  return { message: "Paciente agregado exitosamente.", ID_Paciente: newId };
}

function updatePaciente(data) {
  const fechaNacimiento = new Date(data.Fecha_Nacimiento);
  const edad = new Date().getFullYear() - fechaNacimiento.getFullYear();
  const rowData = [
    data.ID_Paciente, data.DNI, data.Nombres, data.Apellidos, data.Fecha_Nacimiento,
    edad, data.Genero, data.Telefono_Principal, data.Telefono_Alternativo,
    data.Email, data.Direccion, data.Fecha_Registro || new Date(), data.Estado || 'Activo'
  ];
  const result = updateRowById(SHEET_PACIENTES, data.ID_Paciente, rowData);
  clearCache(); // Limpiar caché después de actualizar paciente
  return result;
}

function searchPacientes(query) {
  const allPacientes = getSheetData(SHEET_PACIENTES);
  // Filtrar solo pacientes activos
  const pacientesActivos = allPacientes.filter(p => 
    p.Estado === 'Activo' || !p.Estado || p.Estado === ''
  );
  const searchTerm = query.toLowerCase();
  if (!searchTerm) return [];
  return pacientesActivos.filter(p => 
    `${p.Nombres} ${p.Apellidos}`.toLowerCase().includes(searchTerm) || 
    String(p.DNI).toLowerCase().includes(searchTerm)
  );
}

function getPacienteById(id, forceRefresh = false) {
  // Si se solicita forzar actualización, limpiar cache primero
  if (forceRefresh) {
    clearCache();
  }
  
  const allPacientes = getSheetData(SHEET_PACIENTES);
  const paciente = allPacientes.find(p => p.ID_Paciente === id);
  if (!paciente) return null;
  
  // Verificar si el paciente está activo
  if (paciente.Estado === 'Inactivo') {
    return null; // No devolver pacientes inactivos
  }
  
  const allHistorial = getSheetData(SHEET_HISTORIAL);
  const allCitas = getSheetData(SHEET_CITAS);
  
  const patientHistorial = allHistorial.filter(h => h.ID_Paciente === id);
  
  paciente.Historial_Clinico = patientHistorial;
  paciente.Citas = allCitas.filter(c => c.ID_Paciente === id);
  
  return paciente;
}

function getPacientesWithAppointments() {
  const cacheKey = 'pacientes_with_appointments';
  
  // Intentar obtener datos del caché primero
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return JSON.parse(cachedData);
  }
  
  const allPacientes = getSheetData(SHEET_PACIENTES);
  // Filtrar solo pacientes activos
  const pacientesActivos = allPacientes.filter(paciente => 
    paciente.Estado === 'Activo' || !paciente.Estado || paciente.Estado === ''
  );
  const allCitas = getSheetData(SHEET_CITAS);
  
  // Obtener fecha actual para filtrar citas futuras
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Crear array de pacientes con sus próximas citas
  const pacientesWithAppointments = pacientesActivos.map(paciente => {
    // Filtrar citas futuras del paciente y ordenarlas por fecha
    const citasFuturas = allCitas
      .filter(cita => {
        if (cita.ID_Paciente !== paciente.ID_Paciente) return false;
        const fechaCita = new Date(cita.Fecha_Cita);
        return fechaCita >= today && (cita.Estado_Cita === 'Programada' || cita.Estado_Cita === 'Confirmada');
      })
      .sort((a, b) => new Date(a.Fecha_Cita) - new Date(b.Fecha_Cita));
    
    // Agregar información de la próxima cita al paciente
    const proximaCita = citasFuturas.length > 0 ? citasFuturas[0] : null;
    
    return {
      ...paciente,
      proximaCita: proximaCita,
      fechaProximaCita: proximaCita ? proximaCita.Fecha_Cita : null,
      horaProximaCita: proximaCita ? proximaCita.Hora_Inicio : null,
      motivoProximaCita: proximaCita ? proximaCita.Motivo_Cita : null
    };
  });
  
  // Ordenar pacientes: primero los que tienen citas, luego por fecha de cita más cercana
  const pacientesOrdenados = pacientesWithAppointments.sort((a, b) => {
    // Si uno tiene cita y el otro no, el que tiene cita va primero
    if (a.proximaCita && !b.proximaCita) return -1;
    if (!a.proximaCita && b.proximaCita) return 1;
    
    // Si ambos tienen citas, ordenar por fecha más cercana
    if (a.proximaCita && b.proximaCita) {
      return new Date(a.fechaProximaCita) - new Date(b.fechaProximaCita);
    }
    
    // Si ninguno tiene citas, ordenar alfabéticamente por nombre
    return (a.Nombres + ' ' + a.Apellidos).localeCompare(b.Nombres + ' ' + b.Apellidos);
  });
  
  // Guardar resultado en caché
  try {
    cache.put(cacheKey, JSON.stringify(pacientesOrdenados), CACHE_DURATION);
  } catch (e) {
    console.log('Error al guardar pacientes en caché:', e);
  }
  
  return pacientesOrdenados;
}

// --- CITAS (MODIFICADAS) ---
function addCita(data) {
  const newId = `CITA-${new Date().getTime()}`;
  const newRow = [
    newId, data.ID_Paciente, data.Fecha_Cita, data.Hora_Inicio, data.Hora_Fin,
    data.Motivo_Cita, data.Estado_Cita || 'Programada', data.Notas_Cita, data.ID_Doctor
  ];
  SHEET_CITAS.appendRow(newRow);
  clearCache(); // Limpiar caché después de agregar cita

  // DEVOLVER LA LISTA ACTUALIZADA
  const updatedData = getSheetData(SHEET_CITAS).filter(c => c.ID_Paciente === data.ID_Paciente);
  return { message: "Cita agregada exitosamente.", appointmentId: newId, updatedData: updatedData };
}

function updateCita(data) {
  const rowData = [
    data.ID_Cita, data.ID_Paciente, data.Fecha_Cita, data.Hora_Inicio, data.Hora_Fin,
    data.Motivo_Cita, data.Estado_Cita, data.Notas_Cita, data.ID_Doctor
  ];
  updateRowById(SHEET_CITAS, data.ID_Cita, rowData);

  // DEVOLVER LA LISTA ACTUALIZADA
  const updatedData = getSheetData(SHEET_CITAS).filter(c => c.ID_Paciente === data.ID_Paciente);
  return { message: "Cita actualizada exitosamente.", updatedData: updatedData };
}

// --- HISTORIAL CLÍNICO (MODIFICADAS) ---
function addHistorial(data) {
  const newId = `HIST-${new Date().getTime()}`;
  const newRow = [
    newId, data.ID_Paciente, data.ID_Cita, data.Fecha_Historial || new Date(), data.Diagnostico,
    data.Tratamiento_Realizado, data.Prescripciones, data.Notas_Adicionales,
    data.Costo_Tratamiento, data.Estado_Pago, data.Sexo || '',
    data.Estado_Civil || '', data.Ocupacion || '', data.Escolaridad || '',
    data.Nombre_Padre || '', data.Nombre_Madre || '', data.Telefono_Contacto || '',
    data.Motivo_Consulta || '', data.Antecedentes_Personales || ''
  ];
  SHEET_HISTORIAL.appendRow(newRow);
  clearCache(); // Limpiar caché después de agregar historial
  
  // DEVOLVER LA LISTA ACTUALIZADA
  const updatedData = getSheetData(SHEET_HISTORIAL).filter(h => h.ID_Paciente === data.ID_Paciente);
  return { message: "Registro de historial agregado.", historyId: newId, updatedData: updatedData };
}

function updateHistorial(data) {
  const rowData = [
    data.ID_Historial, data.ID_Paciente, data.ID_Cita, data.Fecha_Historial, data.Diagnostico,
    data.Tratamiento_Realizado, data.Prescripciones, data.Notas_Adicionales,
    data.Costo_Tratamiento, data.Estado_Pago, data.Sexo || '',
    data.Estado_Civil || '', data.Ocupacion || '', data.Escolaridad || '',
    data.Nombre_Padre || '', data.Nombre_Madre || '', data.Telefono_Contacto || '',
    data.Motivo_Consulta || '', data.Antecedentes_Personales || ''
  ];
  updateRowById(SHEET_HISTORIAL, data.ID_Historial, rowData);

  // DEVOLVER LA LISTA ACTUALIZADA
  const updatedData = getSheetData(SHEET_HISTORIAL).filter(h => h.ID_Paciente === data.ID_Paciente);
  return { message: "Registro de historial actualizado.", updatedData: updatedData };
}

// ================================================================
// --- FUNCIONES AUXILIARES OPTIMIZADAS ---
// ================================================================

function getSheetData(sheet) {
  const sheetName = sheet.getName();
  const cacheKey = `sheet_data_${sheetName}`;
  
  // Intentar obtener datos del caché primero
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return JSON.parse(cachedData);
  }
  
  // Si no hay caché, obtener datos de la hoja
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  if (values.length <= 1) return []; // Si solo hay cabecera o está vacía
  const headers = values.shift();
  
  const result = values.map((row, rowIndex) => {
    const obj = {};
    headers.forEach((header, index) => {
      let value = row[index];
      
      // Formatear fechas correctamente - verificar múltiples variaciones de nombres
      const dateHeaders = ['Fecha_Historial', 'Fecha_Cita', 'Fecha_Nacimiento', 'Fecha Historial', 'Fecha Cita', 'Fecha Nacimiento', 'fecha_historial', 'fecha_cita', 'fecha_nacimiento'];
      if (dateHeaders.includes(header) && value instanceof Date) {
        // Convertir fecha a formato YYYY-MM-DD
        const year = value.getFullYear();
        const month = (value.getMonth() + 1).toString().padStart(2, '0');
        const day = value.getDate().toString().padStart(2, '0');
        value = `${year}-${month}-${day}`;
      }
      
      // Si el valor es undefined o null, convertir a string vacío para evitar undefined
      if (value === undefined || value === null) {
        value = '';
      }
      
      // Formatear horas correctamente
      if ((header === 'Hora_Inicio' || header === 'Hora_Fin' || header === 'Hora') && value instanceof Date) {
        // Convertir fecha a formato HH:MM
        const hours = value.getHours().toString().padStart(2, '0');
        const minutes = value.getMinutes().toString().padStart(2, '0');
        value = `${hours}:${minutes}`;
      }
      
      obj[header] = value;
    });
    return obj;
  });
  
  // Guardar datos en caché para futuras consultas
  try {
    cache.put(cacheKey, JSON.stringify(result), CACHE_DURATION);
  } catch (e) {
    console.log('Error al guardar en caché:', e);
  }
  
  return result;
}

function updateRowById(sheet, id, newRowData) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000); // Espera hasta 15 segundos para evitar errores de concurrencia
  try {
    const ids = sheet.getRange(2, 1, sheet.getLastRow(), 1).getValues().flat();
    const rowIndex = ids.indexOf(id);
    
    if (rowIndex === -1) throw new Error("ID no encontrado para actualizar.");
    
    sheet.getRange(rowIndex + 2, 1, 1, newRowData.length).setValues([newRowData]);
    return { message: "Fila actualizada exitosamente." };
  } finally {
    lock.releaseLock();
  }
}

function deleteRowById(sheet, id) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const ids = sheet.getRange(2, 1, sheet.getLastRow(), 1).getValues().flat();
    const rowIndex = ids.indexOf(id);

    if (rowIndex === -1) throw new Error("ID no encontrado para eliminar.");

    if (sheet.getName() === 'Pacientes') {
      // NUEVA FUNCIONALIDAD: Eliminación completa en cascada
      deleteCitasByPacienteId(id);
      deleteHistorialByPacienteId(id);
      
      // Eliminar físicamente el paciente (no solo marcarlo como inactivo)
      sheet.deleteRow(rowIndex + 2);
      clearCache();
      return { message: "Paciente y todos sus datos relacionados eliminados completamente." };
    } else {
      // Para otras hojas (citas, historial), eliminar físicamente
      sheet.deleteRow(rowIndex + 2);
      clearCache();
      return { message: "Fila eliminada exitosamente." };
    }
  } finally {
    lock.releaseLock();
  }
}

// Nuevas funciones auxiliares para eliminación en cascada
function deleteCitasByPacienteId(pacienteId) {
  const citasSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Citas');
  if (!citasSheet || citasSheet.getLastRow() <= 1) return;
  
  const data = citasSheet.getDataRange().getValues();
  
  // Buscar desde la última fila hacia arriba para evitar problemas de índices
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][2] === pacienteId) { // Columna C (ID_Paciente)
      citasSheet.deleteRow(i + 1);
    }
  }
}

function deleteHistorialByPacienteId(pacienteId) {
  const historialSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Historial');
  if (!historialSheet || historialSheet.getLastRow() <= 1) return;
  
  const data = historialSheet.getDataRange().getValues();
  
  // Buscar desde la última fila hacia arriba para evitar problemas de índices
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][2] === pacienteId) { // Columna C (ID_Paciente)
      historialSheet.deleteRow(i + 1);
    }
  }
}

// Nueva función para eliminación múltiple
function deleteMultiplePacientes(data) {
  try {
    const pacienteIds = data.pacienteIds;
    if (!Array.isArray(pacienteIds) || pacienteIds.length === 0) {
      throw new Error("No se proporcionaron IDs de pacientes para eliminar.");
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(30000); // Más tiempo para operaciones múltiples
    
    try {
      let deletedCount = 0;
      const errors = [];
      
      for (const pacienteId of pacienteIds) {
        try {
          // Eliminar citas e historial relacionados
          deleteCitasByPacienteId(pacienteId);
          deleteHistorialByPacienteId(pacienteId);
          
          // Eliminar el paciente
          const result = deleteRowById(SHEET_PACIENTES, pacienteId);
          if (result.message.includes("eliminados") || result.message.includes("eliminada")) {
            deletedCount++;
          }
        } catch (error) {
          errors.push(`Error eliminando paciente ${pacienteId}: ${error.message}`);
        }
      }
      
      clearCache();
      
      if (errors.length > 0) {
        return {
          message: `Se eliminaron ${deletedCount} pacientes. Errores: ${errors.join(', ')}`,
          partialSuccess: true,
          deletedCount,
          errors
        };
      }
      
      return {
        message: `Se eliminaron exitosamente ${deletedCount} pacientes y todos sus datos relacionados.`,
        deletedCount
      };
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return {
      message: `Error en eliminación múltiple: ${error.message}`,
      error: true
    };
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Función mejorada para manejar CORS correctamente
function createJsonResponseWithCORS(obj) {
  const output = ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  
  // Configurar headers CORS explícitamente para Vercel
  const response = HtmlService.createHtmlOutput('')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  
  // Los headers CORS se configuran en el deployment de Google Apps Script
  // pero devolvemos el output JSON directamente
  return output;
}

// --- FUNCIONES DE DEBUG ---
// ================================================================

function debugData() {
  const allPacientes = getSheetData(SHEET_PACIENTES);
  const allHistorial = getSheetData(SHEET_HISTORIAL);
  const allCitas = getSheetData(SHEET_CITAS);
  
  return {
    pacientes: allPacientes.slice(0, 2), // Solo los primeros 2 para no sobrecargar
    historial: allHistorial.slice(0, 2),
    citas: allCitas.slice(0, 2)
  };
}

function debugSheetHeaders() {
  // Verificar headers exactos de cada hoja
  const historialRange = SHEET_HISTORIAL.getDataRange();
  const historialValues = historialRange.getValues();
  const historialHeaders = historialValues[0];
  
  const pacientesRange = SHEET_PACIENTES.getDataRange();
  const pacientesValues = pacientesRange.getValues();
  const pacientesHeaders = pacientesValues[0];
  const citasRange = SHEET_CITAS.getDataRange();
  const citasValues = citasRange.getValues();
  const citasHeaders = citasValues[0];
  
  return {
    historial_headers: historialHeaders,
    pacientes_headers: pacientesHeaders,
    citas_headers: citasHeaders,
    historial_sample_row: historialValues[1] || null,
    pacientes_sample_row: pacientesValues[1] || null,
    citas_sample_row: citasValues[1] || null
  };
}

// --- FUNCIONES ADICIONALES ---
function getCitaById(id) {
  const allCitas = getSheetData(SHEET_CITAS);
  return allCitas.find(c => c.ID_Cita === id) || null;
}

function getHistorialById(id) {
  const allHistorial = getSheetData(SHEET_HISTORIAL);
  return allHistorial.find(h => h.ID_Historial === id) || null;
}

// --- FUNCIONES ESPECÍFICAS DE ELIMINACIÓN ---
function deleteCita(data) {
  try {
    const result = deleteRowById(SHEET_CITAS, data.ID_Cita);
    clearCache(); // Limpiar caché después de eliminar
    return { message: "Cita eliminada exitosamente." };
  } catch (error) {
    throw new Error(`Error al eliminar cita: ${error.message}`);
  }
}

function deleteHistorial(data) {
  try {
    const result = deleteRowById(SHEET_HISTORIAL, data.ID_Historial);
    clearCache(); // Limpiar caché después de eliminar
    return { message: "Historial clínico eliminado exitosamente." };
  } catch (error) {
    throw new Error(`Error al eliminar historial: ${error.message}`);
  }
}

// --- FUNCIÓN OPTIMIZADA PARA ACTUALIZAR CAMPOS INDIVIDUALES ---
function updateField(data) {
  const { recordId, fieldName, newValue, recordType } = data;
  
  if (!recordId || !fieldName || newValue === undefined || !recordType) {
    throw new Error("Faltan parámetros requeridos: recordId, fieldName, newValue, recordType");
  }
  
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // Espera hasta 10 segundos
  
  try {
    let sheet, idColumn;
    
    // Determinar qué hoja usar según el tipo de registro
    if (recordType === 'history') {
      sheet = SHEET_HISTORIAL;
      idColumn = 'ID_Historial';
    } else if (recordType === 'appointment') {
      sheet = SHEET_CITAS;
      idColumn = 'ID_Cita';
    } else {
      throw new Error("Tipo de registro no válido. Use 'history' o 'appointment'.");
    }
    
    // Obtener los datos de la hoja
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    const headers = values[0];
    
    // Encontrar el índice de la columna del campo a actualizar
    const fieldIndex = headers.indexOf(fieldName);
    if (fieldIndex === -1) {
      throw new Error(`Campo '${fieldName}' no encontrado en la hoja.`);
    }
    
    // Encontrar el índice de la columna del ID
    const idIndex = headers.indexOf(idColumn);
    if (idIndex === -1) {
      throw new Error(`Columna de ID '${idColumn}' no encontrada.`);
    }
    
    // Buscar la fila que contiene el registro
    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (values[i][idIndex] === recordId) {
        rowIndex = i;
        break;
      }
    }
    
    if (rowIndex === -1) {
      throw new Error(`Registro con ID '${recordId}' no encontrado.`);
    }
    
    // Actualizar solo la celda específica
    sheet.getRange(rowIndex + 1, fieldIndex + 1).setValue(newValue);
    
    // Limpiar caché para forzar actualización en próximas consultas
    clearCache();
    
    return {
      message: "Campo actualizado exitosamente.",
      recordId: recordId,
      fieldName: fieldName,
      newValue: newValue,
      recordType: recordType
    };
    
  } finally {
    lock.releaseLock();
  }
}