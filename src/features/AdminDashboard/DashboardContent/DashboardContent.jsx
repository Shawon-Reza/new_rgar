"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import axiosApi from "../../../service/axiosInstance"
import { FiUsers, FiMessageCircle, FiShield, FiHome, FiSettings } from "react-icons/fi"
import { Outlet, useNavigate } from "react-router-dom"
import useGetUserProfile from "../../../hooks/useGetUserProfile"
import AdminAndPresedentDashboardDetails from "./AdminAndPresedentDashboardDetails"
import DislikeNotifications from "./DislikeNotifications"
import GiveAssessmentsAnsware from "./GiveAssessmentsAnsware"
import GivenAssessmentViewFromUsers from "./GivenAssessmentViewFromUsers"

const DashboardContent = () => {
  // ============ STATE MANAGEMENT ============
  const [recentActivity, setRecentActivity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activityStart, setActivityStart] = useState(0)
  const navigate = useNavigate();

  const { userProfileData } = useGetUserProfile();
  const userRole = userProfileData?.role
  console.log(userProfileData?.role);
  const notDisplayAssessmentSection = userProfileData?.role === "owner" || userProfileData?.role === "president";
  console.log(notDisplayAssessmentSection)

  // ====================================================Fetch dislikes Notifications for president only=====================================================
  const { data: dislikesData, isLoading: dislikesLoading, error: dislikesError } = useQuery({
    queryKey: ['dislikes'],
    queryFn: async () => {
      const res = await axiosApi.get('/api/v1/dislike/')
      console.log('[DashboardContent] /api/v1/dislike/ response:', res.data)
      return res.data
    },
    enabled: userProfileData?.role === "president",
    onSuccess: (data) => {
      console.log('[DashboardContent] Dislikes data loaded successfully:', data)
    },
    onError: (err) => {
      console.error('[DashboardContent] Error fetching dislikes:', err)
    },
    staleTime: 5 * 60 * 1000,
  })

  console.log("Dislikes Data===================================================================================================:", dislikesData?.results)


  // ...................................Fetch my assessments (logs only, UI unchanged)...................................\\
  const { data: myAssessments, isLoading: myAssessmentsLoading, error: myAssessmentsError } = useQuery({
    queryKey: ['my-assessments'],
    queryFn: async () => {
      const res = await axiosApi.get('/api/v1/my-assessments/')
      return res.data
    },
    onSuccess: (data) => {
      console.log('[DashboardContent] /api/v1/my-assessments response:', data)
    },
    onError: (err) => {
      console.error('[DashboardContent] Error fetching my assessments:', err)
    },
    staleTime: 5 * 60 * 1000,
  })
  console.log("Consol*********************:", myAssessments?.data)


  // ...............................................................................................\\

  // =========================================== Fetch Dashboard Contents  ======================================================
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: ['dashboard-content'],
    queryFn: async () => {
      const res = await axiosApi.get('/api/v1/dashboard/')
      console.log('[DashboardContent] /api/v1/dashboard/ response:', res.data)
      return res.data
    },
    onSuccess: (data) => {
      console.log('[DashboardContent] Dashboard data loaded successfully:', data)
    },
    onError: (err) => {
      console.error('[DashboardContent] Error fetching dashboard data:', err)
    },
  })

  console.log("Dashboard Data:", dashboardData?.data?.recent_activity)


  // ====================================================== LIFECYCLE HOOKS =======================================================
  useEffect(() => {
    console.log("[v0] Initializing Dashboard Component")
    console.log("[v0] Setting recent activity from API data...")

    if (dashboardData?.data?.recent_activity && Array.isArray(dashboardData.data.recent_activity)) {
      setRecentActivity(dashboardData.data.recent_activity)
      setActivityStart(0)
      setLoading(false)
      console.log("[v0] Recent Activity Loaded:", dashboardData.data.recent_activity)
    } else {
      setLoading(false)
    }
  }, [dashboardData])

  // ====================================================== EVENT HANDLERS ======================================================
  const handleQuickAction = (actionLabel) => {
    console.log("[v0] Quick Action Triggered:", actionLabel)
    console.log("[v0] Action Details:", { action: actionLabel, timestamp: new Date().toISOString() })
    // Add your action logic here
    // navigate('/admin/users-management');
  }

  const handleScrollMore = () => {
    console.log("[v0] Scroll More clicked - Loading more activities...")
    console.log("[v0] Current activities count:", recentActivity?.length)
    const itemsPerPage = 4
    if (!recentActivity || recentActivity.length === 0) return
    const nextStart = activityStart + itemsPerPage
    if (nextStart < recentActivity.length) {
      setActivityStart(nextStart)
    }
  }

  // ====================================================== HELPER COMPONENTS ==================================================
  const ActivityItem = ({ activity }) => {

    return (
      <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {activity?.actor?.name?.charAt(0) || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{activity?.actor?.name || 'Unknown User'}</p>
          <p className="text-xs text-gray-600">{activity?.title || 'Activity'}</p>
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{activity?.time_ago || 'Recently'}</span>
      </div>
    )
  }

  const QuickActionButton = ({ action }) => {
    const Icon = action.icon
    const handleActionClick = action.onClick || (() => handleQuickAction(action.label))
    return (
      <button
        onClick={handleActionClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white font-semibold transition-colors ${action.color} ${action.hoverColor}`}
      >
        <Icon className="w-5 h-5" />
        {action.label}
      </button>
    )
  }

  // Visible activities (page of 4)
  const itemsPerPage = 4
  const visibleActivities = recentActivity?.slice(activityStart, activityStart + itemsPerPage) || []

  // Quick Action visibility flags
  const hideAssignClinics = userRole === "owner" || userRole === "president"
  const hideManageSet = ["doctor", "manager", "staff", "jr_staff"].includes(userRole)

  // ====================================================== ASSESSMENT CARD COMPONENT ==================================================
  const AssessmentCard = ({ assessment }) => {
    const daysLeft = assessment.end_date
      ? Math.max(0, Math.ceil((new Date(assessment.end_date) - new Date()) / (1000 * 60 * 60 * 24)))
      : 0

    const isOverdue = daysLeft === 0 && new Date(assessment.end_date) < new Date()
    const progressPercentage = assessment.participant_count > 0
      ? Math.round(((assessment.completed_count + assessment.in_progress_count) / assessment.participant_count) * 100)
      : 0

    return (
      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 border border-cyan-200 hover:shadow-lg transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-100 rounded-lg">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{assessment.title}</h3>
              <p className="text-sm text-gray-600">{assessment.participant_count} participants</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isOverdue
            ? "bg-red-100 text-red-700"
            : "bg-yellow-100 text-yellow-700"
            }`}>
            {isOverdue ? "Overdue" : `Due in ${daysLeft}d`}
          </span>
        </div>

        {/* Progress Section */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-semibold text-teal-600">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-teal-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {assessment.completed_count} completed • {assessment.in_progress_count} in progress • {assessment.not_started_count} not started
          </p>
        </div>

        {/* Status & Dates */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-center">
          <div className="bg-white rounded-lg p-2">
            <p className="text-xs text-gray-600">Status</p>
            <p className="text-sm font-semibold text-gray-900 capitalize">{assessment.status}</p>
          </div>
          <div className="bg-white rounded-lg p-2">
            <p className="text-xs text-gray-600">Start</p>
            <p className="text-sm font-semibold text-gray-900">
              {new Date(assessment.start_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </p>
          </div>
          <div className="bg-white rounded-lg p-2">
            <p className="text-xs text-gray-600">End</p>
            <p className="text-sm font-semibold text-gray-900">
              {new Date(assessment.end_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Action Button */}
        {/* assessments/give-answers/:assessmentId */}
        <button
          onClick={() => {
            navigate(`/admin/assessments/give-answers/${assessment.id}`);
          }}
          className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
          <span>▶</span> Start Assessment
        </button>
      </div>
    )
  }

  return (
    <div className="font-sans">
      {/* Header */}
      <div className="border-gray-200 ">
        <div className=" py-2">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Here's an overview of your members activities.</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="">
        {dashboardLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Grid - Only for Owner/President */}
            <AdminAndPresedentDashboardDetails cardData={dashboardData?.data?.cards} />


            {/*===============================================Recent Activity & Quick Actions============================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ...........................................Recent Activity........................................... */}
              <div className="lg:col-span-2 bg-white/50 rounded-lg shadow-lg p-6 flex flex-col h-full">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-2 flex-1">
                  {visibleActivities && visibleActivities.length > 0 ? (
                    visibleActivities.map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-gray-500">
                      No activity found
                    </div>
                  )}
                </div>

                <button
                  onClick={handleScrollMore}
                  className="w-full mt-4 py-2 font-semibold border-2 rounded-lg transition-colors"
                  style={{
                    color: "var(--color-primary)",
                    borderColor: "var(--color-primary)",
                  }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = "rgba(0, 164, 166, 0.05)")}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
                >
                  Scroll More
                </button>
              </div>




              {/*........................................ Quick Actions.......................................... */}
              <div className="bg-white/50 rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <QuickActionButton
                    action={{
                      id: 1,
                      label: "Start Conversation",
                      icon: FiMessageCircle,
                      color: "bg-blue-500",
                      hoverColor: "hover:bg-blue-600",
                      onClick: () => navigate('/admin/communication'),
                    }}
                  />
                  {!hideManageSet && (
                    <>
                      <QuickActionButton
                        action={{
                          id: 2,
                          label: "Train AI Assistant",
                          icon: FiShield,
                          color: "bg-purple-500",
                          hoverColor: "hover:bg-purple-600",
                          onClick: () => navigate('/admin/ai-training'),
                        }}
                      />
                      <QuickActionButton
                        action={{
                          id: 3,
                          label: "Manage Users",
                          icon: FiUsers,
                          color: "bg-green-500",
                          hoverColor: "hover:bg-green-600",
                          onClick: () => navigate('/admin/user-management'),
                        }}
                      />
                      <QuickActionButton
                        action={{
                          id: 4,
                          label: "Manage Clinics",
                          icon: FiHome,
                          color: "bg-teal-500",
                          hoverColor: "hover:bg-teal-600",
                          onClick: () => navigate('/admin/manage-clinic'),
                        }}
                      />
                    </>
                  )}
                  {!hideAssignClinics && (
                    <QuickActionButton
                      action={{
                        id: 5,
                        label: "Assigned Clinics",
                        icon: FiHome,
                        color: "bg-teal-500",
                        hoverColor: "hover:bg-teal-600",
                        onClick: () => navigate('/admin/assigned-clinic'),
                      }}
                    />
                  )}
                  <QuickActionButton
                    action={{
                      id: 6,
                      label: "Settings",
                      icon: FiSettings,
                      color: "bg-teal-500",
                      hoverColor: "hover:bg-teal-600",
                      onClick: () => navigate('/admin/settings/profile'),
                    }}
                  />
                </div>
              </div>
            </div>




            {/* ====================================================Assessments Section======================================================= */}
            <div className={`${notDisplayAssessmentSection ? 'hidden' : ''} bg-white/50 rounded-lg shadow-lg p-6`}>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessments</h2>
              <p className="text-gray-600 mb-6">Give proper answers and improve your knowledge</p>

              {myAssessmentsLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Loading assessments...</p>
                </div>
              ) : myAssessmentsError ? (
                <div className="text-center py-12">
                  <p className="text-red-600">Failed to load assessments</p>
                </div>
              ) : myAssessments?.data && myAssessments.data.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {myAssessments?.data?.map((assessment) => (
                    <AssessmentCard key={assessment.id} assessment={assessment} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/60 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-gray-500 text-lg">No assessments found</p>
                  <p className="text-gray-400 text-sm">Check back later for new assessments</p>
                </div>
              )}
            </div>
            {/* ====================================================Given Assessments Section======================================================= */}
            <div className={`${notDisplayAssessmentSection ? 'hidden' : ''} bg-white/50 rounded-lg shadow-lg p-6`}>


              <GivenAssessmentViewFromUsers></GivenAssessmentViewFromUsers>
            </div>
            {/* ===========================================Like/Dislike Notifications for President===================================== */}

            {/* Dislike Notifications - Only for President */}
            {userRole === "president" && (
              <DislikeNotifications
                dislikes={dislikesData?.results}
                isLoading={dislikesLoading}
              />
            )}




          </div>
        )}
      </div>

    </div>
  )
}

export default DashboardContent
