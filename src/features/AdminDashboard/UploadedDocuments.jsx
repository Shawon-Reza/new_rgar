"use client"

import { useState, useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { FiUser, FiMoreVertical, FiChevronDown } from "react-icons/fi"
import axiosApi from "../../service/axiosInstance"
import { base_URL, getAuthData } from "../../config/Config"

const UploadedDocuments = () => {
  const [documents, setDocuments] = useState([])
  const [filteredDocuments, setFilteredDocuments] = useState([])
  const [selectedRole, setSelectedRole] = useState("All Roles")
  const [showRoleDropdown, setShowRoleDropdown] = useState(false)

  // Fetch documents from backend
  const { data, isLoading, error } = useQuery({
    queryKey: ["aiTrainingDocs"],
    queryFn: async () => {
      const response = await axiosApi.get("/api/v1/mytrainingrooms/docs/")
      console.log("[UploadedDocuments] API data:", response.data)
      return response.data
    },
  })

  // Normalize API data into table-friendly shape
  const normalizedDocs = useMemo(() => {
    const results = data?.results || []
    return results.map((doc, index) => ({
      id: doc.file_id,
      slNo: String(index + 1).padStart(2, "0"),
      name: doc.file_name || "Untitled",
      documentType: doc.document_type || "--",
      uploadedDate: doc.uploaded_date,
      uploadedBy: doc.uploaded_by_role || "--",
      role: doc.uploaded_by_role || "--",
      fileUrl: doc.file_url,
    }))
  }, [data])

  const roles = useMemo(() => {
    const unique = new Set(["All Roles", ...normalizedDocs.map((d) => d.role)])
    return Array.from(unique)
  }, [normalizedDocs])

  // Sync state with fetched data
  useEffect(() => {
    setDocuments(normalizedDocs)
    setFilteredDocuments(normalizedDocs)
  }, [normalizedDocs])

  // Handle role filter
  const handleRoleFilter = (role) => {
    console.log("[v0] Filtering by role:", role)
    setSelectedRole(role)
    setShowRoleDropdown(false)

    if (role === "All Roles") {
      setFilteredDocuments(documents)
      console.log("[UploadedDocuments] Showing all documents")
    } else {
      const filtered = documents.filter((doc) => doc.role === role)
      setFilteredDocuments(filtered)
      console.log("[UploadedDocuments] Filtered documents:", filtered)
    }
  }

  // Handle view details
  const handleViewDetails = (document) => {
    const { role } = getAuthData()
    console.log("[UploadedDocuments] User role:", role)
    console.log("[UploadedDocuments] Viewing document details:", document)

    // Construct full file URL
    const fullFileUrl = `${base_URL}${document.fileUrl}`
    console.log("[UploadedDocuments] Opening file URL:", fullFileUrl)

    // Open file in new tab
    window.open(fullFileUrl, "_blank")
  }

  // Handle action menu
  const handleAction = (action, document) => {
    console.log("[v0] Action triggered:", action, "for document:", document)
    // Add your logic here - could be edit, delete, download, etc.
  }

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "President":
        return "bg-blue-100 text-blue-700"
      case "Manager":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  if (isLoading) {
    return <div className="p-6">Loading documents...</div>
  }

  if (error) {
    return <div className="p-6 text-red-600">Failed to load documents.</div>
  }

  return (
    <div className=" max-h-[calc(100vh-100px)] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Uploaded Documents</h1>

        {/* Role Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2 px-4 py-2 border border-bg-primary rounded-lg hover:bg-gray-50 transition-colors"
          >
            {selectedRole}
            <FiChevronDown size={18} />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleFilter(role)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${selectedRole === role ? "bg-blue-50 text-blue-600" : "text-gray-700"
                    }`}
                >
                  {role}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">SL.NO</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Documents Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Document Type</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Uploaded Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Uploaded By</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">View Details</th>
              {/* <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th> */}
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.length > 0 ? (
              filteredDocuments.map((document, index) => (
                <tr key={document.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-700">{document.slNo}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <FiUser size={16} className="text-white" />
                      </div>
                      {document.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{document.documentType}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{document.uploadedDate}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(document.role)}`}
                    >
                      {document.uploadedBy}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleViewDetails(document)}
                      className="px-3 py-1 border  text-primary rounded hover:bg-teal-50 transition-colors text-xs font-medium"
                    >
                      View Doc
                    </button>
                  </td>

                  {/* <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => handleAction("menu", document)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <FiMoreVertical size={18} className="text-gray-600" />
                    </button>
                  </td> */}

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No documents found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 text-sm text-gray-600">
        Showing {filteredDocuments.length} of {documents.length} documents
      </div>
    </div>
  )
}

export default UploadedDocuments
