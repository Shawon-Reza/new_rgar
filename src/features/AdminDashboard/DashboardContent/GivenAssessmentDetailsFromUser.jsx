import { useQuery } from '@tanstack/react-query';
import React from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import axiosApi from '../../../service/axiosInstance';
import { FiArrowLeft, FiCheckCircle, FiBookOpen } from 'react-icons/fi'

const GivenAssessmentDetailsFromUser = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    console.log(id)

    //=============================================== Fetch Assessment Review ================================================\\
    const { data: reviewData, isLoading: isLoadingReview, error: reviewError } = useQuery({
        queryKey: ['assessmentReview', id],
        queryFn: async () => {
            const response = await axiosApi.get(`/api/v1/candidate/assessments/${id}/review/`)
            return response.data
        },
        enabled: !!id, // Only fetch when an assessment is selected
    })

    console.log('[GivenAssessmentViewFromUsers] Review Data:)))))))))))))))))))))))))))))))))))))))))))))))))))))))', reviewData?.data)

    const responseData = reviewData?.data;
    const assessment = responseData?.assessment;
    const summary = responseData?.summary;
    const questions = responseData?.questions || [];

    const handleBack = () => {
        navigate(-1);
    };

    if (isLoadingReview) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-12 w-96 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (reviewError || !responseData) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600 text-lg font-medium">Error loading review</p>
                <button
                    onClick={handleBack}
                    className="mt-4 px-4 py-2 text-teal-600 border-2 border-teal-200 rounded-lg hover:bg-teal-50"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const answeredPercentage = summary?.percentage || 0;

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-4 py-2 text-bg-primary border-2 border-teal-200 rounded-lg hover:bg-teal-50 transition font-medium cursor-pointer"
                style={{ borderColor: "var(--color-primary)", }}
            >
                <FiArrowLeft className="w-4 h-4" />
                Back
            </button>

            {/* Header */}
            <div className="mb-2">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Review</h1>
                <p className="text-gray-600">View your responses and scoring details</p>
            </div>

            {/* Assessment Info Card */}
            <div className="bg-white/50 rounded-2xl shadow-md border border-gray-200 p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <FiBookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Assessment</h3>
                        <p className="text-xl font-bold text-gray-900">{assessment?.title}</p>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                {assessment?.role}
                            </span>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${assessment?.status === 'closed'
                                    ? 'bg-gray-100 text-gray-600'
                                    : 'bg-green-100 text-green-600'
                                }`}>
                                {assessment?.status}
                            </span>
                            {assessment?.end_date && (
                                <span className="text-sm text-gray-600">
                                    End: {new Date(assessment.end_date).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Section */}
            <div className="bg-white/50 rounded-2xl shadow-md border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Your Score</h3>
                    <span className="text-2xl font-bold text-emerald-600">{answeredPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                        className="bg-primary h-3 rounded-full transition-all duration-300"
                        style={{ width: `${answeredPercentage}%` }}
                    />
                </div>
                <p className="text-sm text-gray-600 mt-3">
                    {summary?.answered || 0} out of {summary?.total_questions || 0} questions answered
                </p>
            </div>

            {/* Answers List */}
            <div className="bg-white/50 rounded-2xl shadow-md border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">Question Answers</h3>
                </div>

                <div className="divide-y divide-gray-200">
                    {questions.map((question, index) => {
                        const isAnswered = question.selected_option_id !== null;

                        return (
                            <div key={question.question_id} className="p-6 hover:bg-gray-50 transition">
                                {/* Question Header */}
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary flex-shrink-0">
                                        <span className="text-sm font-bold text-white">{question.number}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-base font-semibold text-gray-900">{question.question}</h4>
                                        <div className="flex items-center gap-2 mt-2">
                                            {isAnswered ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                                                    <FiCheckCircle className="w-3 h-3" />
                                                    Answered
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                                    Not Answered
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Answer Content - Multiple Choice Options */}
                                <div className="ml-11">
                                    <div className="space-y-2">
                                        {question.options && question.options.map((option) => {
                                            const isUserSelected = question.selected_option_id === option.id;
                                            const isCorrectAnswer = question.correct_option_id === option.id;
                                            const isWrong = isUserSelected && !option.is_correct;

                                            return (
                                                <div
                                                    key={option.id}
                                                    className={`p-3 rounded-lg border-2 transition ${isCorrectAnswer
                                                            ? 'border-green-500 bg-green-50'
                                                            : isWrong
                                                                ? 'border-red-500 bg-red-50'
                                                                : isUserSelected
                                                                    ? 'border-teal-500 bg-teal-50'
                                                                    : 'border-gray-200 bg-gray-50'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isCorrectAnswer
                                                                ? 'border-green-500 bg-green-500'
                                                                : isWrong
                                                                    ? 'border-red-500 bg-red-500'
                                                                    : isUserSelected
                                                                        ? 'border-teal-500 bg-teal-500'
                                                                        : 'border-gray-300'
                                                            }`}>
                                                            {(isUserSelected || isCorrectAnswer) && (
                                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                                            )}
                                                        </div>
                                                        <span className={`text-sm flex-1 ${isCorrectAnswer
                                                                ? 'font-semibold text-green-700'
                                                                : isWrong
                                                                    ? 'font-semibold text-red-700'
                                                                    : isUserSelected
                                                                        ? 'font-semibold text-teal-700'
                                                                        : 'text-gray-700'
                                                            }`}>
                                                            {option.text}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            {isCorrectAnswer && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                                                    <FiCheckCircle className="w-3 h-3" />
                                                                    Correct Answer
                                                                </span>
                                                            )}
                                                            {isWrong && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                                                                    ✕ Your Answer
                                                                </span>
                                                            )}
                                                            {isUserSelected && !isWrong && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded">
                                                                    <FiCheckCircle className="w-3 h-3" />
                                                                    Your Answer
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Summary Footer */}
            <div className="bg-primary rounded-2xl border border-teal-200 p-6">
                <div className="grid grid-cols-3 gap-6 text-center text-white">
                    <div>
                        <p className="text-2xl font-bold text-white">{summary?.answered || 0}</p>
                        <p className="text-xs text-white uppercase tracking-wider mt-1">Questions Answered</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{summary?.total_questions || 0}</p>
                        <p className="text-xs text-white uppercase tracking-wider mt-1">Total Questions</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{summary?.percentage || 0}%</p>
                        <p className="text-xs text-white uppercase tracking-wider mt-1">Total Score</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default GivenAssessmentDetailsFromUser