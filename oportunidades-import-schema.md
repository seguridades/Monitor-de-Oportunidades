# Schema de importación — Monitor de Oportunidades

El formato de importación es un **array JSON** de objetos. Se pega directamente en el campo de importación en la sección Administración → Importar.

```json
[ { ... }, { ... } ]
```

---

## Campos universales

| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| `title` | string | **Sí** | Nombre de la oportunidad |
| `type` | string | **Sí** | Ver tipos válidos abajo |
| `description` | string | No | Descripción general |
| `url` | string | No | URL principal (sitio web, formulario, etc.) |
| `tags` | array \| string | No | Array de strings o string separado por comas. Ej: `["grant", "LAC"]` o `"grant, LAC"` |

**Tipos válidos para `type`:**
`fuente` · `convocatoria` · `grant` · `beca` · `capacitacion` · `evento` · `red` · `linea_ayuda`

---

## Campos por tipo

### `fuente` — Fuente de información / newsletter / medio

| Campo | Tipo | Default | Valores válidos |
|-------|------|---------|-----------------|
| `freq` | string | `"semanal"` | `"semanal"` · `"mensual"` |

---

### `convocatoria` — Convocatoria abierta

| Campo | Tipo | Default | Notas |
|-------|------|---------|-------|
| `deadline` | string (YYYY-MM-DD) | `null` | Fecha límite de aplicación |
| `monto` | string | — | Monto o rango. Ej: `"USD 10k–50k"` |
| `reminderDays` | number | `7` | Días antes del deadline para recordatorio |

---

### `grant` — Grant / fondo de financiamiento

| Campo | Tipo | Default | Notas |
|-------|------|---------|-------|
| `deadline` | string (YYYY-MM-DD) | `null` | Fecha límite |
| `monto` | string | — | Monto o rango |
| `quien_puede_aplicar` | string | — | Quién es elegible |

---

### `beca` — Beca / Fellowship / Residencia

| Campo | Tipo | Default | Notas |
|-------|------|---------|-------|
| `deadline` | string (YYYY-MM-DD) | `null` | Fecha límite de aplicación |
| `monto` | string | — | Estipendio o cobertura. Ej: `"USD 2,000/mes"` |
| `duracion` | string | — | Ej: `"6 meses"`, `"1 año"` |
| `quien_puede_aplicar` | string | — | Quién es elegible |

---

### `capacitacion` — Capacitación / taller / curso

| Campo | Tipo | Default | Valores válidos |
|-------|------|---------|-----------------|
| `fecha` | string (YYYY-MM-DD) | `null` | Fecha del evento |
| `modalidad` | string | `"virtual"` | `"virtual"` · `"presencial"` · `"hibrida"` |
| `dirigido_a` | string | — | Audiencia objetivo |

---

### `evento` — Evento / actividad / conferencia

| Campo | Tipo | Default | Valores válidos |
|-------|------|---------|-----------------|
| `fecha` | string (YYYY-MM-DD) | `null` | Fecha del evento |
| `modalidad` | string | `"virtual"` | `"virtual"` · `"presencial"` · `"hibrida"` |
| `lugar` | string | — | Ciudad o plataforma |
| `dirigido_a` | string | — | Audiencia objetivo |

---

### `red` — Red / comunidad / coalición

| Campo | Tipo | Default | Notas |
|-------|------|---------|-------|
| `como_unirse` | string | — | Descripción de cómo unirse |

---

### `linea_ayuda` — Línea de ayuda / soporte de emergencia

| Campo | Tipo | Default | Notas |
|-------|------|---------|-------|
| `respuesta_rapida` | boolean | `false` | `true` si la respuesta es en horas |
| `como_acceder` | string | — | Cómo contactar o solicitar ayuda |
| `disponibilidad` | string | — | Horario o disponibilidad. Ej: `"24/7"` |
| `para_quien` | string | — | A quién va dirigido |

---

## Reglas de validación

- `title` vacío → error, ítem rechazado
- `type` no reconocido → error, ítem rechazado
- Campos opcionales ausentes o vacíos → simplemente se omiten (no generan error)
- Fechas inválidas → se convierten a `null` sin error
- `tags` como string → se normaliza automáticamente a array separando por comas

---

## Ejemplo completo (un ítem de cada tipo)

```json
[
  {
    "title": "EFF Deeplinks",
    "type": "fuente",
    "description": "Blog de la Electronic Frontier Foundation sobre privacidad y libertad digital.",
    "url": "https://www.eff.org/deeplinks",
    "tags": ["privacidad", "derechos digitales", "EE.UU."],
    "freq": "semanal"
  },
  {
    "title": "OTF Internet Freedom Fund",
    "type": "grant",
    "description": "Apoya proyectos de herramientas de privacidad, evasión de censura y comunicaciones seguras.",
    "url": "https://www.opentech.fund/funds/internet-freedom-fund/",
    "tags": ["grant", "seguridad digital", "Global"],
    "monto": "USD 10k–900k",
    "quien_puede_aplicar": "Individuos y organizaciones a nivel global",
    "deadline": "2026-09-30"
  },
  {
    "title": "Mozilla Tech & Society Fellowship",
    "type": "beca",
    "description": "Fellowship para investigadores trabajando en intersección de tecnología y sociedad.",
    "url": "https://foundation.mozilla.org/fellowships/",
    "tags": ["fellowship", "investigación", "tecnología"],
    "monto": "USD 60k",
    "duracion": "10 meses",
    "quien_puede_aplicar": "Investigadores y tecnólogos a nivel global",
    "deadline": "2026-05-15"
  },
  {
    "title": "Security Training for Journalists — CPJ",
    "type": "capacitacion",
    "description": "Capacitación en seguridad digital para periodistas en riesgo.",
    "url": "https://cpj.org/safety/",
    "tags": ["periodismo", "seguridad digital", "capacitación"],
    "fecha": "2026-07-10",
    "modalidad": "virtual",
    "dirigido_a": "Periodistas y trabajadores de medios"
  },
  {
    "title": "RightsCon 2026",
    "type": "evento",
    "description": "Cumbre global sobre derechos humanos en la era digital.",
    "url": "https://rightscon.org",
    "tags": ["evento", "derechos humanos", "digital"],
    "fecha": "2026-10-05",
    "modalidad": "hibrida",
    "lugar": "Bangkok, Tailandia",
    "dirigido_a": "Sociedad civil, activistas, tecnólogos"
  },
  {
    "title": "Digital Rights Foundation Network",
    "type": "red",
    "description": "Red de organizaciones que trabajan en derechos digitales en Asia del Sur.",
    "url": "https://digitalrightsfoundation.pk",
    "tags": ["red", "derechos digitales", "Asia"],
    "como_unirse": "Completar formulario de membresía en el sitio web"
  },
  {
    "title": "Access Now Digital Security Helpline",
    "type": "linea_ayuda",
    "description": "Asistencia técnica gratuita en seguridad digital para activistas y periodistas bajo amenaza.",
    "url": "https://www.accessnow.org/help/",
    "tags": ["seguridad digital", "emergencia", "helpline"],
    "respuesta_rapida": true,
    "como_acceder": "Formulario seguro en el sitio o correo cifrado",
    "disponibilidad": "24/7",
    "para_quien": "Activistas, periodistas y ONGs bajo amenaza digital"
  }
]
```
