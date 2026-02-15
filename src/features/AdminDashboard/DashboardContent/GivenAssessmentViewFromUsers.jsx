
import axiosApi from '../../../service/axiosInstance'
import { useQuery } from '@tanstack/react-query'
import { FiCalendar, FiCheckCircle, FiAward, FiEye } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom';


const GivenAssessmentViewFromUsers = () => {
    const navigate = useNavigate();

    //=============================================== Fetch Given assessments List ================================================\\
    const { data: assessmentsData, isLoading, error } = useQuery({
        queryKey: ['candidateAssessments'],
        queryFn: async () => {
            const response = await axiosApi.get('/api/v1/candidate/assessments/')
            console.log('[GivenAssessmentViewFromUsers] API Response:', response.data)
            return response.data
        },
    })

    console.log('[GivenAssessmentViewFromUsers] Assessments Data:((((((((((((((((((((((((((((((((((((((((', assessmentsData?.data?.completed?.results)


    if (isLoading) {
        return (
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Given Assessments</h2>
                <p className="text-gray-600 mb-6">Your answers and scores</p>
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Given Assessments</h2>
                <p className="text-gray-600 mb-6">Your answers and scores</p>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p>Error loading assessments: {error.message}</p>
                </div>
            </div>
        )
    }
    const completedAssessments = assessmentsData?.data?.completed?.results || []


                                   
    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Given Assessments</h2>
            <p className="text-gray-600 mb-6">Your answers and scores</p>

            {/* Assessments List */}
            {completedAssessments.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                    <p className="text-gray-500">No completed assessments found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {completedAssessments.map((assessment) => (
                        <div
                            key={assessment.id}
                            className="bg-white/60 rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                {/* Left Section - Title and Role */}
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                                        {assessment.title}
                                    </h3>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                            {assessment.role}
                                        </span>
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${assessment.user_status === 'completed'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            <FiCheckCircle className="inline mr-1" />
                                            {assessment.user_status}
                                        </span>
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${assessment.assessment_status === 'closed'
                                            ? 'bg-gray-100 text-gray-600'
                                            : 'bg-green-100 text-green-600'
                                            }`}>
                                            {assessment.assessment_status}
                                        </span>
                                    </div>
                                </div>

                                {/* Middle Section - Score */}
                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1">Score</p>
                                        <div className="flex items-end gap-1">
                                            <span className="text-2xl font-bold text-gray-900">
                                                {assessment.score}
                                            </span>
                                            <span className="text-sm text-gray-500 mb-1">
                                                / {assessment.max_score}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Percentage with Progress Bar */}
                                    <div className="w-32">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-gray-500">Percentage</span>
                                            <span className="text-sm font-bold text-primary">
                                                {assessment.percentage}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full transition-all"
                                                style={{ width: `${assessment.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Section - Dates */}
                                <div className="space-y-1 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <FiCalendar size={14} />
                                        <span className="font-medium">Submitted:</span>
                                        <span>{new Date(assessment.submitted_at).toLocaleDateString()}</span>
                                    </div>
                                    {assessment.end_date && (
                                        <div className="flex items-center gap-2">
                                            <FiCalendar size={14} />
                                            <span className="font-medium">End Date:</span>
                                            <span>{new Date(assessment.end_date).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                                {/* dashboard/given-assessment-details/:id */}
                                {/* View Review Button */}
                                <div>
                                    <button
                                        onClick={() => navigate(`/admin/dashboard/given-assessment-details/${assessment?.id}`)}
                                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-teal-700 transition font-medium text-sm flex items-center gap-2"
                                    >
                                        <FiEye size={16} />
                                        View Review
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default GivenAssessmentViewFromUsers