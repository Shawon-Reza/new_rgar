import { HiOutlineSparkles } from 'react-icons/hi2'
import useGetUserProfile from '../../../hooks/useGetUserProfile'
import AITrainingCenter from '../AITrainingCenter'
import UploadedDocuments from '../UploadedDocuments'
import AIModelSettings from './AIModelSettings'
import PromptModifySection from './PromptModifySection'
import PromtModifier from './PromtModifier'

const AITrainingPage = () => {
    const { userProfileData } = useGetUserProfile()
    const canManagePrompts = userProfileData?.role === 'president'
    const canManageAIModels = ['owner', 'admin'].includes(userProfileData?.role)

    return (
        <div className="min-h-screen text-[#172033]">
            <header className="-mx-2 -mt-4 border-b border-[#dfe3ea] bg-white px-6 py-4 sm:-mx-6">
                <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#eef4ff] text-[#2B76F4]">
                        <HiOutlineSparkles className="h-6 w-6" />
                    </span>
                    <div>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#2B76F4]">AI Training</span>
                        <h1 className="mt-1 text-2xl font-semibold tracking-normal text-[#111827] md:text-3xl">Training Center</h1>
                    </div>
                </div>
            </header>

            <section className="mx-auto grid w-full max-w-6xl gap-6 px-1 py-6 sm:px-0 md:py-8">
                <AITrainingCenter />

                {canManageAIModels && <AIModelSettings />}

                {canManagePrompts && (
                    <section className="overflow-hidden rounded-lg border border-[#dfe5ee] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                        <div className="border-b border-[#edf1f7] px-5 py-5 md:px-6">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2B76F4]">Prompt Controls</p>
                            <h2 className="mt-1 text-xl font-semibold text-[#111827]">Behavior Templates</h2>
                            <p className="mt-1 text-sm font-medium text-[#6b7890]">
                                Manage the global assistant prompt and Chartly modifier behavior.
                            </p>
                        </div>
                        <div className="grid gap-5 bg-[#f8fafc] p-5 lg:grid-cols-2 md:p-6">
                            <PromptModifySection />
                            <PromtModifier />
                        </div>
                    </section>
                )}

                <UploadedDocuments />
            </section>
        </div>
    )
}

export default AITrainingPage
