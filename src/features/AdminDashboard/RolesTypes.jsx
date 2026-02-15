import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FiSearch, FiPlus, FiX } from "react-icons/fi";
import axiosApi from "../../service/axiosInstance";
import { queryClient } from "../../main";
import { toast } from "react-toastify";
import useGetUserProfile from "../../hooks/useGetUserProfile";


const RolesTypes = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchSubrole, setSearchSubrole] = useState("");
    const [selectedClinicType, setSelectedClinicType] = useState(null);
    const [showAddClinicTypeModal, setShowAddClinicTypeModal] = useState(false);
    const [showAddSubroleModal, setShowAddSubroleModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [newClinicTypeName, setNewClinicTypeName] = useState("");
    const [newSubroleName, setNewSubroleName] = useState("");
    const [selectedSubrolesToAssign, setSelectedSubrolesToAssign] = useState([]);
    const [selectedSubrolesToRemove, setSelectedSubrolesToRemove] = useState([]);
    const [assignSearchTerm, setAssignSearchTerm] = useState("");


    const { userProfileData } = useGetUserProfile();

    //=============================================== Get Clinic types =================================================\\
    const { data: clinicTypes = [], error: clinicTypesError, isLoading: clinicTypesLoading } = useQuery({
        queryKey: ["clinicTypes"],
        queryFn: async () => {
            const response = await axiosApi.get("/api/v1/clinictype/");
            return response.data;
        },
        onError: (error) => {
            const message = error?.response?.data?.message || error.message || "Failed to fetch clinic types";
        }
    });

    //=============================================== Get Subroles for selected clinic type =========================\\
    const { data: subroles = [], isLoading: subrolesLoading, error: subrolesError } = useQuery({
        queryKey: ["subroles", selectedClinicType],
        queryFn: async () => {
            const response = await axiosApi.get(`/api/v1/subroleclinic/?clinic_type_id=${selectedClinicType}`);
            return response.data?.data?.subroles || [];
        },
        enabled: Boolean(selectedClinicType),
    });

    //=============================================== Get All Subroles for assignment ================================\\
    const { data: allSubroles = [], isLoading: allSubrolesLoading } = useQuery({
        queryKey: ["allSubroles"],
        queryFn: async () => {
            const response = await axiosApi.get(`/api/v1/subroles/`);
            return response.data;
        },
    });

    //=============================================== Create Clinic Type Mutation =====================================\\
    const createClinicTypeMutation = useMutation({
        mutationFn: async (name) => {
            const response = await axiosApi.post("/api/v1/clinictype/create/", { name });
            return response.data;
        },
        onSuccess: () => {
            toast.success("Clinic type created successfully");
            queryClient.invalidateQueries(["clinicTypes"]);
            setShowAddClinicTypeModal(false);
            setNewClinicTypeName("");
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || "Failed to create clinic type");
        },
    });

    //=============================================== Create Subrole Mutation ========================================\\
    const createSubroleMutation = useMutation({
        mutationFn: async (name) => {
            const response = await axiosApi.post("/api/v1/subroles/create/", { name });
            return response.data;
        },
        onSuccess: () => {
            toast.success("Subrole created successfully");
            queryClient.invalidateQueries(["allSubroles"]);
            setShowAddSubroleModal(false);
            setNewSubroleName("");
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || "Failed to create subrole");
        },
    });

    //=============================================== Assign Subrole to Clinic Mutation =============================\\
    const assignSubroleMutation = useMutation({
        mutationFn: async ({ subroleIds, clinicTypeId }) => {
            const response = await axiosApi.post("/api/v1/subroleclinic/create/", {
                clinic_type: clinicTypeId,
                subroles: subroleIds,
            });
            return response.data;
        },
        onSuccess: () => {
            toast.success("Subroles assigned successfully");
            queryClient.invalidateQueries(["subroles", selectedClinicType]);
            setShowAssignModal(false);
            setSelectedSubrolesToAssign([]);
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || "Failed to assign subroles");
        },
    });

    //=============================================== Remove Subrole from Clinic Mutation ==========================\\
    const removeSubroleMutation = useMutation({
        mutationFn: async ({ subroleIds, clinicTypeId }) => {
            const response = await axiosApi.delete("/api/v1/subroleclinic/remove/", {
                data: {
                    clinic_type: clinicTypeId,
                    subroles: subroleIds,
                },
            });
            return response.data;
        },
        onSuccess: () => {
            toast.success("Subroles removed successfully");
            queryClient.invalidateQueries(["subroles", selectedClinicType]);
            setSelectedSubrolesToRemove([]);
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || "Failed to remove subroles");
        },
    });

    const filteredTypes = Array.isArray(clinicTypes)
        ? clinicTypes.filter((type) =>
            type.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : [];

    const filteredSubroles = Array.isArray(subroles)
        ? subroles.filter((subrole) =>
            (subrole.subrole_name || "").toLowerCase().includes(searchSubrole.toLowerCase())
        )
        : [];

    const filteredAssignSubroles = Array.isArray(allSubroles)
        ? allSubroles.filter((subrole) =>
            (subrole.name || "").toLowerCase().includes(assignSearchTerm.toLowerCase())
        )
        : [];

    useEffect(() => {
        setSelectedSubrolesToRemove([]);
    }, [selectedClinicType]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-125px)]">
            {/* Left: Clinic Types */}
            <div className="bg-white/50 rounded-lg shadow-md p-4 overflow-hidden flex flex-col h-full"> 
                {/* Header */}
                <div className="mb-4 border-b-2 border-gray-200 pb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800">Clinic Types</h2>
                    <button
                        onClick={() => setShowAddClinicTypeModal(true)}
                        className={`flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg transition ${userProfileData?.role === "admin" ? "" : "hidden"}`}
                    >
                        <FiPlus className="w-4 h-4" />
                        Add New
                    </button>
                </div>

                {/* Search Input */}
                <div className="mb-4 relative flex-shrink-0">
                    <FiSearch className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search clinic types..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    />
                </div>

                {/* List Container */}
                <div className="border border-gray-300 rounded-lg overflow-hidden flex flex-col flex-1 min-h-0">
                    {clinicTypesLoading ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Loading clinic types...
                        </div>
                    ) : clinicTypesError ? (
                        <div className="flex items-center justify-center h-full text-red-500">
                            Failed to load clinic types
                        </div>
                    ) : (
                        <div className="overflow-y-auto flex-1">
                            {filteredTypes.length > 0 ? (
                                <div className="divide-y divide-gray-200">
                                    {filteredTypes.map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => setSelectedClinicType(type.id)}
                                            className={`w-full px-4 py-3 hover:bg-teal-50 transition text-left flex items-center justify-between ${selectedClinicType === type.id
                                                ? 'bg-teal-100 border-l-4 border-teal-600'
                                                : ''
                                                }`}
                                        >
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-800">{type.name}</p>
                                                {/* <p className="text-xs text-gray-500">
                                                    ID: {type.id}
                                                </p> */}
                                            </div>
                                            {/* {type.is_active && (
                                                <span className="inline-block px-2 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded">
                                                    Active
                                                </span>
                                            )} */}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                                    No clinic types found
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="mt-3 text-xs text-gray-500 text-center flex-shrink-0">
                    {filteredTypes.length} clinic types
                </div>
            </div>

            {/* Right: Subroles */}
            <div className="bg-white/50 rounded-lg shadow-md p-4 overflow-hidden flex flex-col h-full">
                {/* Header */}
                <div className="mb-4 border-b-2 border-gray-200 pb-3 flex flex-col items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800 ">
                        {selectedClinicType
                            ? `Subroles - ${clinicTypes.find(t => t.id === selectedClinicType)?.name || 'Selected'}`
                            : 'Select a Clinic Type'
                        }
                    </h2>
                    {selectedClinicType && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    if (selectedSubrolesToRemove.length > 0) {
                                        const payload = {
                                            subroleIds: selectedSubrolesToRemove,
                                            clinicTypeId: selectedClinicType,
                                        };
                                        console.log("[RolesTypes] Remove subroles payload:", payload);
                                        removeSubroleMutation.mutate(payload);
                                    }
                                }}
                                disabled={selectedSubrolesToRemove.length === 0 || removeSubroleMutation.isPending}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                            >
                                <FiX className="w-4 h-4" />
                                {removeSubroleMutation.isPending ? "Removing..." : "Remove"}
                            </button>
                            <button
                                onClick={() => setShowAddSubroleModal(true)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition"
                            >
                                <FiPlus className="w-4 h-4" />
                                Create
                            </button>
                            <button
                                onClick={() => setShowAssignModal(true)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                            >
                                <FiPlus className="w-4 h-4" />
                                Assign
                            </button>
                        </div>
                    )}
                </div>

                {!selectedClinicType ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p className="text-center">Select a clinic type to view subroles</p>
                    </div>
                ) : (
                    <>
                        {/* Search Input */}
                        <div className="mb-4 relative flex-shrink-0">
                            <FiSearch className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search subroles..."
                                value={searchSubrole}
                                onChange={(e) => setSearchSubrole(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                            />
                        </div>

                        {/* List Container */}
                        <div className="border border-gray-300 rounded-lg overflow-hidden flex flex-col flex-1 min-h-0">
                            {subrolesLoading ? (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    Loading subroles...
                                </div>
                            ) : subrolesError ? (
                                <div className="flex items-center justify-center h-full text-red-500">
                                    Failed to load subroles
                                </div>
                            ) : (
                                <div className="overflow-y-auto flex-1">
                                    {filteredSubroles.length > 0 ? (
                                        <div className="divide-y divide-gray-200">
                                            {filteredSubroles.map((subrole) => (
                                                <label
                                                    key={subrole.id}
                                                    className="flex items-center gap-3 px-4 py-3 hover:bg-teal-50 transition cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSubrolesToRemove.includes(subrole.subrole_id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedSubrolesToRemove(prev => [...prev, subrole.subrole_id]);
                                                            } else {
                                                                setSelectedSubrolesToRemove(prev => prev.filter(id => id !== subrole.subrole_id));
                                                            }
                                                        }}
                                                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                                                    />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-800">{subrole.subrole_name}</p>
                                                        {/* <p className="text-xs text-gray-500">ID: {subrole.subrole_id}</p> */}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                                            No subroles found
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer Info */}
                        <div className="mt-3 text-xs text-gray-500 text-center flex-shrink-0">
                            {filteredSubroles.length} subroles
                        </div>
                    </>
                )}
            </div>

            {/* Add Clinic Type Modal */}
            {showAddClinicTypeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <h3 className="text-lg font-semibold text-gray-800">Add New Clinic Type</h3>
                            <button
                                onClick={() => {
                                    setShowAddClinicTypeModal(false);
                                    setNewClinicTypeName("");
                                }}
                                className="p-1 hover:bg-gray-100 rounded-full transition"
                            >
                                <FiX className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (newClinicTypeName.trim()) {
                                    createClinicTypeMutation.mutate(newClinicTypeName.trim());
                                }
                            }}
                            className="p-6 space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Clinic Type Name
                                </label>
                                <input
                                    type="text"
                                    value={newClinicTypeName}
                                    onChange={(e) => setNewClinicTypeName(e.target.value)}
                                    placeholder="e.g., Cardiology Clinic"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddClinicTypeModal(false);
                                        setNewClinicTypeName("");
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createClinicTypeMutation.isPending}
                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition disabled:opacity-50"
                                >
                                    {createClinicTypeMutation.isPending ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Subrole Modal */}
            {showAddSubroleModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <h3 className="text-lg font-semibold text-gray-800">Create New Subrole</h3>
                            <button
                                onClick={() => {
                                    setShowAddSubroleModal(false);
                                    setNewSubroleName("");
                                }}
                                className="p-1 hover:bg-gray-100 rounded-full transition"
                            >
                                <FiX className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (newSubroleName.trim()) {
                                    createSubroleMutation.mutate(newSubroleName.trim());
                                }
                            }}
                            className="p-6 space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Subrole Name
                                </label>
                                <input
                                    type="text"
                                    value={newSubroleName}
                                    onChange={(e) => setNewSubroleName(e.target.value)}
                                    placeholder="e.g., Cardiologist"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddSubroleModal(false);
                                        setNewSubroleName("");
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createSubroleMutation.isPending}
                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition disabled:opacity-50"
                                >
                                    {createSubroleMutation.isPending ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Subrole Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Assign Subroles to {clinicTypes.find(t => t.id === selectedClinicType)?.name}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowAssignModal(false);
                                    setSelectedSubrolesToAssign([]);
                                    setAssignSearchTerm("");
                                }}
                                className="p-1 hover:bg-gray-100 rounded-full transition"
                            >
                                <FiX className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (selectedSubrolesToAssign.length > 0) {
                                    assignSubroleMutation.mutate({
                                        subroleIds: selectedSubrolesToAssign,
                                        clinicTypeId: selectedClinicType,
                                    });
                                }
                            }}
                            className="p-6 space-y-4"
                        >
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Subroles ({selectedSubrolesToAssign.length} selected)
                                </label>
                                {allSubrolesLoading ? (
                                    <div className="text-sm text-gray-500">Loading subroles...</div>
                                ) : (
                                    <>
                                        <div className="mb-3 relative">
                                            <FiSearch className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                                            <input
                                                type="text"
                                                placeholder="Search subroles..."
                                                value={assignSearchTerm}
                                                onChange={(e) => setAssignSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                                            />
                                        </div>
                                        <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                                            {filteredAssignSubroles.length > 0 ? (
                                                filteredAssignSubroles.map((subrole) => (
                                                    <label
                                                        key={subrole.id}
                                                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedSubrolesToAssign.includes(subrole.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedSubrolesToAssign(prev => [...prev, subrole.id]);
                                                                } else {
                                                                    setSelectedSubrolesToAssign(prev => prev.filter(id => id !== subrole.id));
                                                                }
                                                            }}
                                                            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                                                        />
                                                        <span className="text-sm text-gray-700">{subrole.name}</span>
                                                    </label>
                                                ))
                                            ) : (
                                                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                                    No subroles found
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setSelectedSubrolesToAssign([]);
                                        setAssignSearchTerm("");
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={assignSubroleMutation.isPending || selectedSubrolesToAssign.length === 0}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                                >
                                    {assignSubroleMutation.isPending ? "Assigning..." : `Assign ${selectedSubrolesToAssign.length > 0 ? `(${selectedSubrolesToAssign.length})` : ''}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RolesTypes