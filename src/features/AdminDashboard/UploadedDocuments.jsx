"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { FiChevronDown, FiExternalLink, FiFileText, FiTrash2 } from "react-icons/fi"
import axiosApi from "../../service/axiosInstance"
import { base_URL } from "../../config/Config"
import { toast } from "react-toastify"
import { queryClient } from "../../main"

const roleBadgeClass = (role) => {
  const normalized = String(role || "").toLowerCase()
  if (normalized === "president") return "border-blue-100 bg-blue-50 text-blue-700"
  if (normalized === "manager") return "border-emerald-100 bg-emerald-50 text-emerald-700"
  if (normalized === "doctor") return "border-sky-100 bg-sky-50 text-sky-700"
  return "border-slate-100 bg-slate-50 text-slate-700"
}

const buildFileUrl = (fileUrl) => {
  if (!fileUrl) return ""
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) return fileUrl
  return `${base_URL}${fileUrl}`
}

const UploadedDocuments = () => {
  const [documents, setDocuments] = useState([])
  const [filteredDocuments, setFilteredDocuments] = useState([])
  const [selectedRole, setSelectedRole] = useState("All Roles")
  const [showRoleDropdown, setShowRoleDropdown] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ["aiTrainingDocs"],
    queryFn: async () => {
      const response = await axiosApi.get("/api/v1/mytrainingrooms/docs/")
      return response.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (fileId) => {
      const response = await axiosApi.delete(`/api/v1/mytrainingrooms/docs/${fileId}/delete/`)
      return response.data
    },
    onSuccess: () => {
      toast.success("Document deleted successfully.")
      queryClient.invalidateQueries({ queryKey: ["aiTrainingDocs"] })
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to delete document.")
    },
  })

  const normalizedDocs = useMemo(() => {
    const results = data?.results || []
    return results.map((doc, index) => ({
      id: doc.file_id,
      slNo: String(index + 1).padStart(2, "0"),
      name: doc.file_name || "Untitled",
      documentType: doc.document_type || "N/A",
      uploadedDate: doc.uploaded_date,
      uploadedBy: doc.uploaded_by_role || "N/A",
      role: doc.uploaded_by_role || "N/A",
      fileUrl: doc.file_url,
    }))
  }, [data])

  const roles = useMemo(() => {
    const unique = new Set(["All Roles", ...normalizedDocs.map((doc) => doc.role)])
    return Array.from(unique)
  }, [normalizedDocs])

  useEffect(() => {
    setDocuments(normalizedDocs)
    setFilteredDocuments(
      selectedRole === "All Roles"
        ? normalizedDocs
        : normalizedDocs.filter((doc) => doc.role === selectedRole)
    )
  }, [normalizedDocs, selectedRole])

  const handleRoleFilter = (role) => {
    setSelectedRole(role)
    setShowRoleDropdown(false)
  }

  const handleViewDetails = (document) => {
    const fullFileUrl = buildFileUrl(document.fileUrl)
    if (fullFileUrl) {
      window.open(fullFileUrl, "_blank")
    }
  }

  const handleDelete = async (document) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${document.name}"?`)
    if (confirmed) {
      deleteMutation.mutate(document.id)
    }
  }

  if (isLoading) {
    return (
      <section className="overflow-hidden rounded-lg border border-[#dfe5ee] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <div className="border-b border-[#edf1f7] px-6 py-5">
          <div className="h-5 w-48 animate-pulse rounded bg-[#e8edf5]" />
          <div className="mt-3 h-4 w-64 animate-pulse rounded bg-[#f0f3f8]" />
        </div>
        <div className="grid gap-3 p-6">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-14 animate-pulse rounded-lg bg-[#f3f6fb]" />
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-lg border border-red-100 bg-white px-6 py-10 text-center shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <h2 className="text-lg font-semibold text-[#111827]">Documents could not be loaded</h2>
        <p className="mt-2 text-sm font-medium text-[#6b7890]">Please try again later.</p>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-lg border border-[#dfe5ee] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 border-b border-[#edf1f7] px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2B76F4]">Training Library</p>
          <h2 className="mt-1 text-xl font-semibold text-[#111827]">Uploaded Documents</h2>
          <p className="mt-1 text-sm font-medium text-[#6b7890]">
            Showing {filteredDocuments.length} of {documents.length} documents.
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowRoleDropdown((current) => !current)}
            className="flex h-10 min-w-40 items-center justify-between gap-2 rounded-lg border border-[#d9e1ec] bg-white px-4 text-sm font-semibold text-[#41506a] transition hover:border-[#2B76F4] hover:text-[#2B76F4]"
          >
            {selectedRole}
            <FiChevronDown className={`h-4 w-4 transition ${showRoleDropdown ? "rotate-180" : ""}`} />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-lg border border-[#dfe5ee] bg-white p-1 shadow-[0_18px_45px_rgba(15,23,42,0.14)]">
              {roles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleFilter(role)}
                  className={`flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm font-semibold transition ${selectedRole === role
                    ? "bg-[#eef4ff] text-[#2B76F4]"
                    : "text-[#41506a] hover:bg-[#f8fafc]"
                    }`}
                >
                  {role}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-[#edf1f7] bg-[#f8fafc]">
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[#77849a]">No</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[#77849a]">Document</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[#77849a]">Type</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[#77849a]">Uploaded</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-[#77849a]">Role</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-[#77849a]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.length > 0 ? (
              filteredDocuments.map((document) => (
                <tr key={document.id} className="border-b border-[#edf1f7] transition last:border-b-0 hover:bg-[#f8fafc]">
                  <td className="px-5 py-4 text-sm font-semibold text-[#6b7890]">{document.slNo}</td>
                  <td className="px-5 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eef4ff] text-[#2B76F4]">
                        <FiFileText className="h-5 w-5" />
                      </span>
                      <span className="line-clamp-2 text-sm font-semibold text-[#111827]">{document.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-[#41506a]">{document.documentType}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-[#41506a]">{document.uploadedDate || "N/A"}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${roleBadgeClass(document.role)}`}>
                      {document.uploadedBy}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleViewDetails(document)}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#d9e1ec] bg-white px-3 text-xs font-semibold text-[#2B76F4] transition hover:border-[#2B76F4]"
                      >
                        <FiExternalLink className="h-4 w-4" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(document)}
                        disabled={deleteMutation.isPending}
                        className="grid h-9 w-9 place-items-center rounded-lg border border-red-100 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Delete document"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-5 py-14 text-center">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-[#f3f6fb] text-[#8b98ad]">
                    <FiFileText className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-[#172033]">No documents found</h3>
                  <p className="mt-1 text-sm font-medium text-[#6b7890]">Upload training materials to populate this library.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default UploadedDocuments
