
export const base_URL = 'https://backend.getkyroai.com'; // siam Latest tht delivered on 20th feb 2024,

// export const base_URL = 'https://ralliform-stephany-spectrometric.ngrok-free.dev';
export const user_ROLE = 'userRole';

// https://ralliform-stephany-spectrometric.ngrok-free.dev

export const decodeJwt = (token) => {
    try {
        const payload = token.split('.')[1]
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
        const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=')
        const json = atob(padded)
        return JSON.parse(json)
    } catch (e) {
        console.error('[useGetUserProfile] Failed to decode access token:', e)
        return null
    }
}

// Get user authentication data from localStorage
export const getAuthData = () => {
    try {
        const auth = JSON.parse(localStorage.getItem('auth'))
        const accessToken = auth?.access || null
        const userInfo = accessToken ? decodeJwt(accessToken) : null

        return {
            accessToken,
            userInfo,
            userId: userInfo?.user_id || null,
            role: userInfo?.role || null,
        }
    } catch {
        return {
            accessToken: null,
            userInfo: null,
            userId: null,
            role: null,
        }
    }
}

