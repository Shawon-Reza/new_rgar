import React, { useState } from 'react'
import { FiX, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import { useMutation } from '@tanstack/react-query'
import axiosApi from '../../service/axiosInstance'
import { toast } from 'react-toastify'

const ChangePasswordModal = ({ isOpen, onClose, userId, userName }) => {
  if (!isOpen) return null

  console.log("From modal:",userId)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')

  const changePasswordMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await axiosApi.post(`/api/v1/users/${userId}/change-password/`, payload)
      return response.data
    },
    onSuccess: (data) => {
      console.log('Password changed successfully:', data)
    //   alert('Password changed successfully!')
      toast.success('Password changed successfully!')
      handleClose()
    },
    onError: (error) => {
      console.error('[ChangePasswordModal] Failed to change password:', error)
      setError(error?.response?.data?.message || 'Failed to change password.')
    },
  })

  const handleClose = () => {
    setNewPassword('')
    setConfirmPassword('')
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setError('')
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!newPassword) {
      setError('New password is required')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    changePasswordMutation.mutate({ 
      new_password: newPassword,
      new_password2: confirmPassword
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-white">
          <h2 id="change-password-title" className="text-xl font-semibold text-gray-800">
            Change Password
          </h2>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Close">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          {userName && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Changing password for:</p>
              <p className="text-base font-semibold text-gray-900">{userName}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="flex text-sm font-medium text-gray-700 mb-1 items-center gap-2">
              <FiLock className="w-4 h-4 text-gray-500" />
              New Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-2.5 text-gray-500" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((s) => !s)}
                className="absolute right-3 top-2.5 text-gray-500"
                aria-label="Toggle password visibility"
              >
                {showNewPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="flex text-sm font-medium text-gray-700 mb-1 items-center gap-2">
              <FiLock className="w-4 h-4 text-gray-500" />
              Confirm Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-2.5 text-gray-500" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((s) => !s)}
                className="absolute right-3 top-2.5 text-gray-500"
                aria-label="Toggle password visibility"
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className={`px-5 py-2 rounded-lg text-white font-semibold transition ${
                changePasswordMutation.isPending
                  ? 'bg-teal-300 cursor-not-allowed'
                  : 'bg-primary '
              }`}
            >
              {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChangePasswordModal
