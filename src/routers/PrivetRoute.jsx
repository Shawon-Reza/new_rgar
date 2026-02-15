import { useLocation, Navigate } from "react-router-dom";
import useGetUserProfile from "../hooks/useGetUserProfile";
import useUserPermissionsForOwn from "../hooks/useUserPermissionsForOwn";


const AccessGuard = ({ children, roles = [], permission }) => {
  console.log(permission)
  const location = useLocation();
  const { userProfileData, userProfileLoading, userProfileError, accessToken } = useGetUserProfile();
  const userRole = userProfileData?.role;


  // ...............Fetch user permissions...................\\
  const { data: permissionData, isLoading: isLoadingPermission, isError: isErrorPermission } = useUserPermissionsForOwn();

  const userPermissions = permissionData?.enabledPermissions || [];
  const isCheckingPermissions = permission && (isLoadingPermission || !permissionData);

  console.log("Permission:===========", permissionData?.enabledPermissions);
  console.log("Permission:===========", userPermissions);
  // ......................................................\\



  // Loading state
  if (userProfileLoading || isCheckingPermissions) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // Not logged in or error
  if (!accessToken || userProfileError || !userProfileData) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Owner always allowed
  if (userRole === "owner") {
    return children;
  }

  // Role-based check
  if (roles.length && roles.includes(userRole)) {
    return children;
  }


  // Permission-based check
  if (permission && userPermissions.includes(permission)) {
    return children;
  }

  // Access denied
  return <Navigate to="/login" replace />;
};

export default AccessGuard;
