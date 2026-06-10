import { useQuery } from '@tanstack/react-query'
import axiosApi from '../service/axiosInstance'

const useGetUserProfile = () => {
    // Decode JWT access token safely
    const decodeJwt = (token) => {
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

    // Get access token and decode user info
    const userDataFromLocalStorage = JSON.parse(localStorage.getItem('auth'))
    const accessToken = userDataFromLocalStorage?.access || null
    const userInfo = accessToken ? decodeJwt(accessToken) : null
    const userId = userInfo?.user_id || null

    // Fetch user profile data
    const {
        data: userProfileData,
        isLoading: userProfileLoading,
        error: userProfileError,
        refetch: refetchUserProfile
    } = useQuery({
        queryKey: ['userProfileData', userId],
        queryFn: async () => {
            if (!userId) throw new Error('User ID not found in token')
            const response = await axiosApi.get(`/api/v1/users/${userId}/`)
   
            return response.data
        },
        enabled: !!userId
    })

    return {
        userProfileData,
        userProfileLoading,
        userProfileError,
        refetchUserProfile,
        accessToken,
        userInfo,
    }
}

export default useGetUserProfile