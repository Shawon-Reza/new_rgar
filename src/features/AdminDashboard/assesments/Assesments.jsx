
import { useQuery } from '@tanstack/react-query'
import axiosApi from '../../../service/axiosInstance'
import CreateNewAssesment from './CreateNewAssesment'
import GeneratedAssesmentsAndHistories from './GeneratedAssesmentsAndHistories'


const Assesments = () => {
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