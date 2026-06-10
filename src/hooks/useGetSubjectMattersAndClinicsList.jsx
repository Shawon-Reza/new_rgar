
import { useQuery } from '@tanstack/react-query'
import axiosApi from '../service/axiosInstance'

const useGetSubjectMattersAndClinicsList = () => {

  // ============ FETCH CLINICS DATA ============
  const {
    data: clinicsList = [],
    isLoading: clinicsLoading,
    error: clinicsError,
    refetch: refetchClinics
  } = useQuery({
    queryKey: ['clinics'],
    queryFn: async () => {
      const response = await axiosApi.get('/api/v1/clinics/')

      return Array.isArray(response.data) ? response.data : response.data?.results || response.data?.data || []
    },
  })

  // ============ FETCH SUBJECT MATTERS DATA ============
  const {
    data: subjectMattersList = [],
    isLoading: subjectMattersLoading,
    error: subjectMattersError,
    refetch: refetchSubjectMatters
  } = useQuery({
    queryKey: ['subjectMatters'],
    queryFn: async () => {
      const response = await axiosApi.get('/api/v1/subjects/')
 
      // Handle both array and object responses
      const dataArray = Array.isArray(response.data) ? response.data : response.data?.results || response.data?.data || []
      return dataArray
    },
  })


  return {
    // userList,
    clinicsList,
    subjectMattersList,
    isLoading: clinicsLoading || subjectMattersLoading ,
    error: clinicsError || subjectMattersError ,
    refetch: () => {
      refetchClinics()
      refetchSubjectMatters()
      refetchUserList()
    }
  }
}

export default useGetSubjectMattersAndClinicsList