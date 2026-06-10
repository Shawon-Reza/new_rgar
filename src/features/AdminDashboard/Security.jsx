"use client";

import { useState } from "react";
import { FiCheckCircle, FiEye, FiEyeOff, FiLock, FiRefreshCcw, FiSave, FiShield } from "react-icons/fi";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import axiosApi from "../../service/axiosInstance";

const PASSWORD_FIELDS = [
  {
    label: "Current Password",
    name: "currentPassword",
    showKey: "current",
    placeholder: "Enter current password",
  },
  {
    label: "New Password",
    name: "newPassword",
    showKey: "new",
    placeholder: "Enter new password",
  },
  {
    label: "Confirm New Password",
    name: "confirmPassword",
    showKey: "confirm",
    placeholder: "Confirm new password",
  },
];

const PasswordField = ({ label, name, value, showPassword, onChange, onToggle, error, placeholder }) => (
  <div>
    <label className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#6b778c]">
      <FiLock size={15} />
      {label}
    </label>
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`h-12 w-full rounded-lg border bg-white px-4 pr-12 text-sm font-semibold text-[#172033] outline-none transition placeholder:text-[#98a4b5] focus:border-[#2f6ff3] focus:ring-4 focus:ring-blue-100 ${error ? "border-red-300 bg-red-50/40" : "border-[#d9e1ec]"}`}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#7b8798] transition-colors hover:bg-[#f2f5f9] hover:text-[#172033]"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
      </button>
    </div>
    {error && <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>}
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
      const response = await axiosApi.post('/api/v1/users/password/reset/', payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setErrors({});
    },
    onError: (error) => {
      const message = error?.response?.data?.message || error?.response?.data?.detail || 'Failed to change password. Please try again.';
      setErrors({ submit: message });
    },
  });

  const hasChanges = Boolean(formData.currentPassword || formData.newPassword || formData.confirmPassword);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", submit: "" }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    resetPasswordMutation.mutate({
      old_password: formData.currentPassword,
      password1: formData.newPassword,
      password2: formData.confirmPassword,
    });
  };

  const handleCancel = () => {
    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setErrors({});
  };

  return (
    <section className="mx-auto max-w-3xl">
      <form
        onSubmit={handleSaveChanges}
        className="overflow-hidden rounded-lg border border-[#dfe6f0] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.07)]"
      >
        <div className="border-b border-[#edf1f6] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold tracking-normal text-[#111827]">Password & Security</h2>
              <p className="mt-1 text-sm font-medium text-[#6b778c]">
                Update your password to keep your account protected.
              </p>
            </div>
            <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff] text-[#2f6ff3] sm:flex">
              <FiShield size={20} />
            </div>
          </div>
        </div>

        <div className="grid gap-5 px-6 py-6">
          {PASSWORD_FIELDS.map((field) => (
            <PasswordField
              key={field.name}
              label={field.label}
              name={field.name}
              value={formData[field.name]}
              showPassword={showPasswords[field.showKey]}
              onChange={handleInputChange}
              onToggle={() => togglePasswordVisibility(field.showKey)}
              error={errors[field.name]}
              placeholder={field.placeholder}
            />
          ))}

          <div className="rounded-lg border border-[#dfe8f5] bg-[#f8fbff] px-4 py-3">
            <div className="flex gap-3">
              <FiCheckCircle className="mt-0.5 shrink-0 text-[#2f6ff3]" size={17} />
              <p className="text-sm font-medium leading-6 text-[#526174]">
                Use at least 8 characters. A mix of letters, numbers, and symbols is recommended.
              </p>
            </div>
          </div>

          {errors.submit && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {errors.submit}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#edf1f6] px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            disabled={!hasChanges || resetPasswordMutation.isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#d9e1ec] bg-white px-5 text-sm font-extrabold text-[#526174] transition-colors hover:bg-[#f7f9fc] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCcw size={15} />
            Reset
          </button>
          <button
            type="submit"
            disabled={!hasChanges || resetPasswordMutation.isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#172640] px-5 text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(23,38,64,0.22)] transition-colors hover:bg-[#203250] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiSave size={15} />
            {resetPasswordMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </section>
  );
}
