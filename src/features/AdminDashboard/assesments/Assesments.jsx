
import { useQuery } from '@tanstack/react-query'
import axiosApi from '../../../service/axiosInstance'
import CreateNewAssesment from './CreateNewAssesment'
import GeneratedAssesmentsAndHistories from './GeneratedAssesmentsAndHistories'


const Assesments = () => {


    // ...................Fetch my assessments (logs only, UI unchanged)....................\\
    // const { data: myAssessments, isLoading: myAssessmentsLoading, error: myAssessmentsError } = useQuery({
    //     queryKey: ['my-assessments'],
    //     queryFn: async () => {
    //         const res = await axiosApi.get('/api/v1/my-assessments/')
    //         return res.data
    //     },
    //     onSuccess: (data) => {
    //         console.log('[DashboardContent] /api/v1/my-assessments response:', data)
    //     },
    //     onError: (err) => {
    //         console.error('[DashboardContent] Error fetching my assessments:', err)
    //     },
    //     staleTime: 5 * 60 * 1000,
    // })
    // console.log("Consol*********************:", myAssessments?.data)


    return (
        <div>
            <div>
                <section>
                    <CreateNewAssesment></CreateNewAssesment>
                </section>
                <section>
                    <GeneratedAssesmentsAndHistories></GeneratedAssesmentsAndHistories>
                </section>
            </div>


            {/* For Users */}
            {/* <div>
                <section>

                </section>
            </div> */}



        </div>
    )
}

export default Assesments