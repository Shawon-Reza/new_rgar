import { useEffect, useState } from 'react'
import { FiCalendar, FiCheckCircle, FiChevronRight, FiClock, FiEye, FiPause, FiPlay, FiTrash2, FiUsers } from 'react-icons/fi'
import { PiGraduationCapLight } from 'react-icons/pi'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import axiosApi from '../../../service/axiosInstance'
import { toast } from 'react-toastify'
import { queryClient } from '../../../main'
import Swal from 'sweetalert2'

const formatRole = (role) => String(role || 'Role').replace(/_/g, ' ')

const progressValue = (completed, total) => {
    if (!total || total <= 0) return 0
    return Math.min(100, Math.max(0, (completed / total) * 100))
}

const statusClass = (status) => {
    const normalized = String(status || '').toLowerCase()
    if (normalized === 'active') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    if (normalized === 'paused') return 'border-amber-200 bg-amber-50 text-amber-700'
    if (normalized === 'completed') return 'border-blue-200 bg-blue-50 text-blue-700'
    return 'border-slate-200 bg-slate-50 text-slate-600'
}

const actionButtonClass = 'inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-45'

const SectionHeader = ({ title, description, count, iconTone = 'blue', action }) => (
    <div className="flex flex-col gap-3 border-b border-[#edf1f7] px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:gap-4 md:px-6 md:py-5">
        <div className="flex items-center gap-2.5 md:gap-3">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-2xl md:h-11 md:w-11 ${iconTone === 'green' ? 'bg-emerald-50 text-emerald-600' : 'bg-[#eef4ff] text-[#2B76F4]'}`}>
                <PiGraduationCapLight className="h-5 w-5 md:h-6 md:w-6" />
            </span>
            <div>
                <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold leading-6 text-[#111827] md:text-xl">{title}</h2>
                    <span className="rounded-full border border-[#dce5f4] bg-[#f8fafc] px-2.5 py-0.5 text-xs font-semibold text-[#6b7890] md:py-1">
                        {count}
                    </span>
                </div>
                <p className="mt-1 text-xs font-medium leading-5 text-[#6b7890] md:text-sm md:leading-6">{description}</p>
            </div>
        </div>
        {action}
    </div>
)

const EmptyState = ({ title, description }) => (
    <div className="grid place-items-center px-5 py-12 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f3f6fb] text-[#8b98ad]">
            <PiGraduationCapLight className="h-6 w-6" />
        </span>
        <h3 className="mt-4 text-base font-semibold text-[#172033]">{title}</h3>
        <p className="mt-1 max-w-sm text-sm font-medium leading-6 text-[#6b7890]">{description}</p>
    </div>
)

const GeneratedAssesmentsAndHistories = () => {
    const [loading, setLoading] = useState(true)
    const [ongoingAssessments, setOngoingAssessments] = useState([])
    const [assessmentHistory, setAssessmentHistory] = useState([])
    const [showAllOngoing, setShowAllOngoing] = useState(false)
    const [showAllHistory, setShowAllHistory] = useState(false)
    const navigate = useNavigate()

    const { data: assessmentsData, isLoading: isLoadingAssessments, error: assessmentsError } = useQuery({
        queryKey: ['assessments'],
        queryFn: async () => {
            const response = await axiosApi.get('/api/v1/assessments/')
            return response.data
        }
    })

    useEffect(() => {
        if (Array.isArray(assessmentsData?.data?.ongoing?.results)) {
            setOngoingAssessments(assessmentsData.data.ongoing.results)
        } else {
            setOngoingAssessments([])
        }
        if (Array.isArray(assessmentsData?.data?.completed?.results)) {
            setAssessmentHistory(assessmentsData.data.completed.results)
        } else {
            setAssessmentHistory([])
        }
        setLoading(isLoadingAssessments)
    }, [assessmentsData, isLoadingAssessments])

    const updateStatusMutation = useMutation({
        mutationFn: async ({ assessmentId, status }) => {
            const response = await axiosApi.patch(`/api/v1/assessments/${assessmentId}/status/`, {
                status: status
            })
            return response.data
        },
        onSuccess: (_, variables) => {
            setOngoingAssessments(prev => prev.map(assessment =>
                assessment.id === variables.assessmentId
                    ? { ...assessment, status: variables.status }
                    : assessment
            ))

            const statusText = variables.status === 'active' ? 'started' : 'paused'
            toast.success(`Assessment ${statusText} successfully.`)
            queryClient.invalidateQueries({ queryKey: ['assessments'] })
        },
        onError: (error) => {
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                'Failed to update assessment status.'
            )
        }
    })

    const deleteAssessmentMutation = useMutation({
        mutationFn: async (assessmentId) => {
            const response = await axiosApi.delete(`/api/v1/assessments/${assessmentId}/delete/`)
            return response.data
        },
        onSuccess: () => {
            toast.success('Assessment deleted successfully.')
            queryClient.invalidateQueries({ queryKey: ['assessments'] })
            Swal.fire({
                title: 'Deleted',
                text: 'Assessment has been deleted successfully.',
                icon: 'success'
            })
        },
        onError: (error) => {
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                'Failed to delete assessment.'
            )
            Swal.fire({
                title: 'Error',
                text: error?.response?.data?.message || 'Failed to delete assessment.',
                icon: 'error'
            })
        }
    })

    const handleViewDetails = (assessmentId) => {
        navigate(`created/${assessmentId}`)
    }

    const handlePauseAssessment = (assessmentId) => {
        updateStatusMutation.mutate({ assessmentId, status: 'paused' })
    }

    const handleStartAssessment = (assessmentId) => {
        updateStatusMutation.mutate({ assessmentId, status: 'active' })
    }

    const handleAssesmentClick = (assessmentId) => {
        navigate(`/admin/assessments/history/${assessmentId}`)
    }

    const handleDeleteAssessment = (assessmentId) => {
        Swal.fire({
            title: 'Delete assessment?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#2B76F4',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Delete'
        }).then((result) => {
            if (result.isConfirmed) {
                deleteAssessmentMutation.mutate(assessmentId)
            }
        })
    }

    if (loading) {
        return (
            <div className="grid gap-6">
                {[0, 1].map((item) => (
                    <section key={item} className="overflow-hidden rounded-2xl border border-[#dfe5ee] bg-white shadow-[0_20px_55px_rgba(15,23,42,0.06)]">
                        <div className="border-b border-[#edf1f7] px-6 py-5">
                            <div className="h-5 w-48 animate-pulse rounded bg-[#e8edf5]" />
                            <div className="mt-3 h-4 w-72 animate-pulse rounded bg-[#f0f3f8]" />
                        </div>
                        <div className="grid gap-4 p-6">
                            <div className="h-20 animate-pulse rounded-xl bg-[#f3f6fb]" />
                            <div className="h-20 animate-pulse rounded-xl bg-[#f3f6fb]" />
                        </div>
                    </section>
                ))}
            </div>
        )
    }

    if (assessmentsError) {
        return (
            <section className="rounded-2xl border border-red-100 bg-white px-6 py-8 text-center shadow-[0_20px_55px_rgba(15,23,42,0.06)]">
                <h2 className="text-lg font-semibold text-[#111827]">Assessments could not be loaded</h2>
                <p className="mt-2 text-sm font-medium text-[#6b7890]">
                    {assessmentsError?.response?.data?.message || assessmentsError?.message || 'Please try again later.'}
                </p>
            </section>
        )
    }

    const visibleOngoing = showAllOngoing ? ongoingAssessments : ongoingAssessments.slice(0, 3)
    const visibleHistory = showAllHistory ? assessmentHistory : assessmentHistory.slice(0, 3)

    return (
        <div className="grid gap-6">
            <section className="overflow-hidden rounded-2xl border border-[#dfe5ee] bg-white shadow-[0_20px_55px_rgba(15,23,42,0.06)]">
                <SectionHeader
                    title="Ongoing Assessments"
                    description="Monitor current assessments and control availability."
                    count={ongoingAssessments.length}
                    action={ongoingAssessments.length > 3 && (
                        <button
                            onClick={() => setShowAllOngoing(!showAllOngoing)}
                            className="h-9 rounded-lg border border-[#d9e1ec] bg-white px-3 text-xs font-semibold text-[#41506a] transition hover:border-[#2B76F4] hover:text-[#2B76F4]"
                        >
                            {showAllOngoing ? 'View Less' : `View All (${ongoingAssessments.length})`}
                        </button>
                    )}
                />

                {ongoingAssessments.length === 0 ? (
                    <EmptyState
                        title="No ongoing assessments"
                        description="Generated assessments will appear here when they are active, paused, or in draft."
                    />
                ) : (
                    <div>
                        {visibleOngoing.map((assessment) => {
                            const progressPercentage = progressValue(assessment.completed_members, assessment.total_members)
                            const isDraft = assessment.status === 'draft'
                            const isPaused = assessment.status === 'paused'
                            const isActive = assessment.status === 'active'

                            return (
                                <article key={assessment.id} className="border-t border-[#edf1f7] px-5 py-5 transition first:border-t-0 hover:bg-[#f8fafc] md:px-6">
                                    <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-base font-semibold text-[#111827]">{assessment.title}</h3>
                                                <span className="rounded-full border border-[#dce5f4] bg-white px-2.5 py-1 text-xs font-semibold capitalize text-[#41506a]">
                                                    {formatRole(assessment.role)}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(assessment.status)}`}>
                                                    <FiCheckCircle className="h-3.5 w-3.5" />
                                                    {assessment.status || 'Status'}
                                                </span>
                                            </div>

                                            <div className="mt-3 flex flex-wrap gap-4 text-sm font-medium text-[#6b7890]">
                                                <span className="inline-flex items-center gap-2">
                                                    <FiCalendar className="h-4 w-4 text-[#97a4b8]" />
                                                    Due {assessment.due_date || 'Not set'}
                                                </span>
                                                <span className="inline-flex items-center gap-2">
                                                    <FiUsers className="h-4 w-4 text-[#97a4b8]" />
                                                    {assessment.completed_members || 0}/{assessment.total_members || 0} completed
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 lg:justify-end">
                                            <button
                                                onClick={() => handleViewDetails(assessment.id)}
                                                className={`${actionButtonClass} border border-[#d9e1ec] bg-white text-[#41506a] hover:border-[#2B76F4] hover:text-[#2B76F4]`}
                                            >
                                                <FiEye className="h-4 w-4" />
                                                Details
                                            </button>
                                            <button
                                                onClick={() => handlePauseAssessment(assessment.id)}
                                                disabled={updateStatusMutation.isPending || isDraft || isPaused}
                                                className={`${actionButtonClass} bg-[#fff3f2] text-[#d92d20] hover:bg-[#fee4e2]`}
                                            >
                                                <FiPause className="h-4 w-4" />
                                                Pause
                                            </button>
                                            <button
                                                onClick={() => handleStartAssessment(assessment.id)}
                                                disabled={updateStatusMutation.isPending || isDraft || isActive}
                                                className={`${actionButtonClass} bg-[#2B76F4] text-white shadow-[0_10px_20px_rgba(43,118,244,0.18)] hover:bg-[#1f68e8]`}
                                            >
                                                <FiPlay className="h-4 w-4" />
                                                Start
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteAssessment(assessment.id)
                                                }}
                                                className={`${actionButtonClass} border border-red-100 bg-white text-red-600 hover:bg-red-50`}
                                            >
                                                <FiTrash2 className="h-4 w-4" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-5">
                                        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.12em] text-[#77849a]">
                                            <span>Progress</span>
                                            <span>{Math.round(progressPercentage)}%</span>
                                        </div>
                                        <div className="h-2.5 overflow-hidden rounded-full bg-[#e8edf5]">
                                            <div
                                                className="h-full rounded-full bg-[#2B76F4] transition-all duration-500"
                                                style={{ width: `${progressPercentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                )}
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#dfe5ee] bg-white shadow-[0_20px_55px_rgba(15,23,42,0.06)]">
                <SectionHeader
                    title="Assessment History"
                    description="Review completed assessments and average performance."
                    count={assessmentHistory.length}
                    iconTone="green"
                    action={assessmentHistory.length > 3 && (
                        <button
                            onClick={() => setShowAllHistory(!showAllHistory)}
                            className="h-9 rounded-lg border border-[#d9e1ec] bg-white px-3 text-xs font-semibold text-[#41506a] transition hover:border-[#2B76F4] hover:text-[#2B76F4]"
                        >
                            {showAllHistory ? 'View Less' : `View All (${assessmentHistory.length})`}
                        </button>
                    )}
                />

                {assessmentHistory.length === 0 ? (
                    <EmptyState
                        title="No completed assessments"
                        description="Completed assessment results and score summaries will be listed here."
                    />
                ) : (
                    <div>
                        {visibleHistory.map((assessment) => (
                            <article
                                key={assessment.id}
                                onClick={() => handleAssesmentClick(assessment?.id)}
                                className="group grid cursor-pointer gap-3 border-t border-[#edf1f7] px-4 py-4 transition first:border-t-0 hover:bg-[#f8fafc] md:grid-cols-[1fr_auto] md:items-center md:gap-4 md:px-6 md:py-5"
                            >
                                <div>
                                    <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                                        <h3 className="text-sm font-semibold leading-5 text-[#111827] md:text-base">{assessment.title}</h3>
                                        <span className="rounded-full border border-[#dce5f4] bg-white px-2 py-0.5 text-[11px] font-semibold capitalize text-[#41506a] md:px-2.5 md:py-1 md:text-xs">
                                            {formatRole(assessment.role)}
                                        </span>
                                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize md:px-2.5 md:py-1 md:text-xs ${statusClass(assessment.status)}`}>
                                            <FiCheckCircle className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                            {assessment.status || 'Completed'}
                                        </span>
                                    </div>

                                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 text-xs font-medium text-[#6b7890] md:mt-3 md:gap-4 md:text-sm">
                                        <span className="inline-flex items-center gap-1.5 md:gap-2">
                                            <FiClock className="h-3.5 w-3.5 text-[#97a4b8] md:h-4 md:w-4" />
                                            Due {assessment.due_date || 'Not set'}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 md:gap-2">
                                            <FiUsers className="h-3.5 w-3.5 text-[#97a4b8] md:h-4 md:w-4" />
                                            {assessment.completed_members || 0}/{assessment.total_members || 0} completed
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-3 md:gap-4 md:justify-end">
                                    <div className="text-left md:text-right">
                                        <div className="text-2xl font-semibold leading-7 text-[#111827] md:text-3xl md:leading-9">{assessment.average_score ?? 0}%</div>
                                        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#77849a] md:text-xs">Average</div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteAssessment(assessment.id)
                                        }}
                                        className="grid h-9 w-9 place-items-center rounded-xl border border-red-100 bg-white text-red-600 transition hover:bg-red-50 md:h-10 md:w-10"
                                        title="Delete assessment"
                                    >
                                        <FiTrash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                    </button>
                                    <FiChevronRight className="hidden h-5 w-5 text-[#97a4b8] transition group-hover:translate-x-1 group-hover:text-[#2B76F4] md:block" />
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

export default GeneratedAssesmentsAndHistories
