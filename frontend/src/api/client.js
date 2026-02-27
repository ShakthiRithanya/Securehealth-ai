import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
})

api.interceptors.request.use((config) => {
    const tok = localStorage.getItem('securehealth_token')
    if (tok) {
        config.headers.Authorization = `Bearer ${tok}`
    }
    return config
})

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('securehealth_token')
            localStorage.removeItem('securehealth_user')
            window.location.href = '/'
        }
        return Promise.reject(err)
    }
)

export default api
