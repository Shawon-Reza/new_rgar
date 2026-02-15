import Lottie from 'lottie-react'
import lottie from "../assets/lotties/404error.json"
import { useContext } from 'react';
import GlobalProvider, { GlobalContext } from '../contexts/GlobalProvider';

const NotFoundpage = () => {

const {dummyInfo} = useContext(GlobalContext);
console.log(dummyInfo.name)

    return (
        <div className='h-screen flex items-center justify-center bg-[#68dee0] text-white w-full '>

            <Lottie animationData={lottie} loop={true} className='w-screen' />
        </div>
    )
}

export default NotFoundpage