import React, { useState, useEffect } from 'react'
import { FiEye, FiPause, FiPlay, FiClock, FiCheckCircle, FiTrash2 } from 'react-icons/fi'
import { PiGraduationCapLight } from 'react-icons/pi'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import axiosApi from '../../../service/axiosInstance'
import { toast } from 'react-toastify'
import { queryClient } from '../../../main'
import Swal from 'sweetalert2'

const GeneratedAssesmentsAndHistories = () => {
    const [loading, setLoading] = useState(true)
    const [ongoingAssessments, setOngoingAssessments] = useState([])
    const [assessmentHistory, setAssessmentHistory] = useState([])
    const [showAllOngoing, setShowAllOngoing] = useState(false)
    const [showAllHistory, setShowAllHistory] = useState(false)
    const navigate = useNavigate();

    // .............Fetch assessments history from API......................
    const { data: assessmentsData, isLoading: isLoadingAssessments, error: assessmentsError } = useQuery({
        queryKey: ['assessments'],
        queryFn: async () => {
            const response = await axiosApi.get('/api/v1/assessments/')
            return response.data
        }
    })
    console.log('[GeneratedAssesmentsAndHistories] whole response:', assessmentsData);
    console.log('[GeneratedAssesmentsAndHistories] API Response:', assessmentsData?.data.completed?.results);
    console.log('[GeneratedAssesmentsAndHistories] API Ongoing:', assessmentsData?.data.ongoing?.results);


    useEffect(() => {
        // Set data from API
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

    // ....................Update assessment status mutation.....................\\    
    const updateStatusMutation = useMutation({
        mutationFn: async ({ assessmentId, status }) => {
            const response = await axiosApi.patch(`/api/v1/assessments/${assessmentId}/status/`, {
                status: status
            })
            return response.data
        },
        onSuccess: (data, variables) => {
            console.log('[GeneratedAssesmentsAndHistories] Status updated successfully:', data)
            console.log('[GeneratedAssesmentsAndHistories] Assessment ID:', variables.assessmentId)
            console.log('[GeneratedAssesmentsAndHistories] New Status:', variables.status)

            // Update the assessment in the list
            setOngoingAssessments(prev => prev.map(assessment =>
                assessment.id === variables.assessmentId
                    ? { ...assessment, status: variables.status }
                    : assessment
            ))

            const statusText = variables.status === 'active' ? 'started' : 'paused'
            toast.success(`Assessment ${statusText} successfully!`)
            queryClient.invalidateQueries(['assessments'])
        },
        onError: (error) => {
            console.error('[GeneratedAssesmentsAndHistories] Error updating status:', error?.response?.data?.message)
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to update assessment status."
            );
        }
    })

    const handleViewDetails = (assessmentId) => {
        console.log('[GeneratedAssesmentsAndHistories] View Details:', assessmentId)
        // TODO: Navigate to details page or open modal
        navigate(`created/${assessmentId}`)

    }

    const handlePauseAssessment = (assessmentId) => {
        console.log('[GeneratedAssesmentsAndHistories] Pause Assessment:', assessmentId)
        updateStatusMutation.mutate({ assessmentId, status: 'paused' })
    }

    const handleStartAssessment = (assessmentId) => {
        console.log('[GeneratedAssesmentsAndHistories] Start Assessment:', assessmentId)
        updateStatusMutation.mutate({ assessmentId, status: 'active' })
    }

    const handleAssesmentClick = (assessmentId) => {
        console.log('[GeneratedAssesmentsAndHistories] Assessment clicked:', assessmentId)
        navigate(`/admin/assessments/history/${assessmentId}`);
    }

    // ====================================================Delete assessment mutation==================================================== //
    const deleteAssessmentMutation = useMutation({
        mutationFn: async (assessmentId) => {
            const response = await axiosApi.delete(`/api/v1/assessments/${assessmentId}/delete/`)
            console.log('[GeneratedAssesmentsAndHistories] Delete response:', response.data)
            return response.data
        },
        onSuccess: (data) => {
            console.log('[GeneratedAssesmentsAndHistories] Assessment deleted successfully:', data)
            toast.success('Assessment deleted successfully!')
            queryClient.invalidateQueries({ queryKey: ['assessments'] })
            Swal.fire({
                title: "Deleted!",
                text: "Assessment has been deleted successfully.",
                icon: "success"
            })
        },
        onError: (error) => {
            console.error('[GeneratedAssesmentsAndHistories] Error deleting assessment:', error)
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to delete assessment."
            )
            Swal.fire({
                title: "Error!",
                text: error?.response?.data?.message || "Failed to delete assessment.",
                icon: "error"
            })
        }
    })

    const handleDeleteAssessment = (assessmentId) => {
        console.log('Delete assessment:', assessmentId)
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        }).then((result) => {
            if (result.isConfirmed) {
                deleteAssessmentMutation.mutate(assessmentId)
            }
        })
    }

    if (loading) {
        return (
            <div className="">
                <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-8" />
                <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
        )
    }

    return (
        <div className=" space-y-8 mt-5">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Generated Assessments</h1>
            </div>

            {/* ..........................Ongoing Assessments............................. */}
            <div className=" max-h-[calc(100dvh-50px)] overflow-y-auto bg-primarytransparent rounded-2xl shadow-md border border-bg-primay p-6 md:p-8">
                <div className="flex items-start gap-3 mb-6">
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                        <PiGraduationCapLight className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-1">Ongoing Assessments</h2>
                        <p className="text-gray-500">Current active assessments</p>
                    </div>
                </div>

                {/* .....................Ongoing Assessments List................... */}
                <div className="space-y-4">
                    {ongoingAssessments.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No ongoing assessments available</p>
                    ) : (
                        (showAllOngoing ? ongoingAssessments : ongoingAssessments.slice(0, 2)).map((assessment) => {
                            const progressPercentage = assessment.total_members > 0
                                ? (assessment.completed_members / assessment.total_members) * 100
                                : 0

                            return (
                                <div
                                    key={assessment.id}
                                    className="flex flex-col gap-4 p-5 border border-gray-200 rounded-xl hover:shadow-md transition"
                                >
                                    {/* Top section */}
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-gray-900 text-lg">
                                                    {assessment.title}
                                                </h3>
                                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full capitalize">
                                                    {assessment.role.replace('_', ' ')}
                                                </span>
                                                <span className="flex items-center gap-1 px-3 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full border border-teal-200 capitalize">
                                                    <FiCheckCircle className="w-3 h-3" />
                                                    {assessment.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <FiClock className="w-4 h-4 text-amber-600" />
                                                <span className="text-sm font-medium text-amber-600">
                                                    Due: {assessment.due_date}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* .................Progress Section................. */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium text-gray-700">Progress</span>
                                            <span className="text-sm font-medium text-gray-600">
                                                {assessment.completed_members} of {assessment.total_members} members completed
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="bg-primary h-full rounded-full transition-all duration-500"
                                                style={{ width: `${progressPercentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* .................Action Buttons................. */}
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={() => handleViewDetails(assessment.id)}
                                            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-bg-primary text-teal-600 rounded-lg hover:bg-teal-50 transition font-medium text-sm"
                                        >
                                            <FiEye className="w-4 h-4" />
                                            View Details
                                        </button>
                                        <button
                                            onClick={() => handlePauseAssessment(assessment.id)}
                                            disabled={updateStatusMutation.isPending || assessment.status === "draft"}
                                            className={`flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium text-sm ${assessment.status == "draft" || assessment.status === "paused" ? 'opacity-50 cursor-not-allowed' : ''} ${updateStatusMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <FiPause className="w-4 h-4" />
                                            {updateStatusMutation.isPending ? 'Pausing...' : 'Pause Assessment'}
                                        </button>
                                        <button
                                            onClick={() => handleStartAssessment(assessment.id)}
                                            disabled={updateStatusMutation.isPending || assessment.status === "draft"}
                                            className={`flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary transition font-medium text-sm  ${assessment.status === "draft" || assessment.status === "active" ? 'opacity-50 cursor-not-allowed' : ''} ${updateStatusMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <FiPlay className="w-4 h-4" />
                                            {updateStatusMutation.isPending ? 'Starting...' : 'Start Assessment'}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeleteAssessment(assessment.id)
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition font-medium text-sm"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* View All Button */}
                {ongoingAssessments.length > 2 && (
                    <div className="flex justify-end mt-4">
                        <button
                            onClick={() => setShowAllOngoing(!showAllOngoing)}
                            className="px-4 py-2 bg-primary text-white rounded-lg  transition font-medium"
                        >
                            {showAllOngoing ? 'View Less' : `View All (${ongoingAssessments.length})`}
                        </button>
                    </div>
                )}
            </div>

            {/* ............................Assessment History.............................. */}
            <div className="bg-white/50 rounded-2xl shadow-md border border-gray-200 p-6 md:p-8  max-h-[calc(100dvh-50px)] overflow-y-auto">
                <div className="flex items-start gap-3 mb-6">
                    <div className="p-3 bg-teal-50 rounded-lg">
                        <PiGraduationCapLight className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-1">Assessment History</h2>
                        <p className="text-gray-500">Your past assessment results</p>
                    </div>
                </div>

                {/* History List */}
                <div className="space-y-4 ">
                    {assessmentHistory.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No assessment history available</p>
                    ) : (
                        (showAllHistory ? assessmentHistory : assessmentHistory.slice(0, 2)).map((assessment) => (
                            <div
                                key={assessment.id}
                                onClick={() => {
                                    handleAssesmentClick(assessment?.id)
                                }}
                                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 border border-gray-200 rounded-xl hover:shadow-md transition cursor-pointer"
                            >
                                {/* Left section */}
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <h3 className="font-semibold text-gray-900">
                                            {assessment.title}
                                        </h3>
                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full capitalize">
                                            {assessment.role}
                                        </span>
                                        <span className="flex items-center gap-1 px-3 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full border border-teal-200 capitalize">
                                            <FiCheckCircle className="w-3 h-3" />
                                            {assessment.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="text-amber-600 font-medium">
                                            Due: {assessment.due_date}
                                        </span>
                                        <span className="text-teal-600 font-medium">
                                            {assessment.completed_members}/{assessment.total_members} member completed
                                        </span>
                                    </div>
                                </div>

                                {/* Right section - Score */}
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-3xl md:text-4xl font-bold text-bg-primary">
                                            {assessment.average_score}%
                                        </div>
                                        <div className="text-xs text-gray-500 font-medium">
                                            Average Score
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteAssessment(assessment.id)
                                        }}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                        title="Delete Assessment"
                                    >
                                        <FiTrash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {/* ............View more/less Button............... */}
                {assessmentHistory.length > 2 && (
                    <div className="flex justify-end mt-2">
                        <button
                            onClick={() => setShowAllHistory(!showAllHistory)}
                            className="px-4 py-2 bg-primary text-white rounded-lg  transition font-medium"
                        >
                            {showAllHistory ? 'View Less' : `View All (${assessmentHistory.length})`}
                        </button>
                    </div>
                )}
            </div>
        </div >
    )
}

export default GeneratedAssesmentsAndHistories