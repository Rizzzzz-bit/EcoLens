import axios from 'axios'

// In production the frontend is served by nginx which proxies /api/* → backend.
// In local dev (npm run dev), vite's proxy does the same via vite.config.ts.
const client = axios.create({ baseURL: '/api' })

client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('eco_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default client
