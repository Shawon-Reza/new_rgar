
import useGetUserProfile from '../../../hooks/useGetUserProfile';
import AITrainingCenter from '../AITrainingCenter'
import UploadedDocuments from '../UploadedDocuments'
import PromptModifySection from './PromptModifySection'
import PromtModifier from './PromtModifier';

const AITrainingPage = () => {
    const { userProfileData } = useGetUserProfile();
    console.log("0000000000000000000000000000000", userProfileData?.role);
    const permission = userProfileData?.role === "president"
    return (
        <div className='flex flex-col gap-15 '>
            <section className=''>
                <AITrainingCenter></AITrainingCenter>
            </section>
            {/* ================================ Prompt Modification =========================== */}
            {
                permission && (

                    <section className='rounded-2xl border border-[#E9E4DB] bg-white/50 p-4 md:p-6 shadow-sm'>
                        <div className='mb-4 flex items-center justify-between'>
                            <h3 className='text-base md:text-lg font-semibold text-gray-900'>Prompt Controls</h3>
                            <span className='text-xs text-gray-500'>Manage template and modifier</span>
                        </div>
                        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                            {
                                permission && <PromptModifySection></PromptModifySection>
                            }
                            {
                                permission && <PromtModifier></PromtModifier>
                            }
                        </div>
                    </section>
                )
            }

            {/*=============================== Uploaded Document 2nd part ===============================*/}
            <section>
                <UploadedDocuments></UploadedDocuments>
            </section>

        </div>
    )
}

export default AITrainingPage