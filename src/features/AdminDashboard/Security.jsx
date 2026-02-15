"use client";

import { useState } from "react";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { useMutation } from "@tanstack/react-query";
import axiosApi from "../../service/axiosInstance";

/** Password Field Component */
const PasswordField = ({ label, name, value, showPassword, onChange, onToggle, error }) => (
  <div className="mb-6">
    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
      <FiLock size={16} />
      {label}
    </label>
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={`Enter ${label.toLowerCase()}`}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
      >
        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
      </button>
    </div>
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

export default function Security() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [errors, setErrors] = useState({});

  const resetPasswordMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await axiosApi.post('/api/v1/users/password/reset/', payload)
      return response.data
    },
    onSuccess: () => {
      alert('Password changed successfully!')
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setErrors({})
    },
    onError: (error) => {
      const message = error?.response?.data?.message || error?.response?.data?.detail || 'Failed to change password. Please try again.'
      setErrors({ submit: message })
      console.log(message)
      console.log(error)
    }
  })

  /** Handle Input Change */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /** Toggle Password Visibility */
  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  /** Validate Form */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword)
      newErrors.currentPassword = "Current password is required";

    if (!formData.newPassword)
      newErrors.newPassword = "New password is required";
    else if (formData.newPassword.length < 8)
      newErrors.newPassword = "Password must be at least 8 characters";

    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password";
    else if (formData.newPassword !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /** Handle Save Changes */
  const handleSaveChanges = async () => {
    // Log all input field data on Save Changes click
    console.log('[Security] Save Changes clicked:', {
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword,
    })

    if (!validateForm()) return;

    resetPasswordMutation.mutate({
      old_password: formData.currentPassword,
      password1: formData.newPassword,
      password2: formData.confirmPassword,
    })
  };

  /** Handle Cancel */
  const handleCancel = () => {
    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setErrors({});
  };

  return (
    <div
      className="p-6 md:p-8 rounded-2xl border"
      style={{ borderColor: "var(--color-primary)" }}
    >
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Security</h1>
      <hr className="border border-gray-300 mt-2 mb-5" />

      <div>
        <PasswordField
          label="Current Password"
          name="currentPassword"
          value={formData.currentPassword}
          showPassword={showPasswords.current}
          onChange={handleInputChange}
          onToggle={() => togglePasswordVisibility("current")}
          error={errors.currentPassword}
        />

        <PasswordField
          label="New Password"
          name="newPassword"
          value={formData.newPassword}
          showPassword={showPasswords.new}
          onChange={handleInputChange}
          onToggle={() => togglePasswordVisibility("new")}
          error={errors.newPassword}
        />

        <PasswordField
          label="Confirm New Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          showPassword={showPasswords.confirm}
          onChange={handleInputChange}
          onToggle={() => togglePasswordVisibility("confirm")}
          error={errors.confirmPassword}
        />

        {errors.submit && (
          <p className="text-red-500 text-sm mb-4">{errors.submit}</p>
        )}

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={handleCancel}
            className="px-6 py-2 border-2 border-red-500 text-red-500 rounded-lg font-medium hover:bg-red-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={resetPasswordMutation.isPending}
            className="px-6 py-2 rounded-lg font-medium text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {resetPasswordMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
