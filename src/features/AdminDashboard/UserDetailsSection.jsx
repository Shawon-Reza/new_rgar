import React from 'react'
import { FiFileText, FiMessageCircle, FiUserX } from 'react-icons/fi'
import { base_URL } from '../../config/Config'

const UserDetailsSection = ({ user, permissionData, permissionLoading, permissionError }) => {
    return (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Information */}
            <div className="bg-white/50 rounded-xl shadow-md p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FiFileText className="text-primary" />
                    Personal Information
                </h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        {user?.picture && (
                            <img
                                src={`${base_URL}${user.picture}`}
                                alt={user?.full_name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                            />
                        )}
                        <div>
                            <p className="text-sm text-gray-600">Name</p>
                            <p className="font-semibold text-gray-900">{user?.full_name}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{user?.email}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900">{user?.phone || '--'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Role</p>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700 capitalize">
                            {user?.role}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Joining Date</p>
                        <p className="font-medium text-gray-900">
                            {user?.joining_date ? new Date(user.joining_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            }) : '--'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Professional Details */}
            <div className="bg-white/50 rounded-xl shadow-md p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FiFileText className="text-primary" />
                    Professional Details
                </h3>
                <div className="space-y-3">
                    <div>
                        <p className="text-sm text-gray-600 mb-2">Clinics</p>
                        {user?.clinics && user.clinics.length > 0 ? (
                            <div className="space-y-1">
                                {user.clinics.map((clinic, index) => (
                                    <span key={index} className="inline-block px-3 py-1 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 mr-2 mb-2">
                                        {clinic}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No clinics assigned</p>
                        )}
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 mb-2">Knowledge Level</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-primary h-3 rounded-full transition-all"
                                    style={{ width: `${(user?.knowledge_level || 0) * 10}%` }}
                                />
                            </div>
                            <span className="text-sm font-bold text-teal-600">{user?.knowledge_level || 0}/10</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 mb-2">Subject Matters</p>
                        {user?.subject_matters && user.subject_matters.length > 0 ? (
                            <div className="space-y-1">
                                {user.subject_matters.map((matter, index) => (
                                    <span key={index} className="inline-block px-3 py-1 rounded-lg text-sm font-medium bg-purple-50 text-purple-700 mr-2 mb-2">
                                        {matter}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No subject matters</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Permissions */}
            <div className="bg-white/50 rounded-xl shadow-md p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FiMessageCircle className="text-primary" />
                    Permissions
                </h3>
                <div className="space-y-4">
                    {permissionLoading ? (
                        <div className="space-y-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : permissionError ? (
                        <div className="p-3 bg-red-50 rounded-lg text-red-600 text-sm">
                            Error loading permissions
                        </div>
                    ) : permissionData?.groupPerms ? (
                        <>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <FiMessageCircle className="text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">User Management</span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${permissionData.groupPerms.user_management
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {permissionData.groupPerms.user_management ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <FiMessageCircle className="text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">Chat</span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${permissionData.groupPerms.chat
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {permissionData.groupPerms.chat ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <FiFileText className="text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">AI Training</span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${permissionData.groupPerms.ai_training
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {permissionData.groupPerms.ai_training ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <FiUserX className="text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">Block User</span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${permissionData.groupPerms.block_user
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {permissionData.groupPerms.block_user ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <FiFileText className="text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">Assessment</span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${permissionData.groupPerms.assessment
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {permissionData.groupPerms.assessment ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="p-3 bg-gray-50 rounded-lg text-gray-500 text-sm">
                            No permissions configured
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default UserDetailsSection
