"use client"

import { useEffect, useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { FiCamera, FiCheckCircle, FiMail, FiPhone, FiRefreshCcw, FiSave, FiShield, FiUser, FiX } from "react-icons/fi"
import useGetUserProfile from "../../hooks/useGetUserProfile"
import { base_URL } from "../../config/Config"
import axiosApi from "../../service/axiosInstance"

const buildAvatarUrl = (picturePath) => {
  if (!picturePath) return ""
  const normalizedBase = (base_URL || "").replace(/\/$/, "")
  const normalizedPath = `${picturePath}`.replace(/^\//, "")
  return `${normalizedBase}/${normalizedPath}`
}

const ProfilePersonalInformationForm = () => {
  // State management for form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    avatar: "",
    avatarFile: null,
  })

  // Original data to track changes
  const [originalData, setOriginalData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    avatar: "",
    avatarFile: null,
  })

  //..........**User profile data from custom hook**.............\\
  const { userProfileData, userProfileLoading } = useGetUserProfile();

  // State for user profile
  const [userProfile, setUserProfile] = useState({
    name: "",
    role: "",
    avatar: "",
  })

  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const fileInputRef = useRef(null)

  // State for form submission
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const updateProfileMutation = useMutation({
    mutationFn: async (payload) => {
      if (!userProfileData?.id) {
        throw new Error("Missing user id for profile update")
      }
      return axiosApi.patch(`/api/v1/users/${userProfileData.id}/Infoupdate/`, payload)
    },
    onError: (error) => {
      console.error("[ProfileUpdate] Mutation error:", error)
    }
  })

  useEffect(() => {
    if (userProfileData) {
      const avatarUrl = buildAvatarUrl(userProfileData.picture)
      const initialFormData = {
        firstName: userProfileData.first_name || "",
        lastName: userProfileData.last_name || "",
        email: userProfileData.email || "",
        phoneNumber: userProfileData.phone || "",
        avatar: avatarUrl,
        avatarFile: null,
      }
      setFormData(initialFormData)
      setOriginalData({ ...initialFormData })

      setUserProfile({
        name: userProfileData.full_name || "",
        role: userProfileData.role || "",
        avatar: avatarUrl,
      })
    }
  }, [userProfileData])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    let nextValue = value

    if (name === 'phoneNumber') {
      nextValue = value.replace(/[^\d+\-() ]/g, '').slice(0, 20)
    }

    if (name === 'firstName' || name === 'lastName') {
      nextValue = value.slice(0, 20)
    }

    setFormData({
      ...formData,
      [name]: nextValue,
    })
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setFormData((prev) => ({
      ...prev,
      avatar: previewUrl,
      avatarFile: file,
    }))
    setUserProfile((prev) => ({
      ...prev,
      avatar: previewUrl,
    }))
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const openPreview = () => {
    if (!userProfile.avatar) return
    setIsPreviewOpen(true)
  }

  const closePreview = () => setIsPreviewOpen(false)

  const handleSaveChanges = async (e) => {
    e.preventDefault()

    const payload = new FormData()
    payload.append("first_name", formData.firstName || "")
    payload.append("last_name", formData.lastName || "")
    payload.append("email", formData.email || "")
    payload.append("phone", formData.phoneNumber || "")
    if (formData.avatarFile) {
      payload.append("picture", formData.avatarFile)
    }



    try {
      setIsLoading(true)
      await updateProfileMutation.mutateAsync(payload)

      setSuccessMessage("Changes saved successfully!")
      setOriginalData({ ...formData })
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error) {
      console.error("[ProfileUpdate] Error:", error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({ ...originalData })
    setUserProfile((prev) => ({ ...prev, avatar: originalData.avatar }))
    setSuccessMessage("")
  }

  const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(" ") || userProfile.name || "User"
  const profileInitial = fullName.charAt(0).toUpperCase()
  const roleLabel = userProfile.role ? userProfile.role.replace(/_/g, " ") : "Team member"
  const hasChanges =
    formData.firstName !== originalData.firstName ||
    formData.lastName !== originalData.lastName ||
    formData.phoneNumber !== originalData.phoneNumber ||
    Boolean(formData.avatarFile)

  // Show loading state while fetching profile
  if (userProfileLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-lg border border-[#22324d] bg-[#172640] text-white shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
          <div className="border-b border-white/10 px-6 py-5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b9d2ff]">
              <FiShield size={14} />
              Profile Card
            </div>
          </div>

          <div className="flex flex-col items-center px-6 py-8 text-center">
            <div className="relative">
              <button
                type="button"
                onClick={openPreview}
                disabled={!userProfile.avatar}
                className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 text-3xl font-semibold text-white shadow-[0_18px_36px_rgba(0,0,0,0.24)] disabled:cursor-default"
                aria-label="Preview profile picture"
              >
                {userProfile.avatar ? (
                  <img
                    src={userProfile.avatar}
                    alt={fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{profileInitial}</span>
                )}
              </button>
              <button
                type="button"
                aria-label="Change profile picture"
                onClick={openFilePicker}
                className="absolute bottom-1 right-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-[#2B76F4] text-white shadow-lg transition-colors hover:bg-[#1f68e8]"
              >
                <FiCamera size={16} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                name="avatar"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <h2 className="mt-5 max-w-full truncate text-2xl font-semibold tracking-normal">{fullName}</h2>
            <span className="mt-3 rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium capitalize text-[#d7e5ff]">
              {roleLabel}
            </span>

            <div className="mt-8 grid w-full gap-3 text-left text-sm">
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#8fa3c5]">Email</p>
                <p className="mt-1 truncate font-semibold text-white">{formData.email || "Not set"}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#8fa3c5]">Phone</p>
                <p className="mt-1 truncate font-semibold text-white">{formData.phoneNumber || "Not set"}</p>
              </div>
            </div>
          </div>
        </aside>

        <form
          onSubmit={handleSaveChanges}
          className="rounded-lg border border-[#dfe6f0] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.07)]"
        >
          <div className="flex flex-col gap-3 border-b border-[#edf1f6] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-normal text-[#111827]">Personal Information</h2>
              <p className="mt-1 text-sm font-medium text-[#6b778c]">Keep your contact details current.</p>
            </div>
            {successMessage && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                <FiCheckCircle size={16} />
                {successMessage}
              </div>
            )}
          </div>

          <div className="grid gap-5 px-6 py-6 md:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6b778c]">
                <FiUser size={15} />
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                maxLength={20}
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter first name"
                className="h-12 w-full rounded-lg border border-[#d9e1ec] bg-white px-4 text-sm font-medium text-[#172033] outline-none transition focus:border-[#2B76F4] focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6b778c]">
                <FiUser size={15} />
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                maxLength={20}
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Enter last name"
                className="h-12 w-full rounded-lg border border-[#d9e1ec] bg-white px-4 text-sm font-medium text-[#172033] outline-none transition focus:border-[#2B76F4] focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6b778c]">
                <FiMail size={15} />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                maxLength={40}
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
                disabled
                className="h-12 w-full cursor-not-allowed rounded-lg border border-[#d9e1ec] bg-[#f7f9fc] px-4 text-sm font-medium text-[#657188] outline-none"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6b778c]">
                <FiPhone size={15} />
                Phone Number
              </label>
              <input
                type="tel"
                inputMode="numeric"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                className="h-12 w-full rounded-lg border border-[#d9e1ec] bg-white px-4 text-sm font-medium text-[#172033] outline-none transition focus:border-[#2B76F4] focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-[#edf1f6] px-6 py-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCancel}
              disabled={!hasChanges || isLoading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#d9e1ec] bg-white px-5 text-sm font-semibold text-[#526174] transition-colors hover:bg-[#f7f9fc] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRefreshCcw size={15} />
              Reset
            </button>
            <button
              type="submit"
              disabled={isLoading || !hasChanges}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#2B76F4] px-5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(43,118,244,0.24)] transition-colors hover:bg-[#1f68e8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiSave size={15} />
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {isPreviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-80"
          onClick={closePreview}
        >
          <div className="relative max-w-3xl w-full px-4" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              aria-label="Close preview"
              onClick={closePreview}
              className="absolute -top-10 right-0 text-white hover:text-gray-200 cursor-pointer"
            >
              <FiX size={28} />
            </button>
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="w-full max-h-[80vh] object-contain rounded-lg shadow-lg"
            />
          </div>
        </div>
      )}
    </>
  )
}

export default ProfilePersonalInformationForm
