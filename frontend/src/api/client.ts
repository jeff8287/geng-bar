import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url ?? ''
      // Only clear auth and redirect for auth-related 401s (expired/invalid token)
      // Skip for admin-only endpoints that guests shouldn't call
      const isAuthEndpoint = url.includes('/auth/')
      const isAdminEndpoint = url.includes('/ingredients') || url.includes('/cocktails/') || url.includes('/admin')
      if (!isAdminEndpoint || isAuthEndpoint) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/') {
          window.location.href = '/'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default client
