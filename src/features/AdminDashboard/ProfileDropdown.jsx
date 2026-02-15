import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiLogOut } from 'react-icons/fi'
import { base_URL } from '../../config/Config'
import { CgProfile } from "react-icons/cg";
import useIsBelowMd from '../../Components/hooks/useIsBelowMd';


const ProfileDropdown = ({ userProfileData }) => {
    const navigate = useNavigate()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef(null)
    const isMobile = useIsBelowMd()

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false)
            }
        }

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isDropdownOpen])

    const handleLogout = () => {
        // Clear tokens and user data
        localStorage.removeItem('auth')

        // Navigate to login
        navigate('/login')
    }

    const toggleDropdown = () => {
        setIsDropdownOpen(prev => !prev)
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <figure
                className="w-11 h-11 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={toggleDropdown}
            >
                <img
                    src={`${base_URL}${userProfileData?.picture}` || "/placeholder.svg"}
                    alt="Profile"
                    className="rounded-full object-cover w-full h-full"
                />
            </figure>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
                <div className={`absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 ${isMobile ? 'left-0' : ''}`}>
                    <button
                        onClick={() => {
                            navigate('/admin/settings/profile')
                            setIsDropdownOpen(false)
                        }}
                        className="w-full px-4 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                    >
                        <CgProfile size={16} />
                        Profile
                    </button>
                    <button
                        onClick={() => {
                            handleLogout()
                            setIsDropdownOpen(false)
                        }}
                        className="w-full px-4 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition-colors"
                    >
                        <FiLogOut size={16} />
                        Logout
                    </button>
                </div>
            )}
        </div>
    )
}

export default ProfileDropdown
