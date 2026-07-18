import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyProfile, getUserProfile, updateMyProfile, uploadAvatar, listDirectory, type UpdateProfileInput } from "../api/profile";
import { useAuth } from "@/features/auth/context/AuthContext";

export function useMyProfile() {
  return useQuery({ queryKey: ["profile", "me"], queryFn: getMyProfile });
}

export function useUserProfile(userId: string) {
  return useQuery({ queryKey: ["profile", userId], queryFn: () => getUserProfile(userId), enabled: !!userId });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  const { updateCurrentUser } = useAuth();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => updateMyProfile(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(["profile", "me"], profile);
      updateCurrentUser({ firstName: profile.firstName, lastName: profile.lastName, avatarUrl: profile.avatarUrl });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const { updateCurrentUser } = useAuth();
  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (profile) => {
      queryClient.setQueryData(["profile", "me"], profile);
      updateCurrentUser({ avatarUrl: profile.avatarUrl });
    },
  });
}

export function useDirectory(params: { search?: string; departmentId?: string; limit?: number; offset?: number }) {
  return useQuery({ queryKey: ["directory", params], queryFn: () => listDirectory(params) });
}
