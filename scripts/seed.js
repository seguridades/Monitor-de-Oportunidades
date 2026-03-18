/**
 * Seed script — populates the opportunities collection with initial data.
 *
 * Usage:
 *   1. Download your Firebase service account key from:
 *      Firebase Console → Project Settings → Service Accounts → Generate new private key
 *   2. Save it as scripts/serviceAccountKey.json (or anywhere you prefer)
 *   3. Run:
 *        GOOGLE_APPLICATION_CREDENTIALS=scripts/serviceAccountKey.json \
 *        VITE_FIREBASE_PROJECT_ID=your-project-id \
 *        node scripts/seed.js
 *
 *   Or use dotenv: create a .env file with VITE_FIREBASE_PROJECT_ID and run with
 *        node -r dotenv/config scripts/seed.js
 *   (requires: npm install -D dotenv)
 */

const admin = require('firebase-admin')

const projectId = process.env.VITE_FIREBASE_PROJECT_ID
if (!projectId) {
  console.error('Error: VITE_FIREBASE_PROJECT_ID env var is required.')
  process.exit(1)
}

const credential = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? admin.credential.applicationDefault()
  : (() => {
      try {
        const serviceAccount = require('./serviceAccountKey.json')
        return admin.credential.cert(serviceAccount)
      } catch {
        console.error('Error: provide GOOGLE_APPLICATION_CREDENTIALS env var or place serviceAccountKey.json in scripts/')
        process.exit(1)
      }
    })()

admin.initializeApp({ credential, projectId })

const db = admin.firestore()
const FieldValue = admin.firestore.FieldValue

const now = FieldValue.serverTimestamp()

const opportunities = [
  {
    title: 'Digital Defenders Partnership',
    url: 'https://www.digitaldefenders.org',
    type: 'fuente',
    fit: 'Alto',
    freq: 'semanal',
    description: 'Fuente de convocatorias y recursos para defensores digitales.',
    tags: ['digital', 'seguridad', 'AL'],
    status: 'nueva',
    featured: false,
  },
  {
    title: 'Internews Tech & Society',
    url: 'https://internews.org/technology',
    type: 'fuente',
    fit: 'Alto',
    freq: 'semanal',
    description: 'Proyectos y convocatorias de Internews en tecnología y sociedad.',
    tags: ['medios', 'tecnología', 'periodismo'],
    status: 'nueva',
    featured: false,
  },
  {
    title: 'Access Now Jobs & RFPs',
    url: 'https://www.accessnow.org/help/#jobs',
    type: 'fuente',
    fit: 'Alto',
    freq: 'semanal',
    description: 'Empleos y solicitudes de propuestas de Access Now.',
    tags: ['derechos digitales', 'empleos', 'RFP'],
    status: 'nueva',
    featured: false,
  },
  {
    title: 'ARTICLE 19 convocatorias',
    url: 'https://www.article19.org/get-involved/jobs',
    type: 'fuente',
    fit: 'Bueno',
    freq: 'semanal',
    description: 'Oportunidades de trabajo y colaboración con ARTICLE 19.',
    tags: ['libertad de expresión', 'empleos'],
    status: 'nueva',
    featured: false,
  },
  {
    title: 'CIVICUS consultancies',
    url: 'https://www.civicus.org/consultancies',
    type: 'fuente',
    fit: 'Selectivo',
    freq: 'mensual',
    description: 'Consultorías publicadas por CIVICUS para la sociedad civil.',
    tags: ['sociedad civil', 'consultoría'],
    status: 'nueva',
    featured: false,
  },
  {
    title: 'Frontline Defenders vacantes',
    url: 'https://www.frontlinedefenders.org/vacancies',
    type: 'fuente',
    fit: 'Bueno',
    freq: 'mensual',
    description: 'Vacantes y oportunidades en Frontline Defenders.',
    tags: ['defensores', 'derechos humanos', 'empleos'],
    status: 'nueva',
    featured: false,
  },
  {
    title: 'CPJ Jobs',
    url: 'https://cpj.org/about/jobs',
    type: 'fuente',
    fit: 'Bueno',
    freq: 'mensual',
    description: 'Empleos en el Comité para la Protección de Periodistas.',
    tags: ['periodismo', 'empleos', 'CPJ'],
    status: 'nueva',
    featured: false,
  },
  {
    title: 'Derechos Digitales',
    url: 'https://www.derechosdigitales.org/trabaja-con-nosotros',
    type: 'fuente',
    fit: 'Bueno',
    freq: 'mensual',
    description: 'Trabaja con Derechos Digitales — convocatorias y empleo.',
    tags: ['derechos digitales', 'AL', 'empleos'],
    status: 'nueva',
    featured: false,
  },
  {
    title: 'fundsforNGOs',
    url: 'https://www.fundsforngos.org',
    type: 'fuente',
    fit: 'Bueno',
    freq: 'semanal',
    description: 'Directorio de fondos y subvenciones para ONGs.',
    tags: ['fondos', 'ONGs', 'grants'],
    status: 'nueva',
    featured: false,
  },
  {
    title: 'Tinker Foundation',
    url: 'https://www.tinker.org/institutional-grants-apply-page',
    type: 'grant',
    fit: 'Selectivo',
    deadline: null,
    monto: 'USD 50k–150k/año hasta 3 años',
    quien_puede_aplicar: 'ONGs con foco en gobernanza democrática y educación en AL',
    description: 'Grants institucionales de la Tinker Foundation para gobernanza y educación en América Latina.',
    tags: ['gobernanza', 'educación', 'AL', 'grant'],
    status: 'nueva',
    featured: false,
  },
  {
    title: 'FAU-LAC — Apoyos de Respuesta Rápida',
    url: 'https://fsfr.net/fau-dev/apoyos',
    type: 'grant',
    fit: 'Selectivo',
    deadline: null,
    monto: 'hasta USD 10k',
    quien_puede_aplicar: 'Defensoras y orgs feministas en AL. No es para consultorías.',
    description: 'Apoyos de respuesta rápida del Fondo de Acción Urgente para América Latina.',
    tags: ['feminismo', 'respuesta rápida', 'AL', 'grant'],
    status: 'nueva',
    featured: false,
  },
]

async function seed() {
  console.log(`Seeding ${opportunities.length} opportunities to project: ${projectId}`)

  let count = 0
  for (const opp of opportunities) {
    try {
      await db.collection('opportunities').add({
        ...opp,
        addedBy: null,
        addedByOrg: 'seed',
        createdAt: now,
        updatedAt: now,
      })
      console.log(`  ✓ ${opp.title}`)
      count++
    } catch (e) {
      console.error(`  ✗ ${opp.title}: ${e.message}`)
    }
  }

  console.log(`\nDone. ${count}/${opportunities.length} records seeded.`)
  process.exit(0)
}

seed().catch((e) => {
  console.error('Fatal error:', e)
  process.exit(1)
})
