import axios from 'axios'

// In production (Docker/nginx) VITE_API_URL is unset → falls back to relative /api
// which nginx proxies to the backend.
// On Vercel, set VITE_API_URL=https://your-backend.onrender.com in project settings.
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}`
  : '/api'

const client = axios.create({ baseURL })

client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('eco_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * Build a full URL for a backend-served asset (e.g. /uploads/abc.jpg).
 * Uses VITE_API_URL when set (Vercel → Render), otherwise relative path.
 */
export function getImageUrl(path: string | null | undefined): string {
  if (!path) return ''
  const base = import.meta.env.VITE_API_URL ?? ''
  return `${base}${path}`
}

export default client
