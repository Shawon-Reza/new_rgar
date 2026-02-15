"use client"

import { useEffect, useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { FiUser, FiMail, FiPhone, FiEdit2, FiX } from "react-icons/fi"
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
    onSuccess: (data) => {
      console.log("[ProfileUpdate] Mutation successful:", data)
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
    setFormData({
      ...formData,
      [name]: value,
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

    console.log("[ProfileUpdate] Sending payload:", Object.fromEntries(payload))

    try {
      setIsLoading(true)
      await updateProfileMutation.mutateAsync(payload)
      console.log("[ProfileUpdate] Changes saved successfully")
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
      <div className=" ">
        <div className=" mx-auto border-2 rounded-xl" style={{ borderColor: "var(--color-primary)" }}>
          {/* Header */}
          <div className="px-6 md:px-8 py-6 border-b-2 border-gray-300" >
            <h1 className="text-xl md:text-2xl font-bold text-secondary">Personal Information</h1>
          </div>

          {/* Profile Section */}
          <div className="px-6 md:px-8 py-8 flex flex-col items-center">
            {/* Avatar */}
            <div className="relative mb-4">
              <div
                className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 cursor-pointer"
                style={{ borderColor: "var(--color-primary)" }}
                onClick={openPreview}
              >
                <img
                  src={userProfile.avatar || "/placeholder.svg"}
                  alt={userProfile.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                aria-label="Edit profile picture"
                onClick={openFilePicker}
                className="cursor-pointer absolute bottom-3 right-3 -mb-2 -mr-2 bg-primary text-white p-2 rounded-full shadow-md hover:opacity-90 transition"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <FiEdit2 size={16} />
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

            {/* Name */}
            <h2 className="text-xl md:text-2xl font-bold text-primary mt-4">{userProfile.name}</h2>

            {/* Role Badge */}
            <div className="mt-3 px-6 py-2 rounded-lg" style={{ backgroundColor: "#FFB6D9" }}>
              <span className="text-sm font-semibold text-secondary">{userProfile.role}</span>
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSaveChanges} className="px-6 md:px-8 py-8">
            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: "#D4EDDA", color: "#155724" }}>
                <p className="text-sm font-medium">{successMessage}</p>
              </div>
            )}

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* First Name */}
              <div>
                <label className="flex items-center text-sm font-medium text-secondary mb-2">
                  <FiUser className="mr-2" size={16} />
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition"
                  style={{ focusRingColor: "var(--color-primary)" }}
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="flex items-center text-sm font-medium text-secondary mb-2">
                  <FiUser className="mr-2" size={16} />
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter last name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition"
                  style={{ focusRingColor: "var(--color-primary)" }}
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="flex items-center text-sm font-medium text-secondary mb-2">
                  <FiMail className="mr-2" size={16} />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition"
                  style={{ focusRingColor: "var(--color-primary)" }}
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="flex items-center text-sm font-medium text-secondary mb-2">
                  <FiPhone className="mr-2" size={16} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition"
                  style={{ focusRingColor: "var(--color-primary)" }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border-2 border-red-500 text-red-500 rounded-lg font-medium hover:bg-red-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 rounded-lg font-medium text-white transition disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
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
