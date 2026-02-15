import React, { useState, useEffect } from 'react'
import { FiArrowLeft, FiPlus, FiCalendar, FiSave } from 'react-icons/fi'
import { TiDelete } from 'react-icons/ti'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, QueryClient } from '@tanstack/react-query'
import axiosApi from '../../../service/axiosInstance'
import { toast } from 'react-toastify';
import { queryClient } from '../../../main'

const CreatedAssesmentDetails = () => {
    const [loading, setLoading] = useState(true)
    const [questions, setQuestions] = useState([])
    const navigate = useNavigate();
    const { assessmentId } = useParams();
    const [showOngoingNotice, setShowOngoingNotice] = useState(false)
    const [showAddQuestionModal, setShowAddQuestionModal] = useState(false)
    const [newQuestionText, setNewQuestionText] = useState('')
    const [newQuestionOptions, setNewQuestionOptions] = useState(['', '', '', ''])
    const [correctAnswerIndex, setCorrectAnswerIndex] = useState(null)
    const [showDeadlineModal, setShowDeadlineModal] = useState(false)
    const [deadlineDate, setDeadlineDate] = useState('')
    const [selectedAnswers, setSelectedAnswers] = useState({})


    console.log("ID from Assesment Destails", assessmentId)

    // .....................................Fetch assessment questions from API..........................................\\
    const { data: questionsData, isLoading: isLoadingQuestions, error: questionsError } = useQuery({
        queryKey: ['assessmentQuestions', assessmentId],
        queryFn: async () => {
            const response = await axiosApi.get(`/api/v1/assessments/${assessmentId}/questions`)
            console.log("Call Api from Details...............................")
            return response.data
        },
        enabled: !!assessmentId
    })
    console.log('[CreatedAssesmentDetails] API Response:', questionsData)
    console.log('[CreatedAssesmentDetails] API Response For Question:', questionsData?.data?.questions)
    console.log('[CreatedAssesmentDetails] API Response:', questionsData?.data?.assessment.status)

    // .......................................Update assessment status mutation.................................\\
    const updateStatusMutation = useMutation({
        mutationFn: async () => {
            const response = await axiosApi.patch(`/api/v1/assessments/${assessmentId}/status/`, {
                "status": "active"
            })
            return response.data
        },
        onSuccess: (data) => {
            console.log('[CreatedAssesmentDetails] Status updated successfully:', data)
            setShowOngoingNotice(true)
            queryClient.invalidateQueries(['assessmentQuestions', assessmentId])
            toast.success('Assessment status updated to active!')
            // TODO: Show success toast/notification
            // TODO: Navigate back or refresh data
            navigate(-1);
        },
        onError: (error) => {
            console.error('[CreatedAssesmentDetails] Error updating status:', error)
            // TODO: Show error toast/notification
        }
    })

    // ..........................................Delete question mutation.........................................\\
    const deleteQuestionMutation = useMutation({
        mutationFn: async (questionId) => {
            const response = await axiosApi.delete(`/api/v1/assessments/questions-del/${questionId}/`)
            return response.data
        },
        onSuccess: (data, questionId) => {
            console.log('[CreatedAssesmentDetails] Question deleted successfully:', data)
            setQuestions(prev => prev.filter(q => q.id !== questionId))
        },
        onError: (error) => {
            console.error('-------------------------- ', error?.response.data.message)
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to delete question."
            );

        }
    })

    // ....................................Set deadline mutation......................................\\    
    const setDeadlineMutation = useMutation({
        mutationFn: async (endDate) => {
            const response = await axiosApi.patch(`/api/v1/assessments/${assessmentId}/end-date/`, {
                end_date: endDate
            })
            return response.data
        },
        onSuccess: (data) => {
            console.log('[CreatedAssesmentDetails] Deadline set successfully:', data)
            console.log('[CreatedAssesmentDetails] Deadline date:', deadlineDate)

            // Reset modal state
            setShowDeadlineModal(false)
            setDeadlineDate('')
            toast.success('Deadline set successfully!')
            queryClient.invalidateQueries(['assessmentQuestions', assessmentId])
        },
        onError: (error) => {
            console.error('[CreatedAssesmentDetails] Error setting deadline:', error?.response?.data?.message)
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to set deadline."
            );
        }
    })

    // ...........................................Add question mutation............................................\\
    const addQuestionMutation = useMutation({
        mutationFn: async ({ questionText, options, correctIndex }) => {
            const response = await axiosApi.post(`/api/v1/assessments/${assessmentId}/questions-add/`, {
                text: questionText,
                options: options.map(opt => ({ text: opt })),
                correct_index: correctIndex
            })
            return response.data
        },
        onSuccess: (data) => {
            console.log('[CreatedAssesmentDetails] Question added successfully:', data)

            // Add the new question to the list
            if (data?.data) {
                const newQuestion = {
                    id: data.data.id,
                    number: data.data.number,
                    text: data.data.text,
                    question_text: data.data.question_text,
                    marks: data.data.marks || 0,
                    options: data.data.options || [],
                    liked: false,
                    disliked: false
                }
                setQuestions(prev => [...prev, newQuestion])
                // Update selected answers
                setSelectedAnswers(prev => ({ ...prev, [data.data.id]: null }))
            }

            // Reset modal state
            setShowAddQuestionModal(false)
            setNewQuestionText('')
            setNewQuestionOptions(['', '', '', ''])
            setCorrectAnswerIndex(null)
            toast.success('Question added successfully!')
        },
        onError: (error) => {
            console.error('[CreatedAssesmentDetails] Error adding question:', error?.response?.data?.message)
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to add question."
            );
        }
    })

    useEffect(() => {
        // Set questions from API data
        if (questionsData?.data?.questions) {
            const formattedQuestions = questionsData.data.questions.map(q => ({
                id: q.id,
                number: q.number,
                text: q.text,
                question_text: q.question_text,
                marks: q.marks,
                options: q.options || [],
                liked: false,
                disliked: false
            }))
            setQuestions(formattedQuestions)
            // Initialize selected answers object
            const initialAnswers = {}
            formattedQuestions.forEach(q => {
                initialAnswers[q.id] = null
            })
            setSelectedAnswers(initialAnswers)
        }
        // Show ongoing notice if assessment status is active
        if (questionsData?.data?.assessment?.status === 'active') {
            setShowOngoingNotice(true)
        }
        setLoading(isLoadingQuestions)
    }, [questionsData, isLoadingQuestions])

    const handleBack = () => {
        console.log('[CreatedAssesmentDetails] Back clicked')
        // TODO: Navigate back using router
        navigate(-1);
    }

    const handleLike = (questionId) => {
        setQuestions(prev => prev.map(q => {
            if (q.id === questionId) {
                return { ...q, liked: !q.liked, disliked: false }
            }
            return q
        }))
        console.log('[CreatedAssesmentDetails] Question liked:', questionId)
    }

    const handleDislike = (questionId) => {
        setQuestions(prev => prev.map(q => {
            if (q.id === questionId) {
                return { ...q, disliked: !q.disliked, liked: false }
            }
            return q
        }))
        console.log('[CreatedAssesmentDetails] Question disliked:', questionId)
    }

    const handleDeleteQuestion = (questionId) => {
        console.log("Delete Question ID:", questionId)
        deleteQuestionMutation.mutate(questionId)
    }

    const handleQuestionChange = (questionId, newText) => {
        setQuestions(prev => prev.map(q =>
            q.id === questionId ? { ...q, text: newText } : q
        ))
    }

    const handleAddQuestion = () => {
        console.log('[CreatedAssesmentDetails] Add Question clicked')
        setShowAddQuestionModal(true)
    }

    const handleSaveNewQuestion = () => {
        if (!newQuestionText.trim()) {
            toast.error('Please enter a question text')
            return
        }
        // Check if all options are filled
        if (newQuestionOptions.some(opt => !opt.trim())) {
            toast.error('Please fill in all four options')
            return
        }
        // Check if correct answer is selected
        if (correctAnswerIndex === null) {
            toast.error('Please select the correct answer')
            return
        }
        console.log('[CreatedAssesmentDetails] Saving new question:', newQuestionText)
        addQuestionMutation.mutate({
            questionText: newQuestionText,
            options: newQuestionOptions,
            correctIndex: correctAnswerIndex
        })
    }

    const handleCancelAddQuestion = () => {
        setShowAddQuestionModal(false)
        setNewQuestionText('')
        setNewQuestionOptions(['', '', '', ''])
        setCorrectAnswerIndex(null)
    }

    const handleSetDeadline = () => {
        console.log('[CreatedAssesmentDetails] Set Deadline clicked')
        setShowDeadlineModal(true)
    }

    const handleSaveDeadline = () => {
        if (!deadlineDate) {
            toast.error('Please select a deadline date')
            return
        }
        console.log('[CreatedAssesmentDetails] Saving deadline:', deadlineDate)
        setDeadlineMutation.mutate(deadlineDate)
    }

    const handleCancelDeadline = () => {
        setShowDeadlineModal(false)
        setDeadlineDate('')
    }

    const handleSaveAssessment = () => {
        const payload = {
            questions: questions.map(q => ({
                id: q.id,
                text: q.text,
                liked: q.liked,
                disliked: q.disliked
            }))
        }
        console.log('[CreatedAssesmentDetails] essSave Assment:', payload)
        // Call the status update endpoint
        updateStatusMutation.mutate()
    }

    if (loading) {
        return (
            <div className="p-6 max-w-5xl">
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mb-6" />
                <div className="h-12 w-96 bg-gray-200 rounded animate-pulse mb-8" />
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className=" space-y-6">
            {/* Back Button */}
            <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-4 py-2 text-teal-600 border-2 border-teal-200 rounded-lg hover:bg-teal-50 transition font-medium cursor-pointer"
            >
                <FiArrowLeft className="w-4 h-4" />
                Back
            </button>

            {/* Header */}
            <div className="mb-2">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Assessment Questions</h1>
                <p className="text-gray-600">Monthly tests to track your staff knowledge and progress</p>
            </div>

            {/* Ongoing Notice */}
            {showOngoingNotice ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">
                    Your assignment is ongoing now.
                </div>
            ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg">
                    This assessment is in draft mode. Click "Save Assessment" to make it active.
                </div>
            )}

            {/* Questions List */}
            <div className="space-y-4">
                {questions.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                        <p className="text-center text-gray-500">No questions found for this assessment</p>
                    </div>
                ) : (
                    questions.map((question) => (
                        <div
                            key={question.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
                        >
                            {/* Question Header */}
                            <div className="flex items-start gap-3 mb-4">
                                {/* Question Number Badge */}
                                <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center font-bold text-lg">
                                    {question.number || question.id}
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-gray-800 text-base font-semibold">
                                        {question.text}
                                    </h3>
                                    {question.marks > 0 && (
                                        <p className="text-sm text-gray-500 mt-1">Marks: {question.marks}</p>
                                    )}
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={() => handleDeleteQuestion(question.id)}
                                    disabled={deleteQuestionMutation.isPending}
                                    className="p-2 rounded-lg transition text-gray-400 hover:bg-gray-100 hover:text-red-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                    aria-label="Delete question"
                                >
                                    <TiDelete size={28} color='red' />
                                </button>
                            </div>

                            {/* Multiple Choice Options */}
                            {question.options && question.options.length > 0 && (
                                <div className="ml-13 space-y-2">
                                    {question.options.map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => setSelectedAnswers(prev => ({
                                                ...prev,
                                                [question.id]: option.id
                                            }))}
                                            className={`w-full text-left px-4 py-3 rounded-lg border-2 transition ${
                                                selectedAnswers[question.id] === option.id
                                                    ? 'border-teal-500 bg-teal-50'
                                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                    selectedAnswers[question.id] === option.id
                                                        ? 'border-teal-500 bg-teal-500'
                                                        : 'border-gray-300'
                                                }`}>
                                                    {selectedAnswers[question.id] === option.id && (
                                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                                    )}
                                                </div>
                                                <span className="text-gray-700">{option.text}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                    onClick={handleAddQuestion}
                    className={`flex items-center justify-center gap-2 px-6 py-3 bg-teal-50 text-teal-600 border-2 border-bg-primary rounded-lg hover:bg-teal-100 transition font-semibold ${questionsData?.data.assessment.status === 'active' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <FiPlus className="w-5 h-5" />
                    Add Question
                </button>
                {/* questionsData?.data.assessment.status */}
                <button
                    onClick={handleSetDeadline}
                    className={`flex items-center justify-center gap-2 px-6 py-3 bg-red-400 text-white rounded-lg hover:bg-red-500 transition font-semibold ${questionsData?.data.assessment.status === 'active' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <FiCalendar className="w-5 h-5" />
                    Set Deadline
                </button>
                <button
                    onClick={handleSaveAssessment}
                    className={`flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-teal-700 transition font-semibold ${questionsData?.data.assessment.status === 'active' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <FiSave className="w-5 h-5" />
                    Save Assessment
                </button>
            </div>

            {/* Add Question Modal */}
            {showAddQuestionModal && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New Question</h2>

                        <div className="space-y-6">
                            {/* Question Text */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Question Text
                                </label>
                                <textarea
                                    value={newQuestionText}
                                    onChange={(e) => setNewQuestionText(e.target.value)}
                                    placeholder="Enter your question here..."
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                                />
                            </div>

                            {/* Multiple Choice Options */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Answer Options
                                </label>
                                <div className="space-y-3">
                                    {newQuestionOptions.map((option, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className="w-8 h-8 flex-shrink-0 bg-primary text-white rounded-lg flex items-center justify-center font-semibold text-sm">
                                                {String.fromCharCode(65 + index)}
                                            </div>
                                            <input
                                                type="text"
                                                value={option}
                                                onChange={(e) => {
                                                    const updated = [...newQuestionOptions]
                                                    updated[index] = e.target.value
                                                    setNewQuestionOptions(updated)
                                                }}
                                                placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setCorrectAnswerIndex(index)}
                                                className={`px-3 py-2 rounded-lg font-medium transition ${
                                                    correctAnswerIndex === index
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                            >
                                                {correctAnswerIndex === index ? '✓ Correct' : 'Mark'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end mt-6">
                            <button
                                onClick={handleCancelAddQuestion}
                                disabled={addQuestionMutation.isPending}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveNewQuestion}
                                disabled={addQuestionMutation.isPending}
                                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium disabled:opacity-50"
                            >
                                {addQuestionMutation.isPending ? 'Adding...' : 'Add Question'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Set Deadline Modal */}
            {showDeadlineModal && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Set Assessment Deadline</h2>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Deadline Date
                            </label>
                            <input
                                type="date"
                                value={deadlineDate}
                                onChange={(e) => setDeadlineDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            />
                            <p className="text-sm text-gray-500 mt-2">
                                Select the date by which this assessment should be completed
                            </p>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleCancelDeadline}
                                disabled={setDeadlineMutation.isPending}
                                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveDeadline}
                                disabled={setDeadlineMutation.isPending}
                                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-medium disabled:opacity-50"
                            >
                                {setDeadlineMutation.isPending ? 'Setting...' : 'Set Deadline'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

}

export default CreatedAssesmentDetails