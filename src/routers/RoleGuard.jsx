import useGetUserProfile from "../hooks/useGetUserProfile";


const RoleGuard = ({ roles = [], children }) => {

    const { userProfileData } = useGetUserProfile();

    if (roles.length && !roles.includes(userProfileData?.role)) return null;

    return children;
};
 
export default RoleGuard;
