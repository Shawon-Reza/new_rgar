import { useQuery } from '@tanstack/react-query'
import axiosApi from '../../service/axiosInstance'
import { FaFax } from 'react-icons/fa'
import { FiExternalLink, FiGlobe, FiMapPin, FiPhone, FiRefreshCw, FiUser } from 'react-icons/fi'
import { BiClinic } from 'react-icons/bi'
import { TbCategory2 } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'
import useGetUserProfile from '../../hooks/useGetUserProfile'

const valueOrDash = (value) => value || 'N/A'

const normalizeWebsite = (website) => {
    if (!website) return ''
    return website.startsWith('http://') || website.startsWith('https://')
        ? website
        : `https://${website}`
}

const InfoItem = ({ icon: Icon, label, value, children }) => (
    <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f3f6fb] text-[#6b7890]">
            <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[#8b98ad]">{label}</p>
            {children || <p className="mt-1 line-clamp-2 text-sm font-medium leading-5 text-[#172033]">{valueOrDash(value)}</p>}
        </div>
    </div>
)

const ClinicCard = ({ clinic }) => {
    const website = normalizeWebsite(clinic.website)

    return (
        <article className="overflow-hidden rounded-lg border border-[#dfe5ee] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_55px_rgba(15,23,42,0.09)]">
            <div className="border-b border-[#edf1f7] px-5 py-5">
                <div className="flex items-start gap-3">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#eef4ff] text-[#2B76F4]">
                        <BiClinic className="h-6 w-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-lg font-semibold leading-6 text-[#111827]">{clinic.name}</h3>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full border border-[#dce5f4] bg-[#f8fafc] px-2.5 py-1 text-xs font-semibold text-[#41506a]">
                                {valueOrDash(clinic.clinic_type_name)}
                            </span>
                            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                {clinic.active_members || 0} members
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-5 px-5 py-5">
                <InfoItem icon={FiMapPin} label="Address" value={clinic.address} />

                <div className="grid gap-5 sm:grid-cols-2">
                    <InfoItem icon={FiPhone} label="Phone" value={clinic.phone} />
                    <InfoItem icon={FaFax} label="Fax" value={clinic.fax} />
                </div>

                <InfoItem icon={FiGlobe} label="Website">
                    {website ? (
                        <a
                            href={website}
                            className="mt-1 inline-flex max-w-full items-center gap-2 text-sm font-semibold text-[#2B76F4] transition hover:text-[#1f68e8]"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <span className="truncate">{clinic.website}</span>
                            <FiExternalLink className="h-3.5 w-3.5 shrink-0" />
                        </a>
                    ) : (
                        <p className="mt-1 text-sm font-medium text-[#172033]">N/A</p>
                    )}
                </InfoItem>
            </div>
        </article>
    )
}

const AssignedClinic = () => {
    const navigate = useNavigate()
    const { userProfileData } = useGetUserProfile()

    const { data: clinics = [], isLoading: loading, error, refetch, isFetching } = useQuery({
        queryKey: ['clinics-assigned'],
        queryFn: async () => {
            const response = await axiosApi.get('/api/v1/clinics/')
            return Array.isArray(response.data) ? response.data : response.data?.results || response.data?.data || []
        },
    })

    return (
        <div className="min-h-screen text-[#172033]">
            <header className="-mx-2 -mt-4 border-b border-[#dfe3ea] bg-white px-6 py-4 sm:-mx-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#2B76F4]">Clinic Directory</span>
                        <h1 className="mt-1 text-2xl font-semibold tracking-normal text-[#111827] md:text-3xl">Assigned Clinics</h1>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => refetch()}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#d9e1ec] bg-white px-4 text-sm font-semibold text-[#41506a] transition hover:border-[#2B76F4] hover:text-[#2B76F4] disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isFetching}
                        >
                            <FiRefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        {userProfileData?.role === 'owner' && (
                            <button
                                onClick={() => navigate('/admin/manage-clinic/roles')}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#2B76F4] px-4 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(43,118,244,0.22)] transition hover:bg-[#1f68e8]"
                            >
                                <TbCategory2 className="h-5 w-5" />
                                Roles
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <section className="mx-auto grid w-full max-w-6xl gap-6 px-1 py-6 sm:px-0 md:py-8">
                <div className="rounded-lg border border-[#dfe5ee] bg-white px-5 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] md:px-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#eef4ff] text-[#2B76F4]">
                                <FiMapPin className="h-5 w-5" />
                            </span>
                            <div>
                                <h2 className="text-xl font-semibold text-[#111827]">Clinic Access</h2>
                                <p className="mt-1 text-sm font-medium text-[#6b7890]">
                                    {clinics.length ? `${clinics.length} clinic${clinics.length === 1 ? '' : 's'} assigned to your account.` : 'View assigned clinic details.'}
                                </p>
                            </div>
                        </div>

                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#dce5f4] bg-[#f8fafc] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#6b7890]">
                            <FiUser className="h-3.5 w-3.5" />
                            {valueOrDash(userProfileData?.role)}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {[0, 1, 2].map((item) => (
                            <div key={item} className="rounded-lg border border-[#dfe5ee] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                                <div className="flex gap-3">
                                    <div className="h-12 w-12 animate-pulse rounded-lg bg-[#e8edf5]" />
                                    <div className="flex-1">
                                        <div className="h-5 w-40 animate-pulse rounded bg-[#e8edf5]" />
                                        <div className="mt-3 h-4 w-28 animate-pulse rounded bg-[#f0f3f8]" />
                                    </div>
                                </div>
                                <div className="mt-6 grid gap-4">
                                    <div className="h-10 animate-pulse rounded bg-[#f3f6fb]" />
                                    <div className="h-10 animate-pulse rounded bg-[#f3f6fb]" />
                                    <div className="h-10 animate-pulse rounded bg-[#f3f6fb]" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <section className="rounded-lg border border-red-100 bg-white px-6 py-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                        <h2 className="text-lg font-semibold text-[#111827]">Clinics could not be loaded</h2>
                        <p className="mt-2 text-sm font-medium text-[#6b7890]">
                            {error?.response?.data?.message || error?.message || 'Please try again later.'}
                        </p>
                    </section>
                ) : clinics.length === 0 ? (
                    <section className="rounded-lg border border-[#dfe5ee] bg-white px-6 py-14 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
                        <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-[#f3f6fb] text-[#8b98ad]">
                            <BiClinic className="h-6 w-6" />
                        </span>
                        <h2 className="mt-4 text-lg font-semibold text-[#111827]">No assigned clinics</h2>
                        <p className="mx-auto mt-2 max-w-sm text-sm font-medium leading-6 text-[#6b7890]">
                            Assigned clinics will appear here when your account receives clinic access.
                        </p>
                    </section>
                ) : (
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {clinics.map((clinic) => (
                            <ClinicCard key={clinic.id} clinic={clinic} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

export default AssignedClinic
