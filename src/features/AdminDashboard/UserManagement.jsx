import { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiSearch, FiUserPlus, FiUsers } from "react-icons/fi";
import UserDetailsTable from "./UserDetailsTable";
import AddNewUserModal from "./AddNewUserModal";
import ChangePasswordModal from "./ChangePasswordModal";
import useGetSubjectMattersAndClinicsList from "../../hooks/useGetSubjectMattersAndClinicsList";
import { useQuery } from "@tanstack/react-query";
import axiosApi from "../../service/axiosInstance";

const dropdownButtonClass = "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-[#d9e1ec] bg-white px-4 text-sm font-semibold text-[#41506a] outline-none transition hover:border-[#2B76F4] hover:text-[#2B76F4] focus:border-[#2B76F4] focus:ring-4 focus:ring-blue-100";
const dropdownMenuClass = "absolute right-0 z-[100] mt-2 max-h-64 w-full min-w-48 overflow-y-auto rounded-xl border border-[#dfe5ee] bg-white p-1 shadow-[0_18px_45px_rgba(15,23,42,0.14)]";

export default function UserManagement() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRole, setSelectedRole] = useState("All Roles");
    const [selectedClinic, setSelectedClinic] = useState("All Clinics");
    const [selectedClinicId, setSelectedClinicId] = useState(null);
    const [users, setUsers] = useState([]);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create");
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [changePasswordUserId, setChangePasswordUserId] = useState(null);
    const [changePasswordUserName, setChangePasswordUserName] = useState("");

    const [showRoleDropdown, setShowRoleDropdown] = useState(false);
    const [showClinicDropdown, setShowClinicDropdown] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const roleRef = useRef();
    const clinicRef = useRef();

    const roles = [
        "All Roles",
        "President",
        "Manager",
        "Doctor",
        "Staff",
        "jr_staff",
    ];

    const {
        clinicsList,
        subjectMattersList,
        isLoading,
        refetch
    } = useGetSubjectMattersAndClinicsList();

    const {
        data: userList = { count: 0, next: null, previous: null, results: [] },
        isLoading: userListLoading,
        error: userListError,
    } = useQuery({
        queryKey: ["userList", searchQuery, selectedRole, selectedClinicId, currentPage],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (searchQuery) params.append("search", searchQuery);
            if (selectedRole && selectedRole !== "All Roles") params.append("role", selectedRole.toLowerCase());
            if (selectedClinicId) params.append("clinic", selectedClinicId);
            params.append("page", currentPage);

            const response = await axiosApi.get(`/api/v1/users/?${params.toString()}`);
            return response.data;
        },
    });

    const mapUserFromApi = (u, idx) => {
        const subjectMattersValue = Array.isArray(u.subject_matters) && u.subject_matters.length
            ? (u.subject_matters[0].title || u.subject_matters[0])
            : "N/A";
        const clinicValue = Array.isArray(u.clinics) && u.clinics.length ? u.clinics[0] : "N/A";
        const statusValue = u.is_active ? "Active" : "Inactive";

        return {
            id: String(u.id ?? idx + 1).padStart(2, "0"),
            name: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email,
            email: u.email,
            subjectMatters: subjectMattersValue,
            role: u.role,
            clinic: clinicValue,
            status: statusValue,
        };
    };

    useEffect(() => {
        if (Array.isArray(userList?.results) && userList?.results.length) {
            setUsers(userList.results.map((u, idx) => mapUserFromApi(u, idx)));
        } else {
            setUsers([]);
        }
    }, [userList]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedRole, selectedClinicId]);

    const handleAddUser = () => {
        setModalMode("create");
        setSelectedUserId(null);
        setIsAddUserOpen(true);
    };

    const handleEditUser = (userId) => {
        setModalMode("edit");
        setSelectedUserId(userId);
        setIsAddUserOpen(true);
    };

    const handleChangePassword = (userId, userName) => {
        setChangePasswordUserId(userId);
        setChangePasswordUserName(userName);
        setIsChangePasswordOpen(true);
    };

    const handleCloseChangePassword = () => {
        setIsChangePasswordOpen(false);
        setChangePasswordUserId(null);
        setChangePasswordUserName("");
    };

    const handleCloseAddUser = () => {
        setIsAddUserOpen(false);
        setModalMode("create");
        setSelectedUserId(null);
    };

    const mapUserToRow = (u) => ({
        id: String(users.length + 1).padStart(2, "0"),
        name: u.name || `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim(),
        email: u.email,
        subjectMatters: u.subjectMatter || "N/A",
        role: u.role,
        clinic: Array.isArray(u.clinics) && u.clinics.length ? u.clinics[0] : "N/A",
        status: u.status || "Active",
    });

    const handleUserCreated = (created) => {
        setUsers((prev) => [...prev, mapUserToRow(created)]);
    };

    const handleRoleChange = (role) => {
        setSelectedRole(role);
        setShowRoleDropdown(false);
    };

    const handleClinicChange = (clinicOption) => {
        const isAll = clinicOption === "All Clinics";
        setSelectedClinic(isAll ? "All Clinics" : (clinicOption.name || clinicOption.title || clinicOption));
        setSelectedClinicId(isAll ? null : clinicOption.id);
        setShowClinicDropdown(false);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const pageSize = 20;
    const totalItems = userList?.count || 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const hasNextPage = Boolean(userList?.next);
    const hasPreviousPage = Boolean(userList?.previous);
    const activeFilters = [
        selectedRole !== "All Roles" ? selectedRole : null,
        selectedClinicId ? selectedClinic : null,
        searchQuery ? "Search active" : null,
    ].filter(Boolean);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (roleRef.current && !roleRef.current.contains(e.target) && showRoleDropdown) {
                setShowRoleDropdown(false);
            }
            if (clinicRef.current && !clinicRef.current.contains(e.target) && showClinicDropdown) {
                setShowClinicDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showRoleDropdown, showClinicDropdown]);

    return (
        <div className="min-h-screen text-[#172033]">
            <AddNewUserModal
                isOpen={isAddUserOpen}
                onClose={handleCloseAddUser}
                onCreated={handleUserCreated}
                onRefetch={refetch}
                mode={modalMode}
                userId={selectedUserId}
                roles={roles.filter((r) => r !== "All Roles")}
                clinics={clinicsList}
                subjectMatters={subjectMattersList}
                isLoading={isLoading}
            />

            <header className="-mx-2 -mt-4 border-b border-[#dfe3ea] bg-white px-6 py-4 sm:-mx-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#2B76F4]">Access Control</span>
                        <h1 className="mt-1 text-2xl font-semibold tracking-normal text-[#111827] md:text-3xl">User Management</h1>
                    </div>
                    <button
                        onClick={handleAddUser}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2B76F4] px-5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(43,118,244,0.22)] transition hover:bg-[#1f68e8]"
                    >
                        <FiUserPlus className="h-4 w-4" />
                        Add User
                    </button>
                </div>
            </header>

            <section className="mx-auto grid w-full max-w-6xl gap-6 px-1 py-6 sm:px-0 md:py-8">
                <div className="relative z-30 overflow-visible rounded-2xl border border-[#dfe5ee] bg-white shadow-[0_20px_55px_rgba(15,23,42,0.06)]">
                    <div className="flex flex-col gap-4 border-b border-[#edf1f7] px-5 py-5 lg:flex-row lg:items-center lg:justify-between md:px-6">
                        <div className="flex items-center gap-3">
                            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eef4ff] text-[#2B76F4]">
                                <FiUsers className="h-5 w-5" />
                            </span>
                            <div>
                                <h2 className="text-xl font-semibold text-[#111827]">Team Directory</h2>
                                <p className="mt-1 text-sm font-medium text-[#6b7890]">
                                    {totalItems > 0 ? `${totalItems} users in the directory` : "Manage team members and access"}
                                </p>
                            </div>
                        </div>

                        {activeFilters.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {activeFilters.map((filter) => (
                                    <span key={filter} className="rounded-full border border-[#bad0ff] bg-[#eef4ff] px-3 py-1 text-xs font-semibold text-[#2B76F4]">
                                        {filter}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid gap-4 p-5 md:p-6">
                        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                            <div className="relative">
                                <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b98ad]" />
                                <input
                                    type="text"
                                    placeholder="Search by name or email"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-11 w-full rounded-xl border border-[#d9e1ec] bg-white pl-11 pr-4 text-sm font-medium text-[#172033] outline-none transition placeholder:text-[#97a4b8] focus:border-[#2B76F4] focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <div className="relative min-w-44" ref={roleRef}>
                                <button
                                    onClick={() => setShowRoleDropdown((prev) => !prev)}
                                    className={dropdownButtonClass}
                                >
                                    <span className="truncate">{selectedRole}</span>
                                    <FiChevronDown className={`h-4 w-4 transition ${showRoleDropdown ? "rotate-180" : ""}`} />
                                </button>
                                {showRoleDropdown && (
                                    <div className={dropdownMenuClass}>
                                        {roles.map((role) => (
                                            <button
                                                key={role}
                                                onClick={() => handleRoleChange(role)}
                                                className={`flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm font-semibold transition ${role === selectedRole
                                                    ? "bg-[#eef4ff] text-[#2B76F4]"
                                                    : "text-[#41506a] hover:bg-[#f8fafc]"
                                                    }`}
                                            >
                                                {role.replace("_", " ")}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative min-w-48" ref={clinicRef}>
                                <button
                                    onClick={() => setShowClinicDropdown((prev) => !prev)}
                                    className={dropdownButtonClass}
                                >
                                    <span className="truncate">{selectedClinic}</span>
                                    <FiChevronDown className={`h-4 w-4 transition ${showClinicDropdown ? "rotate-180" : ""}`} />
                                </button>
                                {showClinicDropdown && (
                                    <div className={dropdownMenuClass}>
                                        <button
                                            key="all-clinics"
                                            onClick={() => handleClinicChange("All Clinics")}
                                            className={`flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm font-semibold transition ${selectedClinicId === null
                                                ? "bg-[#eef4ff] text-[#2B76F4]"
                                                : "text-[#41506a] hover:bg-[#f8fafc]"
                                                }`}
                                        >
                                            All Clinics
                                        </button>
                                        {clinicsList?.map((clinic) => (
                                            <button
                                                key={clinic.id}
                                                onClick={() => handleClinicChange(clinic)}
                                                className={`flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm font-semibold transition ${clinic.id === selectedClinicId
                                                    ? "bg-[#eef4ff] text-[#2B76F4]"
                                                    : "text-[#41506a] hover:bg-[#f8fafc]"
                                                    }`}
                                            >
                                                {clinic.name || clinic.title || clinic.id}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <UserDetailsTable
                    users={userList?.results}
                    onEditUser={handleEditUser}
                    onChangePassword={handleChangePassword}
                    isLoading={userListLoading}
                    error={userListError}
                />

                <div className="flex flex-col gap-4 rounded-2xl border border-[#dfe5ee] bg-white px-5 py-4 shadow-[0_20px_55px_rgba(15,23,42,0.05)] sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm font-medium text-[#6b7890]">
                        {totalItems > 0
                            ? `Page ${currentPage} of ${totalPages} (${totalItems} total users)`
                            : "No users to display"}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={!hasPreviousPage || currentPage === 1}
                            className="h-10 rounded-xl border border-[#d9e1ec] bg-white px-4 text-sm font-semibold text-[#41506a] transition hover:border-[#2B76F4] hover:text-[#2B76F4] disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            Previous
                        </button>
                        <span className="min-w-20 text-center text-sm font-semibold text-[#172033]">
                            {currentPage}/{totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={!hasNextPage || currentPage === totalPages}
                            className="h-10 rounded-xl border border-[#d9e1ec] bg-white px-4 text-sm font-semibold text-[#41506a] transition hover:border-[#2B76F4] hover:text-[#2B76F4] disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </section>

            <ChangePasswordModal
                isOpen={isChangePasswordOpen}
                onClose={handleCloseChangePassword}
                userId={changePasswordUserId}
                userName={changePasswordUserName}
            />
        </div>
    );
}
