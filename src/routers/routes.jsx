import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../features/auth/LoginPage";
import ResetPasswordPage from "../features/auth/ResetPasswordPage";
import ForgotPasswordPage from "../features/auth/ForgotPasswordPage";
import AdminDashboard from "../features/AdminDashboard/AdminDashboard";
import NotFoundpage from "../Components/NotFoundpage";
import DashboardContent from "../features/AdminDashboard/DashboardContent/DashboardContent";
import ClinicManagement from "../features/AdminDashboard/ClinicManagement";
import SubjectMatters from "../features/AdminDashboard/SubjectMatters";
import Settings from "../features/AdminDashboard/Settings";
import ProfilePersonalInformationForm from "../features/AdminDashboard/ProfilePersonalInformationForm";
import Notifications from "../features/AdminDashboard/Notification/Notifications";
import Security from "../features/AdminDashboard/Security";
import AITrainingPage from "../features/AdminDashboard/AiTraining/AITrainingPage";
import UserManagement from "../features/AdminDashboard/UserManagement";
import UserProfileFromAdmin from "../features/AdminDashboard/UserProfileFromAdmin";
import Assesments from "../features/AdminDashboard/assesments/Assesments";
import ReviewAssesmentResult from "../features/AdminDashboard/ReviewAssesmentResult";
import CreatedAssesmentDetails from "../features/AdminDashboard/assesments/CreatedAssesmentDetails";
import ViewAllAssesmentHistory from "../features/AdminDashboard/assesments/ViewAllAssesmentHistory";
import ViewAllOngoingAssesments from "../features/AdminDashboard/assesments/ViewAllOngoingAssesments";
import { AssessmentViewAnswers } from "../features/AdminDashboard/assesments/AssessmentViewAnswers";
import GiveAssessmentsAnsware from "../features/AdminDashboard/DashboardContent/GiveAssessmentsAnsware";
import PrivateRoute from "./PrivetRoute";
import { ROLES } from "./roles";
import AssignedClinic from "../features/AdminDashboard/AssignedClinic";
import ClinicwiseChatHistory from "../features/AdminDashboard/ClinicwiseChatHistory/ClinicwiseChatHistory";
import NotificationsToggle from "../features/AdminDashboard/NotificationsToggle";
import Communication from "../features/AdminDashboard/Communication/Communication";
import Charting_AI from "../features/AdminDashboard/Communication/Charting_AI";
import Theme from "../features/AdminDashboard/Theme";
import GivenAssessmentDetailsFromUser from "../features/AdminDashboard/DashboardContent/GivenAssessmentDetailsFromUser";
import RolesTypes from "../features/AdminDashboard/RolesTypes";




export const router = createBrowserRouter([
    {
        path: "/",
        element: <Navigate to="/admin" replace />,
    },
    // Admin Dashboard Route
    {
        path: "/admin",
        element: <AdminDashboard />,
        children: [
            // Define child routes for admin dashboard here
            {
                index: true,
                element: <DashboardContent></DashboardContent>,
            },
            {
                path: "dashboard",
                element: <DashboardContent></DashboardContent>,
            },
            {
                path: "dashboard/given-assessment-details/:id",
                element: <GivenAssessmentDetailsFromUser></GivenAssessmentDetailsFromUser>,
            },
            {
                path: "assessments/give-answers/:assessmentId",
                element: <GiveAssessmentsAnsware></GiveAssessmentsAnsware>,
            },
            {
                path: "communication",
                element: <Communication></Communication>,
            },
            {
                path: "charting-ai",
                element: <Charting_AI></Charting_AI>,
            },
            {
                path: "clinicwise-chat-history",
                element: <ClinicwiseChatHistory></ClinicwiseChatHistory>,
            },
            {
                path: "manage-clinic",
                element: <PrivateRoute roles={[ROLES.OWNER]} ><ClinicManagement></ClinicManagement></PrivateRoute>,
            },
            {
                path: "manage-clinic/roles",
                element: <PrivateRoute roles={[ROLES.OWNER, ROLES.PRESIDENT]} ><RolesTypes></RolesTypes></PrivateRoute>,
            },
            {
                path: "assigned-clinic",
                element: <PrivateRoute roles={[ROLES.DOCTOR, ROLES.MANAGER, ROLES.STAFF, ROLES.JR_STAFF,ROLES.PRESIDENT]} ><AssignedClinic></AssignedClinic></PrivateRoute>,
            },
            {
                path: "subject-matters",
                element: <PrivateRoute roles={[ROLES.OWNER, ROLES.PRESIDENT]}  ><SubjectMatters></SubjectMatters></PrivateRoute>,
            },
            {
                path: "user-management",
                element: <PrivateRoute roles={[ROLES.OWNER, ROLES.PRESIDENT]} permission={"user_management"} ><UserManagement></UserManagement></PrivateRoute>,
            },
            {
                path: "user-management/user/:userId",
                element: <UserProfileFromAdmin></UserProfileFromAdmin>,
            },
            {
                path: "ai-training",
                element: <PrivateRoute roles={[ROLES.OWNER, ROLES.PRESIDENT]} permission={"ai_training"} ><AITrainingPage></AITrainingPage></PrivateRoute>,
            },
            // --------------Assessments Routes Start ------------------- \\
            {
                path: "assessments",
                element: <PrivateRoute roles={[ROLES.OWNER, ROLES.PRESIDENT]} permission={"assessment"} ><Assesments></Assesments></PrivateRoute>,
            },
            {
                path: "assessments/created/:assessmentId",
                element: <CreatedAssesmentDetails></CreatedAssesmentDetails>,
            },
            {
                path: "assessments/history/:assessmentId",
                element: <ReviewAssesmentResult></ReviewAssesmentResult>,
            },
            {
                path: "assessments/history/:assessmentId/view-answers/:participantId",
                element: <AssessmentViewAnswers></AssessmentViewAnswers>,
            },
            {
                path: "assessments/view-all-assessment-ongoing",
                element: <ViewAllOngoingAssesments></ViewAllOngoingAssesments>,
            },
            {
                path: "assessments/view-all-assessment-history",
                element: <ViewAllAssesmentHistory></ViewAllAssesmentHistory>,
            },

            // --------------Assessments Routes End------------------- \\
            {
                path: "settings",
                element: <Settings></Settings>,
                children: [
                    {
                        index: true,
                        // element: <div>profile</div>,
                        element: <Navigate to="profile" replace />,
                    },
                    {
                        path: 'profile',
                        element: <ProfilePersonalInformationForm></ProfilePersonalInformationForm>,
                    },
                    {
                        path: 'notifications',
                        element: <NotificationsToggle></NotificationsToggle>,
                    },
                    {
                        path: 'security',
                        element: <Security></Security>,
                    },
                    {
                        path: 'theme',
                        element: <Theme></Theme>,
                    },
                ]
            },
        ],
    },




    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/reset-password",
        element: <ResetPasswordPage />,
    },
    {
        path: "/forgot-password",
        element: <ForgotPasswordPage />,
    },
    // Not Found Page Route
    {
        path: "*",
        element: <NotFoundpage />,
    },
]);

