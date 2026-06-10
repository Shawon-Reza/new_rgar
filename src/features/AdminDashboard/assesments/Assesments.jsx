import CreateNewAssesment from './CreateNewAssesment'
import GeneratedAssesmentsAndHistories from './GeneratedAssesmentsAndHistories'

const Assesments = () => {
    return (
        <div className="min-h-screen text-[#172033]">
            <header className="-mx-2 -mt-4 border-b border-[#dfe3ea] bg-white px-6 py-4 sm:-mx-6">
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#2B76F4]">Assessment Center</span>
                <h1 className="mt-1 text-2xl font-semibold tracking-normal text-[#111827] md:text-3xl">Assessments</h1>
            </header>

            <section className="mx-auto grid w-full max-w-6xl gap-6 px-1 py-6 sm:px-0 md:py-8">
                <CreateNewAssesment />
                <GeneratedAssesmentsAndHistories />
            </section>
        </div>
    )
}

export default Assesments
