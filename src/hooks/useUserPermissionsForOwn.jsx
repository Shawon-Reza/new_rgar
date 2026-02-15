import { useQuery } from "@tanstack/react-query";
import axiosApi from "../service/axiosInstance";
import useGetUserProfile from "./useGetUserProfile";


const mapGroupPerm = (data = []) =>
    data.reduce((acc, item) => {
        acc[item.group] = item.perm;
        return acc;
    }, {});

const getEnabledPermissions = (data = []) =>
    data.filter(item => item.perm === true).map(item => item.group);

export const useUserPermissionsForOwn = () => {
    const { userProfileData } = useGetUserProfile();
    const userId = userProfileData?.id;

    return useQuery({
        queryKey: ['user-permissions', userId],
        enabled: !!userId,
        queryFn: async () => {
            const res = await axiosApi.get(
                `/api/v1/permissions/users/${userId}/`
            );
            return res.data;
        },
        select: (data = []) => ({
            raw: data,
            groupPerms: mapGroupPerm(data),
            enabledPermissions: getEnabledPermissions(data),
        }),
    });
};

export default useUserPermissionsForOwn;
