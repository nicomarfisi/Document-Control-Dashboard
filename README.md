# Document Control Dashboard

Aplicación web desarrollada con **HTML, CSS y JavaScript** para el seguimiento documental de proyectos de ingeniería.

Permite cargar un archivo Excel con el listado de documentos del proyecto, calcular el avance **planificado** y **real**, visualizar la **Curva S**, analizar hitos de avance y consultar el detalle por documento con filtros por disciplina.

---

## Objetivo del proyecto

Este proyecto fue desarrollado como una herramienta práctica orientada a **Project Controls / Document Control**, con foco en:

- seguimiento de avance documental
- comparación entre planificación y ejecución real
- visualización rápida del estado del proyecto
- análisis detallado por documento

La lógica de negocio fue pensada para representar de forma simple el avance de documentación de ingeniería a partir de emisiones parciales y finales.

---

## Funcionalidades principales

### Dashboard principal
- carga de archivo Excel
- cálculo de **Curva S Plan vs Real**
- hitos de avance:
  - 30%
  - 60%
  - 90%
- cálculo de:
  - inicio del proyecto
  - fin planificado
  - fin real
  - próximo reporte
  - desvío actual
- KPIs de control documental:
  - cantidad de documentos
  - peso total
  - avance plan actual
  - avance real actual
  - documentos en 0%, 30%, 70% y 100%
- tarjeta visual de estado:
  - **Adelantado**
  - **En línea**
  - **Atrasado**

### Página Detalle
- tabla de documentos
- filtro por disciplina
- búsqueda por código o título
- visualización de:
  - peso
  - avance actual
  - fechas planificadas
  - fechas reales

### Persistencia entre páginas
La aplicación utiliza **localStorage** para que el archivo cargado en el Dashboard pueda seguir utilizándose al navegar hacia la página **Detalle** y volver, sin necesidad de volver a cargarlo.

---

## Lógica de avance documental

Cada documento aporta avance según su estado alcanzado:

- **Inicio** → 30% del peso
- **Revisión A** → 70% del peso
- **Emisión 0** → 100% del peso

### Curva planificada
Se construye utilizando las fechas planificadas del Excel.

### Curva real
Se construye utilizando las fechas reales del Excel, pero limitada por el **avance actual** del documento.

Esto significa que si un documento tiene fechas futuras cargadas pero su avance actual todavía no alcanzó ese nivel, esas etapas **no se consideran** en la curva real.

---

## Estructura esperada del Excel

La aplicación trabaja con una plantilla Excel donde se utilizan las siguientes columnas:

| Columna | Campo |
|--------|------|
| C | Peso |
| D | Fecha Inicio Plan |
| E | Fecha Rev A Plan |
| F | Fecha Rev 0 Plan |
| G | Fecha Inicio Real |
| H | Fecha Rev A Real |
| I | Fecha Rev 0 Real |
| L | Avance actual |

### Interpretación del avance actual (columna L)
- 0 → sin avance
- 30 → documento iniciado
- 70 → documento en Rev A
- 100 → documento emitido en Rev 0

---

## Clasificación por disciplina

En la página **Detalle**, la disciplina se identifica a partir del código del documento:

- **R** → Procesos
- **P** → Piping
- **I** → Instrumentos
- **E** → Electricidad
- **C** → Civil
- **Y** → HSE

---

## Estructura del proyecto

```bash
/index.html
/style.css
/script.js

/detalle.html
/detalle.css
/detalle.js