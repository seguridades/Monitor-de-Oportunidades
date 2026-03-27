/**
 * Genera y descarga un archivo .ics para agregar al calendario.
 */
export function downloadIcs({ title, date, description, url }) {
  const d = toDateObj(date)
  if (!d) return

  const dateStr = formatIcsDate(d)
  const endStr = formatIcsDate(new Date(d.getTime() + 60 * 60 * 1000)) // +1h

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Monitor de Oportunidades//ES',
    'BEGIN:VEVENT',
    `DTSTART:${dateStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${escapeIcs(title)}`,
    description ? `DESCRIPTION:${escapeIcs(description)}` : '',
    url ? `URL:${url}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')

  const blob = new Blob([lines], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${title.slice(0, 60).replace(/[^a-zA-Z0-9]/g, '_')}.ics`
  link.click()
  URL.revokeObjectURL(link.href)
}

/**
 * Devuelve la URL de Google Calendar para agregar el evento.
 */
export function googleCalendarUrl({ title, date, description, url }) {
  const d = toDateObj(date)
  if (!d) return null

  const dateStr = formatIcsDate(d)
  const endStr = formatIcsDate(new Date(d.getTime() + 60 * 60 * 1000))
  const details = [description, url ? `Más info: ${url}` : ''].filter(Boolean).join('\n')

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${dateStr}/${endStr}`,
    details,
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

function toDateObj(val) {
  if (!val) return null
  const d = val?.toDate ? val.toDate() : new Date(val)
  return isNaN(d.getTime()) ? null : d
}

function formatIcsDate(d) {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeIcs(str) {
  return String(str).replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}
