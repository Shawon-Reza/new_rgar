import { FiThumbsDown, FiMessageCircle, FiUser, FiClock, FiChevronDown, FiChevronUp } from "react-icons/fi"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import ReactMarkdown from 'react-markdown'
// import remarkGfm from 'remark-gfm';


const DislikeNotifications = ({ dislikes, isLoading }) => {
    const [expandedItems, setExpandedItems] = useState({})
    const navigate = useNavigate()

    const toggleExpand = (id) => {
        setExpandedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }))
    }

    const handleNotificationClick = (id) => {
        // navigate to AI Training Center and pass the dislike id in location.state
        navigate('/admin/ai-training', { state: { fromDislikeId: id, fromNotification: true } })
    }
    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">AI Feedback Notifications</h2>
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading notifications...</p>
                </div>
            </div>
        )
    }


    if (!dislikes || dislikes.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">AI Feedback Notifications</h2>
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <FiThumbsDown className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No dislike notifications</p>
                    <p className="text-gray-400 text-sm">All AI responses are performing well!</p>
                </div>
            </div>
        )
    }

    const formatTimeAgo = (timestamp) => {
        const now = new Date()
        const created = new Date(timestamp)
        const diffMs = now - created
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return "Just now"
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return created.toLocaleDateString()
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">AI Feedback Notifications</h2>
                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                    {dislikes.length} Dislike{dislikes.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {dislikes.map((dislike) => (
                    <div
                        key={dislike.id}
                        onClick={() => handleNotificationClick(dislike.id)}
                        className="border border-red-200 rounded-lg p-4 bg-red-50 hover:shadow-md transition-shadow cursor-pointer"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {dislike.created_by?.first_name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {dislike.created_by?.full_name || 'Unknown User'}
                                    </p>
                                    <p className="text-xs text-gray-600 capitalize">
                                        {dislike.created_by?.role || 'user'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 text-xs">
                                <FiClock className="w-3 h-3" />
                                {formatTimeAgo(dislike.created_at)}
                            </div>
                        </div>

                        {/*========================================= Message Content ===============================================*/}
                        <div className="bg-white rounded-lg p-3 mb-2 border border-red-100">
                            <div className="flex items-start gap-2">
                                <FiThumbsDown className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <div
                                        className={`text-xs text-gray-700 leading-relaxed overflow-hidden transition-all duration-300 ${expandedItems[dislike.id] ? 'max-h-none' : 'max-h-20'
                                            }`}
                                    >
                                        <ReactMarkdown>
                                            {dislike.message?.content || 'No content available'}
                                        </ReactMarkdown>
                                    </div>

                                    {/* Expand/Collapse Button */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleExpand(dislike.id) }}
                                        className="flex items-center gap-1 mt-2 text-xs text-red-600 hover:text-red-700 font-semibold transition-colors"
                                    >
                                        {expandedItems[dislike.id] ? (
                                            <>
                                                <FiChevronUp className="w-3 h-3" />
                                                <span>Show less</span>
                                            </>
                                        ) : (
                                            <>
                                                <FiChevronDown className="w-3 h-3" />
                                                <span>Show full content</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>




                        {/*======================================== Footer Meta ========================================== */}
                        {/* <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                                <FiMessageCircle className="w-3 h-3" />
                                <span>Room #{dislike.room_id}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <FiUser className="w-3 h-3" />
                                <span>Message #{dislike.message?.id}</span>
                            </div>
                            {dislike.clinic_id && (
                                <div className="flex items-center gap-1">
                                    <span>Clinic #{dislike.clinic_id}</span>
                                </div>
                            )}
                        </div> */}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default DislikeNotifications
