import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axiosApi from '../../../service/axiosInstance';
import { FiClock, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { queryClient } from '../../../main';

const GiveAssessmentsAnsware = () => {
    const { assessmentId } = useParams();
    const [answers, setAnswers] = useState({});
    const navigate = useNavigate();

    // ..........................................Fetch assessment questions...............................................\\
    const { data, isLoading, error } = useQuery({
        queryKey: ['assessment-questions', assessmentId],
        queryFn: async () => {
            const res = await axiosApi.get(`/api/v1/assessments/${assessmentId}/questions/candidate`);
            return res.data;
        },
        onSuccess: (data) => {
            console.log('[GiveAssessmentsAnsware] API Response:', data);
        },
        onError: (err) => {
            console.error('[GiveAssessmentsAnsware] Error:', err);
        },
        enabled: !!assessmentId,
    });






    // ..........................................Submit assessment mutation...............................................\\
    const submitAssessmentMutation = useMutation({
        mutationFn: async (answersData) => {
            const res = await axiosApi.post(`/api/v1/assessments/${assessmentId}/submit/`, answersData);
            return res.data;
        },
        onSuccess: (data) => {
            console.log('[GiveAssessmentsAnsware] Submit Success:', data);
            toast.success('Assessment submitted successfully!');
            navigate('/admin/dashboard');
            queryClient.invalidateQueries(['assessment-questions', assessmentId]);

        },
        onError: (err) => {
            console.error('[GiveAssessmentsAnsware] Submit Error:', err);
            toast.error('Failed to submit assessment. Please try again.');
        },
    });

    // Initialize answers state when questions are loaded
    useEffect(() => {
        if (data?.data?.questions) {
            const initialAnswers = {};
            data.data.questions.forEach(question => {
                initialAnswers[question.id] = null; // Store option ID instead of text
            });
            setAnswers(initialAnswers);
        }
    }, [data]);

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value // Store option ID
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate all questions are answered
        const unansweredQuestions = Object.values(answers).filter(a => a === null).length;
        if (unansweredQuestions > 0) {
            toast.error(`Please answer all ${unansweredQuestions} unanswered question(s) before submitting.`);
            return;
        }

        const formattedAnswers = {
            answers: Object.entries(answers).map(([question_id, option_id]) => ({
                question_id: parseInt(question_id),
                option_id: option_id // Send selected option ID
            }))
        };

        console.log('[GiveAssessmentsAnsware] Submitting Answers:', formattedAnswers);
        submitAssessmentMutation.mutate(formattedAnswers);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading assessment...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 font-semibold">Failed to load assessment</p>
                    <p className="text-gray-600 mt-2">{error.message}</p>
                </div>
            </div>
        );
    }

    if (!data?.data) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-600">No assessment data found</p>
            </div>
        );
    }

    const { assessment, questions } = data.data;
    console.log('[GiveAssessmentsAnsware] assessment:#########################################', questions);

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Assessment Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{assessment.title}</h1>
                            <p className="text-gray-600 mt-2">Please answer all questions below</p>
                        </div>
                        <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200">
                            <FiClock className="text-yellow-600" />
                            <div>
                                <p className="text-xs text-yellow-700 font-medium">Due Date</p>
                                <p className="text-sm font-semibold text-yellow-900">
                                    {new Date(assessment.end_date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                        <span className="font-semibold">Total Questions: {questions.length}</span>
                    </div>
                </div>

                {/* Questions Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {questions.map((question, index) => (
                        <div key={question.id} className="bg-white rounded-lg shadow-md p-6">
                            {/* Question Header */}
                            <div className="flex items-start gap-4 mb-4">
                                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-lg flex items-center justify-center font-bold">
                                    {question.number}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Question {question.number}
                                    </h3>
                                    <p className="text-gray-700 mt-2 leading-relaxed">
                                        {question.text}
                                    </p>
                                    {question.marks > 0 && (
                                        <p className="text-sm text-gray-500 mt-2">Marks: {question.marks}</p>
                                    )}
                                </div>
                            </div>

                            {/* Multiple Choice Options */}
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Select Your Answer
                                </label>
                                <div className="space-y-2">
                                    {question.options && question.options.map((option) => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => handleAnswerChange(question.id, option.id)}
                                            className={`w-full text-left px-4 py-3 rounded-lg border-2 transition ${answers[question.id] === option.id
                                                    ? 'border-teal-500 bg-teal-50'
                                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${answers[question.id] === option.id
                                                        ? 'border-teal-500 bg-teal-500'
                                                        : 'border-gray-300'
                                                    }`}>
                                                    {answers[question.id] === option.id && (
                                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                                    )}
                                                </div>
                                                <span className="text-gray-700 text-sm">{option.text}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                {answers[question.id] && (
                                    <div className="mt-3 flex items-center gap-1 text-sm text-green-600">
                                        <FiCheckCircle /> Answer selected
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Submit Button */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Answered: <span className="font-semibold text-teal-600">
                                        {Object.values(answers).filter(a => a !== null).length}
                                    </span> / {questions.length}
                                </p>
                            </div>
                            <button
                                type="submit"
                                disabled={submitAssessmentMutation.isPending}
                                className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors flex items-center gap-2 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                <FiCheckCircle />
                                {submitAssessmentMutation.isPending ? 'Submitting...' : 'Submit Assessment'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default GiveAssessmentsAnsware