import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

function getAdminApp(): App {
  const existing = getApps().find(a => a.name === 'cesp-admin')
  if (existing) return existing
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? '{}')
  return initializeApp({ credential: cert(serviceAccount) }, 'cesp-admin')
}

export function getAdminMessaging() {
  return getMessaging(getAdminApp())
}
