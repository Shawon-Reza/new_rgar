import { useState, useRef, useEffect } from "react"
import { FiChevronDown, FiSearch } from "react-icons/fi"

const ClinicSelector = ({ clinics, isLoading, onSelectClinic }) => {
    // ============ STATE MANAGEMENT ============
    const [selectedClinic, setSelectedClinic] = useState(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef(null)

    // ============ FILTER CLINICS BASED ON SEARCH ============
    const filteredClinics = clinics?.filter(clinic =>
        clinic.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

    // ============ HANDLE CLINIC SELECTION ============
    const handleSelectClinic = (clinic) => {
        setSelectedClinic(clinic)
        setIsDropdownOpen(false)
        setSearchQuery("")
        console.log("Selected Clinic:", clinic)

        // Call parent callback if provided
        if (onSelectClinic) {
            onSelectClinic(clinic)
        }
    }

    // ============ CLOSE DROPDOWN ON OUTSIDE CLICK ============
    const handleClickOutside = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
            setIsDropdownOpen(false)
        }
    }

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div className="mb-6" ref={dropdownRef}>
            <label className="text-xl font-medium mb-2 flex items-center gap-2">
                Please Select A Clinic
            </label>

            <div className="relative">
                {/* Dropdown Button */}
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full bg-white/50 border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-between hover:border-gray-400 transition-colors"
                >
                    <span className={selectedClinic ? "text-gray-900" : "text-gray-500"}>
                        {selectedClinic ? selectedClinic.name : "Select a clinic"}
                    </span>
                    <FiChevronDown
                        size={20}
                        className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                    />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                        {/* Search Input */}
                        <div className="p-3 border-b border-gray-200">
                            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                                <FiSearch size={18} className="text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search clinics..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 bg-transparent outline-none text-sm"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Clinic List */}
                        <div className="max-h-64 overflow-y-auto">
                            {isLoading ? (
                                <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                    Loading clinics...
                                </div>
                            ) : filteredClinics.length === 0 ? (
                                <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                    No clinics found
                                </div>
                            ) : (
                                filteredClinics.map((clinic) => (
                                    <button
                                        key={clinic.id}
                                        onClick={() => handleSelectClinic(clinic)}
                                        className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${selectedClinic?.id === clinic.id ? "bg-blue-50 font-semibold text-blue-600" : ""
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{clinic.name}</span>
                                            {selectedClinic?.id === clinic.id && (
                                                <span className="text-blue-600">✓</span>
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Selected Clinic Info */}
            {selectedClinic && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                        Selected: <span className="font-semibold">{selectedClinic.name}</span> 
                    </p>
                </div>
            )}
        </div>
    )
}

export default ClinicSelector
