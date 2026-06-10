import { useQuery } from '@tanstack/react-query';
import axiosApi from '../service/axiosInstance';

const mapGroupPerm = (data = []) => {
  return data.reduce((acc, item) => {
    acc[item.group] = item.perm;
    return acc;
  }, {});
};

export const useUserPermissions = (userId) => {
  return useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: async () => {
      const res = await axiosApi.get(`/api/v1/permissions/users/${userId}/`);
      return res.data;
    },
    enabled: !!userId,
    select: (data) => ({
      raw: data,                // original API response
      groupPerms: mapGroupPerm(data), // { group: perm }
    }),
  });
};

export default useUserPermissions;