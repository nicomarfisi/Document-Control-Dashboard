const excelFileInput = document.getElementById("excelFile");
const excelFileError = document.getElementById("excelFileError");

const disciplineFilter = document.getElementById("disciplineFilter");
const searchInput = document.getElementById("searchInput");

const emptyState = document.getElementById("emptyState");
const tableWrapper = document.getElementById("tableWrapper");
const documentsTableBody = document.getElementById("documentsTableBody");
const tableCount = document.getElementById("tableCount");

let allDocuments = [];

window.addEventListener("DOMContentLoaded", function () {
  loadDocumentsFromStorage();
});

excelFileInput.addEventListener("change", async function () {
  clearError();

  const file = excelFileInput.files[0];

  if (!file) {
    return;
  }

  try {
    const rows = await readExcelFile(file);
    allDocuments = parseDocuments(rows);

    if (allDocuments.length === 0) {
      showError("No se encontraron documentos válidos en el archivo.");
      hideTable();
      return;
    }

    saveDocumentsToStorage(allDocuments, file.name);
    populateFilters(allDocuments);
    renderTable(allDocuments);
    showTable();
  } catch (error) {
    console.error(error);
    showError("No se pudo leer el archivo Excel.");
    hideTable();
  }
});

disciplineFilter.addEventListener("change", applyFilters);
searchInput.addEventListener("input", applyFilters);

async function readExcelFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  const targetSheetName =
    workbook.SheetNames.find((name) =>
      name.toLowerCase().includes("listado")
    ) || workbook.SheetNames[0];

  const sheet = workbook.Sheets[targetSheetName];

  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
  });
}

function parseDocuments(rows) {
  return rows
    .slice(1)
    .filter((row) => row[0])
    .map((row) => {
      const codigo = row[0] || "";
      const titulo = row[1] || "";

      return {
        codigo,
        titulo,
        disciplina: extractDiscipline(codigo),
        peso: Number(row[2]) || 0,
        avanceActual: parseAdvance(row[11]),
        fechaInicio: excelDateToJSDate(row[3]),
        fechaRevA: excelDateToJSDate(row[4]),
        fechaRev0: excelDateToJSDate(row[5]),
        fechaRealInicio: excelDateToJSDate(row[6]),
        fechaRealRevA: excelDateToJSDate(row[7]),
        fechaRealRev0: excelDateToJSDate(row[8]),
      };
    })
    .filter((doc) => doc.codigo);
}

function saveDocumentsToStorage(documents, fileName) {
  localStorage.setItem("documentsData", JSON.stringify(documents));
  localStorage.setItem("documentsFileName", fileName || "");
}

function loadDocumentsFromStorage() {
  const storedData = localStorage.getItem("documentsData");

  if (!storedData) {
    return;
  }

  try {
    const parsedDocuments = JSON.parse(storedData);
    allDocuments = restoreDocumentsFromStorage(parsedDocuments);

    if (allDocuments.length === 0) {
      return;
    }

    populateFilters(allDocuments);
    renderTable(allDocuments);
    showTable();
    clearError();
  } catch (error) {
    console.error("Error al leer documentos desde localStorage:", error);
  }
}

function restoreDocumentsFromStorage(documents) {
  return documents.map((doc) => ({
    ...doc,
    fechaInicio: parseStoredDate(doc.fechaInicio),
    fechaRevA: parseStoredDate(doc.fechaRevA),
    fechaRev0: parseStoredDate(doc.fechaRev0),
    fechaRealInicio: parseStoredDate(doc.fechaRealInicio),
    fechaRealRevA: parseStoredDate(doc.fechaRealRevA),
    fechaRealRev0: parseStoredDate(doc.fechaRealRev0),
  }));
}

function parseStoredDate(value) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  date.setHours(0, 0, 0, 0);
  return date;
}

function parseAdvance(value) {
  if (value === null || value === undefined || value === "") return 0;

  if (typeof value === "number") {
    return value <= 1 ? value * 100 : value;
  }

  const cleaned = String(value).replace("%", "").replace(",", ".").trim();
  const parsed = Number(cleaned);

  if (Number.isNaN(parsed)) return 0;
  return parsed <= 1 ? parsed * 100 : parsed;
}

function excelDateToJSDate(value) {
  if (!value) return null;

  if (value instanceof Date) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    const date = new Date(parsed.y, parsed.m - 1, parsed.d);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  date.setHours(0, 0, 0, 0);
  return date;
}

function extractDiscipline(codigo) {
  const text = String(codigo || "").toUpperCase();
  const match = text.match(/[RPIECY]/);

  if (!match) return "Sin clasificar";

  const disciplineCode = match[0];

  switch (disciplineCode) {
    case "R":
      return "Procesos";
    case "P":
      return "Piping";
    case "I":
      return "Instrumentos";
    case "E":
      return "Electricidad";
    case "C":
      return "Civil";
    case "Y":
      return "HSE";
    default:
      return "Sin clasificar";
  }
}

function populateFilters(documents) {
  const disciplines = [...new Set(documents.map((doc) => doc.disciplina))].sort();

  disciplineFilter.innerHTML = '<option value="">Todas</option>';

  disciplines.forEach((discipline) => {
    const option = document.createElement("option");
    option.value = discipline;
    option.textContent = discipline;
    disciplineFilter.appendChild(option);
  });
}

function applyFilters() {
  const disciplineValue = disciplineFilter.value;
  const searchValue = searchInput.value.trim().toLowerCase();

  const filteredDocuments = allDocuments.filter((doc) => {
    const matchesDiscipline =
      !disciplineValue || doc.disciplina === disciplineValue;

    const matchesSearch =
      !searchValue ||
      doc.codigo.toLowerCase().includes(searchValue) ||
      doc.titulo.toLowerCase().includes(searchValue);

    return matchesDiscipline && matchesSearch;
  });

  renderTable(filteredDocuments);
}

function renderTable(documents) {
  documentsTableBody.innerHTML = "";

  documents.forEach((doc) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${doc.codigo}</td>
      <td>${doc.titulo || "-"}</td>
      <td>${doc.disciplina}</td>
      <td>${formatNumber(doc.peso)}</td>
      <td>${renderAdvanceBadge(doc.avanceActual)}</td>
      <td>${formatDate(doc.fechaInicio)}</td>
      <td>${formatDate(doc.fechaRevA)}</td>
      <td>${formatDate(doc.fechaRev0)}</td>
      <td>${formatDate(doc.fechaRealInicio)}</td>
      <td>${formatDate(doc.fechaRealRevA)}</td>
      <td>${formatDate(doc.fechaRealRev0)}</td>
    `;

    documentsTableBody.appendChild(row);
  });

  tableCount.textContent = `${documents.length} documento(s)`;
}

function renderAdvanceBadge(value) {
  const normalized = normalizeAdvance(value);
  return `<span class="badge badge-${normalized}">${normalized}%</span>`;
}

function normalizeAdvance(value) {
  const numericValue = Number(value) || 0;

  if (numericValue >= 100) return 100;
  if (numericValue >= 70) return 70;
  if (numericValue >= 30) return 30;
  return 0;
}

function formatDate(date) {
  if (!date) return "-";

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(value);
}

function showError(message) {
  excelFileError.textContent = message;
}

function clearError() {
  excelFileError.textContent = "";
}

function showTable() {
  emptyState.classList.add("hidden");
  tableWrapper.classList.remove("hidden");
}

function hideTable() {
  tableWrapper.classList.add("hidden");
  emptyState.classList.remove("hidden");
}