const form = document.getElementById("milestoneForm");
const clearBtn = document.getElementById("clearBtn");

const emptyState = document.getElementById("emptyState");
const results = document.getElementById("results");

const excelFileInput = document.getElementById("excelFile");
const reportFrequencyInput = document.getElementById("reportFrequency");
const reportDayInput = document.getElementById("reportDay");

const excelFileError = document.getElementById("excelFileError");
const reportFrequencyError = document.getElementById("reportFrequencyError");
const reportDayError = document.getElementById("reportDayError");

const resultDocumentCount = document.getElementById("resultDocumentCount");
const resultTotalWeight = document.getElementById("resultTotalWeight");
const resultNextReport = document.getElementById("resultNextReport");
const resultDeviation = document.getElementById("resultDeviation");

const resultProjectStatus = document.getElementById("resultProjectStatus");
const projectStatusCard = document.getElementById("projectStatusCard");

const resultCurrentPlan = document.getElementById("resultCurrentPlan");
const resultCurrentReal = document.getElementById("resultCurrentReal");

const resultDocs0 = document.getElementById("resultDocs0");
const resultDocs30 = document.getElementById("resultDocs30");
const resultDocs70 = document.getElementById("resultDocs70");
const resultDocs100 = document.getElementById("resultDocs100");

const resultProjectStart = document.getElementById("resultProjectStart");
const resultPlanEnd = document.getElementById("resultPlanEnd");
const resultRealEnd = document.getElementById("resultRealEnd");
const resultFrequency = document.getElementById("resultFrequency");
const resultReportDay = document.getElementById("resultReportDay");

const resultPlan30 = document.getElementById("resultPlan30");
const resultPlan60 = document.getElementById("resultPlan60");
const resultPlan90 = document.getElementById("resultPlan90");

const resultReal30 = document.getElementById("resultReal30");
const resultReal60 = document.getElementById("resultReal60");
const resultReal90 = document.getElementById("resultReal90");

const timelinePlanStart = document.getElementById("timelinePlanStart");
const timelinePlan30 = document.getElementById("timelinePlan30");
const timelinePlan60 = document.getElementById("timelinePlan60");
const timelinePlan90 = document.getElementById("timelinePlan90");
const timelinePlanEnd = document.getElementById("timelinePlanEnd");

const timelineRealStart = document.getElementById("timelineRealStart");
const timelineReal30 = document.getElementById("timelineReal30");
const timelineReal60 = document.getElementById("timelineReal60");
const timelineReal90 = document.getElementById("timelineReal90");
const timelineRealEnd = document.getElementById("timelineRealEnd");

const chartCanvas = document.getElementById("sCurveChart");
const chartContext = chartCanvas.getContext("2d");

window.addEventListener("DOMContentLoaded", function () {
  loadDashboardFromStorage();
});

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  clearErrors();

  const file = excelFileInput.files[0];
  const reportFrequencyValue = reportFrequencyInput.value;
  const reportDayValue = reportDayInput.value;

  const isValid = validateForm(file, reportFrequencyValue, reportDayValue);

  if (!isValid) {
    hideResults();
    clearChart();
    return;
  }

  try {
    const rows = await readExcelFile(file);
    const documents = parseDocuments(rows);

    if (documents.length === 0) {
      showError(excelFileInput, excelFileError, "No se encontraron documentos válidos en el archivo.");
      hideResults();
      clearChart();
      return;
    }

    saveDocumentsToStorage(documents, file.name);
    saveDashboardSettings(reportFrequencyValue, reportDayValue);

    renderDashboard(documents, reportFrequencyValue, reportDayValue);

    emptyState.classList.add("hidden");
    results.classList.remove("hidden");
  } catch (error) {
    console.error(error);
    showError(excelFileInput, excelFileError, "No se pudo leer el archivo Excel.");
    hideResults();
    clearChart();
  }
});

clearBtn.addEventListener("click", function () {
  form.reset();
  clearErrors();
  hideResults();
  clearChart();
  resetProjectStatusCard();
  clearStoredProjectData();
});

function validateForm(file, reportFrequencyValue, reportDayValue) {
  let valid = true;

  if (!file) {
    showError(excelFileInput, excelFileError, "Seleccioná un archivo Excel.");
    valid = false;
  }

  if (!reportFrequencyValue) {
    showError(
      reportFrequencyInput,
      reportFrequencyError,
      "Seleccioná una frecuencia de reporte."
    );
    valid = false;
  }

  if (reportDayValue === "") {
    showError(
      reportDayInput,
      reportDayError,
      "Seleccioná el día de emisión del reporte."
    );
    valid = false;
  }

  return valid;
}

function showError(inputElement, errorElement, message) {
  inputElement.classList.add("input-error");
  errorElement.textContent = message;
}

function clearErrors() {
  const inputs = [excelFileInput, reportFrequencyInput, reportDayInput];
  const errorElements = [excelFileError, reportFrequencyError, reportDayError];

  inputs.forEach((input) => input.classList.remove("input-error"));
  errorElements.forEach((error) => {
    error.textContent = "";
  });
}

function hideResults() {
  results.classList.add("hidden");
  emptyState.classList.remove("hidden");
}

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
    .map((row) => ({
      codigo: row[0],
      titulo: row[1],
      peso: Number(row[2]) || 0,
      fechaInicio: excelDateToJSDate(row[3]),
      fechaRevA: excelDateToJSDate(row[4]),
      fechaRev0: excelDateToJSDate(row[5]),
      fechaRealInicio: excelDateToJSDate(row[6]),
      fechaRealRevA: excelDateToJSDate(row[7]),
      fechaRealRev0: excelDateToJSDate(row[8]),
      avanceActual: parseAdvance(row[11]),
    }))
    .filter((doc) => doc.peso > 0);
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

function saveDocumentsToStorage(documents, fileName) {
  localStorage.setItem("documentsData", JSON.stringify(documents));
  localStorage.setItem("documentsFileName", fileName || "");
}

function saveDashboardSettings(reportFrequency, reportDay) {
  localStorage.setItem(
    "dashboardSettings",
    JSON.stringify({
      reportFrequency,
      reportDay,
    })
  );
}

function loadDashboardFromStorage() {
  const storedData = localStorage.getItem("documentsData");
  const storedSettings = localStorage.getItem("dashboardSettings");

  if (!storedData || !storedSettings) {
    return;
  }

  try {
    const parsedDocuments = JSON.parse(storedData);
    const settings = JSON.parse(storedSettings);

    const documents = restoreDocumentsFromStorage(parsedDocuments);
    const reportFrequencyValue = settings.reportFrequency || "";
    const reportDayValue = settings.reportDay || "";

    if (!documents.length || !reportFrequencyValue || reportDayValue === "") {
      return;
    }

    reportFrequencyInput.value = reportFrequencyValue;
    reportDayInput.value = reportDayValue;

    renderDashboard(documents, reportFrequencyValue, reportDayValue);

    emptyState.classList.add("hidden");
    results.classList.remove("hidden");
    clearErrors();
  } catch (error) {
    console.error("Error al cargar dashboard desde localStorage:", error);
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

function renderDashboard(documents, reportFrequencyValue, reportDayValue) {
  const projectStart = getProjectStart(documents);
  const totalWeight = getTotalWeight(documents);

  const planCurve = calculateCurve(documents, "plan");
  const realCurve = calculateCurve(documents, "real");

  const plan30 = findCurveMilestone(planCurve, 0.30);
  const plan60 = findCurveMilestone(planCurve, 0.60);
  const plan90 = findCurveMilestone(planCurve, 0.90);

  const real30 = findCurveMilestone(realCurve, 0.30);
  const real60 = findCurveMilestone(realCurve, 0.60);
  const real90 = findCurveMilestone(realCurve, 0.90);

  const planEnd = getPlanProjectEnd(documents);
  const realEnd = getRealProjectEnd(documents);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reportDayNumber = Number(reportDayValue);
  const anchorDate = getAnchorReportDate(projectStart || today, reportDayNumber);
  const nextReport = calculateNextReportDate(
    today,
    anchorDate,
    reportDayNumber,
    reportFrequencyValue
  );

  const currentPlan = getCurveValueAtDate(planCurve, today);
  const currentReal = getCurveValueAtDate(realCurve, today);
  const deviation = currentReal - currentPlan;
  const projectStatus = getProjectStatus(deviation);
  const documentStatusCounts = getDocumentStatusCounts(documents);

  fillSummary({
    documents,
    totalWeight,
    nextReport,
    deviation,
    projectStatus,
    currentPlan,
    currentReal,
    documentStatusCounts,
    projectStart,
    planEnd,
    realEnd,
    reportFrequencyValue,
    reportDayNumber,
    plan30,
    plan60,
    plan90,
    real30,
    real60,
    real90,
  });

  fillTimelines({
    projectStart,
    plan30,
    plan60,
    plan90,
    planEnd,
    real30,
    real60,
    real90,
    realEnd,
  });

  drawPlanVsRealCurve(planCurve, realCurve);
}

function getProjectStart(documents) {
  const dates = documents
    .flatMap((doc) => [
      doc.fechaInicio,
      doc.fechaRevA,
      doc.fechaRev0,
      doc.fechaRealInicio,
      doc.fechaRealRevA,
      doc.fechaRealRev0,
    ])
    .filter(Boolean)
    .sort((a, b) => a - b);

  return dates[0] || null;
}

function getPlanProjectEnd(documents) {
  const planRev0Dates = documents
    .map((doc) => doc.fechaRev0)
    .filter(Boolean)
    .sort((a, b) => b - a);

  return planRev0Dates[0] || null;
}

function getRealProjectEnd(documents) {
  const realRev0Dates = documents
    .map((doc) => doc.fechaRealRev0)
    .filter(Boolean)
    .sort((a, b) => b - a);

  return realRev0Dates[0] || null;
}

function getTotalWeight(documents) {
  return documents.reduce((acc, doc) => acc + doc.peso, 0);
}

function calculateCurve(documents, mode) {
  const totalWeight = getTotalWeight(documents);
  const events = buildProgressEvents(documents, mode);

  const progressByDocument = {};
  const curve = [];

  events.forEach((event) => {
    const previousProgress = progressByDocument[event.codigo] || 0;

    if (event.progreso > previousProgress) {
      progressByDocument[event.codigo] = event.progreso;
    }

    const earnedWeight = documents.reduce((acc, doc) => {
      const progress = progressByDocument[doc.codigo] || 0;
      return acc + doc.peso * progress;
    }, 0);

    curve.push({
      fecha: new Date(event.fecha),
      avance: totalWeight > 0 ? earnedWeight / totalWeight : 0,
    });
  });

  return mergeCurveByDate(curve);
}

function buildProgressEvents(documents, mode) {
  const events = [];

  documents.forEach((doc) => {
    if (mode === "plan") {
      if (doc.fechaInicio) {
        events.push({
          fecha: doc.fechaInicio,
          codigo: doc.codigo,
          progreso: 0.3,
        });
      }

      if (doc.fechaRevA) {
        events.push({
          fecha: doc.fechaRevA,
          codigo: doc.codigo,
          progreso: 0.7,
        });
      }

      if (doc.fechaRev0) {
        events.push({
          fecha: doc.fechaRev0,
          codigo: doc.codigo,
          progreso: 1.0,
        });
      }

      return;
    }

    const avance = doc.avanceActual || 0;

    if (avance >= 30 && doc.fechaRealInicio) {
      events.push({
        fecha: doc.fechaRealInicio,
        codigo: doc.codigo,
        progreso: 0.3,
      });
    }

    if (avance >= 70 && doc.fechaRealRevA) {
      events.push({
        fecha: doc.fechaRealRevA,
        codigo: doc.codigo,
        progreso: 0.7,
      });
    }

    if (avance >= 100 && doc.fechaRealRev0) {
      events.push({
        fecha: doc.fechaRealRev0,
        codigo: doc.codigo,
        progreso: 1.0,
      });
    }
  });

  events.sort((a, b) => a.fecha - b.fecha);
  return events;
}

function mergeCurveByDate(curve) {
  const merged = [];

  curve.forEach((point) => {
    const last = merged[merged.length - 1];

    if (last && last.fecha.getTime() === point.fecha.getTime()) {
      last.avance = point.avance;
    } else {
      merged.push(point);
    }
  });

  return merged;
}

function findCurveMilestone(curve, target) {
  return curve.find((point) => point.avance >= target) || null;
}

function getCurveValueAtDate(curve, targetDate) {
  if (!curve.length) return 0;

  let currentValue = 0;

  curve.forEach((point) => {
    if (point.fecha <= targetDate) {
      currentValue = point.avance;
    }
  });

  return currentValue;
}

function getDocumentStatusCounts(documents) {
  const counts = {
    docs0: 0,
    docs30: 0,
    docs70: 0,
    docs100: 0,
  };

  documents.forEach((doc) => {
    const avance = normalizeDocumentAdvance(doc.avanceActual);

    if (avance >= 100) {
      counts.docs100 += 1;
    } else if (avance >= 70) {
      counts.docs70 += 1;
    } else if (avance >= 30) {
      counts.docs30 += 1;
    } else {
      counts.docs0 += 1;
    }
  });

  return counts;
}

function normalizeDocumentAdvance(value) {
  const numericValue = Number(value) || 0;

  if (numericValue >= 100) return 100;
  if (numericValue >= 70) return 70;
  if (numericValue >= 30) return 30;
  return 0;
}

function fillSummary(data) {
  resultDocumentCount.textContent = data.documents.length;
  resultTotalWeight.textContent = formatNumber(data.totalWeight);
  resultNextReport.textContent = formatDate(data.nextReport);
  resultDeviation.textContent = formatPercentSigned(data.deviation);

  resultProjectStatus.textContent = data.projectStatus.label;
  updateProjectStatusCard(data.projectStatus.className);

  resultCurrentPlan.textContent = formatPercent(data.currentPlan);
  resultCurrentReal.textContent = formatPercent(data.currentReal);

  resultDocs0.textContent = data.documentStatusCounts.docs0;
  resultDocs30.textContent = data.documentStatusCounts.docs30;
  resultDocs70.textContent = data.documentStatusCounts.docs70;
  resultDocs100.textContent = data.documentStatusCounts.docs100;

  resultProjectStart.textContent = formatDateOrDash(data.projectStart);
  resultPlanEnd.textContent = formatDateOrDash(data.planEnd);
  resultRealEnd.textContent = formatDateOrDash(data.realEnd);
  resultFrequency.textContent = getFrequencyLabel(data.reportFrequencyValue);
  resultReportDay.textContent = getDayName(data.reportDayNumber);

  resultPlan30.textContent = formatMilestone(data.plan30);
  resultPlan60.textContent = formatMilestone(data.plan60);
  resultPlan90.textContent = formatMilestone(data.plan90);

  resultReal30.textContent = formatMilestone(data.real30);
  resultReal60.textContent = formatMilestone(data.real60);
  resultReal90.textContent = formatMilestone(data.real90);
}

function fillTimelines(data) {
  timelinePlanStart.textContent = formatDateOrDash(data.projectStart);
  timelinePlan30.textContent = formatMilestoneDate(data.plan30);
  timelinePlan60.textContent = formatMilestoneDate(data.plan60);
  timelinePlan90.textContent = formatMilestoneDate(data.plan90);
  timelinePlanEnd.textContent = formatDateOrDash(data.planEnd);

  timelineRealStart.textContent = formatDateOrDash(data.projectStart);
  timelineReal30.textContent = formatMilestoneDate(data.real30);
  timelineReal60.textContent = formatMilestoneDate(data.real60);
  timelineReal90.textContent = formatMilestoneDate(data.real90);
  timelineRealEnd.textContent = formatDateOrDash(data.realEnd);
}

function drawPlanVsRealCurve(planCurve, realCurve) {
  clearChart();

  const width = chartCanvas.width;
  const height = chartCanvas.height;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const allDates = [...planCurve, ...realCurve].map((point) => point.fecha.getTime());
  if (allDates.length === 0) return;

  const minDate = Math.min(...allDates);
  const maxDate = Math.max(...allDates);
  const dateRange = Math.max(1, maxDate - minDate);

  drawGrid(width, height, paddingLeft, paddingRight, paddingTop, paddingBottom, chartWidth, chartHeight);
  drawAxesLabels(width, height, paddingLeft, paddingTop, paddingBottom, minDate, maxDate, dateRange, chartWidth, chartHeight);
  drawCurve(planCurve, "#2563eb", minDate, dateRange, paddingLeft, paddingTop, chartWidth, chartHeight);
  drawCurve(realCurve, "#16a34a", minDate, dateRange, paddingLeft, paddingTop, chartWidth, chartHeight);
}

function drawGrid(width, height, paddingLeft, paddingRight, paddingTop, paddingBottom, chartWidth, chartHeight) {
  chartContext.lineWidth = 1;
  chartContext.strokeStyle = "#cbd5e1";
  chartContext.fillStyle = "#64748b";
  chartContext.font = "12px Arial";

  for (let i = 0; i <= 5; i++) {
    const y = paddingTop + (chartHeight / 5) * i;
    chartContext.beginPath();
    chartContext.moveTo(paddingLeft, y);
    chartContext.lineTo(width - paddingRight, y);
    chartContext.stroke();

    const percentLabel = `${100 - i * 20}%`;
    chartContext.fillText(percentLabel, 15, y + 4);
  }
}

function drawAxesLabels(width, height, paddingLeft, paddingTop, paddingBottom, minDate, maxDate, dateRange, chartWidth, chartHeight) {
  const steps = 6;

  for (let i = 0; i <= steps; i++) {
    const x = paddingLeft + (chartWidth / steps) * i;
    chartContext.beginPath();
    chartContext.moveTo(x, paddingTop);
    chartContext.lineTo(x, height - paddingBottom);
    chartContext.stroke();

    const currentTime = minDate + (dateRange / steps) * i;
    const currentDate = new Date(currentTime);
    chartContext.fillText(formatShortDate(currentDate), x - 18, height - 15);
  }

  chartContext.fillText("Fechas", width / 2 - 20, height - 2);
}

function drawCurve(curve, color, minDate, dateRange, paddingLeft, paddingTop, chartWidth, chartHeight) {
  if (!curve.length) return;

  chartContext.beginPath();

  curve.forEach((point, index) => {
    const x = paddingLeft + ((point.fecha.getTime() - minDate) / dateRange) * chartWidth;
    const y = paddingTop + (1 - point.avance) * chartHeight;

    if (index === 0) {
      chartContext.moveTo(x, y);
    } else {
      chartContext.lineTo(x, y);
    }
  });

  chartContext.lineWidth = 3;
  chartContext.strokeStyle = color;
  chartContext.stroke();

  curve.forEach((point) => {
    const x = paddingLeft + ((point.fecha.getTime() - minDate) / dateRange) * chartWidth;
    const y = paddingTop + (1 - point.avance) * chartHeight;

    chartContext.beginPath();
    chartContext.arc(x, y, 4, 0, Math.PI * 2);
    chartContext.fillStyle = color;
    chartContext.fill();
  });
}

function getAnchorReportDate(projectStartDate, targetDay) {
  const baseDate = projectStartDate ? new Date(projectStartDate) : new Date();
  const oneWeekAfterStart = addDays(baseDate, 7);
  return getNextOrSameWeekday(oneWeekAfterStart, targetDay);
}

function calculateNextReportDate(currentDate, anchorDate, targetDay, frequency) {
  switch (frequency) {
    case "weekly":
      return getNextCycledDate(currentDate, anchorDate, 7);
    case "biweekly":
      return getNextCycledDate(currentDate, anchorDate, 14);
    case "monthly":
      return getNextSecondWeekdayOfMonth(currentDate, targetDay);
    default:
      return getNextCycledDate(currentDate, anchorDate, 7);
  }
}

function getNextCycledDate(currentDate, anchorDate, cycleDays) {
  const result = new Date(anchorDate);
  result.setHours(0, 0, 0, 0);

  while (result <= currentDate) {
    result.setDate(result.getDate() + cycleDays);
  }

  return result;
}

function getNextSecondWeekdayOfMonth(currentDate, targetDay) {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const candidateThisMonth = getNthWeekdayOfMonth(currentYear, currentMonth, targetDay, 2);

  if (candidateThisMonth > currentDate) {
    return candidateThisMonth;
  }

  const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
  return getNthWeekdayOfMonth(
    nextMonthDate.getFullYear(),
    nextMonthDate.getMonth(),
    targetDay,
    2
  );
}

function getNthWeekdayOfMonth(year, month, targetDay, occurrence) {
  const firstDayOfMonth = new Date(year, month, 1);
  const firstDayWeekday = firstDayOfMonth.getDay();

  const offset = (targetDay - firstDayWeekday + 7) % 7;
  const dayOfMonth = 1 + offset + (occurrence - 1) * 7;

  return new Date(year, month, dayOfMonth);
}

function getNextOrSameWeekday(baseDate, targetDay) {
  const date = new Date(baseDate);
  const currentDay = date.getDay();
  const daysUntilTarget = (targetDay - currentDay + 7) % 7;

  date.setDate(date.getDate() + daysUntilTarget);
  return date;
}

function addDays(date, days) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

function getProjectStatus(deviation) {
  if (deviation > 0.02) {
    return {
      label: "Adelantado",
      className: "status-ahead",
    };
  }

  if (deviation < -0.02) {
    return {
      label: "Atrasado",
      className: "status-delayed",
    };
  }

  return {
    label: "En línea",
    className: "status-on-track",
  };
}

function updateProjectStatusCard(statusClassName) {
  projectStatusCard.classList.remove(
    "status-ahead",
    "status-on-track",
    "status-delayed"
  );

  projectStatusCard.classList.add(statusClassName);
}

function resetProjectStatusCard() {
  resultProjectStatus.textContent = "-";
  projectStatusCard.classList.remove(
    "status-ahead",
    "status-on-track",
    "status-delayed"
  );
}

function formatMilestone(point) {
  if (!point) return "-";
  return `${formatDate(point.fecha)} (${formatPercent(point.avance)})`;
}

function formatMilestoneDate(point) {
  if (!point) return "-";
  return formatDate(point.fecha);
}

function formatDate(date) {
  if (!date) return "-";
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateOrDash(date) {
  return date ? formatDate(date) : "-";
}

function formatShortDate(date) {
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatPercentSigned(value) {
  const percentage = (value * 100).toFixed(1);
  return `${value >= 0 ? "+" : ""}${percentage}%`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(value);
}

function getFrequencyLabel(frequency) {
  switch (frequency) {
    case "weekly":
      return "Semanal";
    case "biweekly":
      return "Quincenal";
    case "monthly":
      return "Mensual";
    default:
      return "-";
  }
}

function getDayName(dayNumber) {
  switch (dayNumber) {
    case 0:
      return "Domingo";
    case 1:
      return "Lunes";
    case 2:
      return "Martes";
    case 3:
      return "Miércoles";
    case 4:
      return "Jueves";
    case 5:
      return "Viernes";
    case 6:
      return "Sábado";
    default:
      return "-";
  }
}

function clearChart() {
  chartContext.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
}

function clearStoredProjectData() {
  localStorage.removeItem("documentsData");
  localStorage.removeItem("documentsFileName");
  localStorage.removeItem("dashboardSettings");
}