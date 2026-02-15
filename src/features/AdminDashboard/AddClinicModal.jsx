import React, { useState, useEffect } from "react";
import {
    FiX,
    FiMapPin,
    FiPhone,
    FiGlobe,
    FiFileText,
    FiType,
} from "react-icons/fi";
import { useMutation, useQuery } from "@tanstack/react-query";
import axiosApi from "../../service/axiosInstance";
import { toast } from "react-toastify";

const AddClinicModal = ({ isOpen, onClose, data }) => {
    if (!isOpen) return null; // Don't render when closed


    console.log("Clinic data :88888888888888888888888888888888888888::0", data)

    const [formData, setFormData] = useState({
        name: data?.name || "",
        address: data?.address || "",
        phone: data?.phone_number || "",
        fax: data?.fax_number || "",
        website: data?.website || "",
        clinic_type: data?.clinic_type || "",
    });
    const [searchClinicType, setSearchClinicType] = useState("");

    // Reset form data when data prop changes
    useEffect(() => {
        if (data) {
            setFormData({
                name: data.name || "",
                address: data.address || "",
                phone: data.phone_number || "",
                fax: data.fax_number || "",
                website: data.website || "",
                clinic_type: data.clinic_type || "",
            });
        } else {
            setFormData({
                name: "",
                address: "",
                phone: "",
                fax: "",
                website: "",
                clinic_type: "",
            });
        }
        setSearchClinicType("");
    }, [data]);

    const isEditMode = data?.id;
    //=============================================== Get Clinic types =================================================\\

    const { data: clinicTypes, error: clinicTypesError, isLoading: clinicTypesLoading } = useQuery({
        queryKey: ["clinicTypes"],
        queryFn: async () => {
           const response = await axiosApi.get("/api/v1/clinictype/");
            return response.data;
        },
        // enabled: !isEditMode, // Only fetch types when creating a new clinic
        onError: (error) => {
            const message = error?.response?.data?.message || error.message || "Failed to fetch clinic types";
        }
    });
    console.log(clinicTypes)


    //============================================= Create clinic mutation =============================================//
    const createClinicMutation = useMutation({
        mutationFn: async (clinicData) => {
            const response = await axiosApi.post("/api/v1/clinics/create/", {
                name: clinicData.name,
                address: clinicData.address,
                phone_number: clinicData.phone,
                fax_number: clinicData.fax,
                website: clinicData.website,
                clinic_type: clinicData.clinic_type,
            });
            return response.data;
        },
        onSuccess: () => {
            toast.success("Clinic created successfully");
            onClose();
            setFormData({
                name: "",
                address: "",
                phone: "",
                fax: "",
                website: "",
                clinic_type: "",
            });
        },
        onError: (error) => {
            const message = error?.response?.data?.message || error.message || "Failed to create clinic";
            toast.error(message);
            console.log(error?.response?.data?.message || error.message);
        },
    });

    // Update clinic mutation
    const updateClinicMutation = useMutation({
        mutationFn: async (clinicData) => {
            const response = await axiosApi.put(`/api/v1/clinics/${data.id}/update/`, {
                name: clinicData.name,
                address: clinicData.address,
                phone_number: clinicData.phone,
                fax_number: clinicData.fax,
                website: clinicData.website,
                clinic_type: clinicData.clinic_type,
            });
            console.log('[Update Clinic Response]:', response.data);
            return response.data;
        },
        onSuccess: () => {
            toast.success("Clinic updated successfully");
            onClose();
        },
        onError: (error) => {
            const message = error?.response?.data?.message || error.message || "Failed to update clinic";
            toast.error(message);
            console.log(error);
        },
    });

    // Handle field changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handle form submit
    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditMode) {
            updateClinicMutation.mutate(formData);
        } else {
            createClinicMutation.mutate(formData);
        }
    };

    const isLoading = createClinicMutation.isPending || updateClinicMutation.isPending;

    return (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50 px-4" >
            <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg">
                {/* Header */}
                <div className="flex justify-between items-center border-b-3 border-gray-300 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                        {isEditMode ? "Edit Clinic" : "Add New Clinic"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 transition"
                        disabled={isLoading}
                    >
                        <FiX className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
                    {/* Clinic Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Clinic Name
                        </label>
                        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                            <FiFileText className="text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                name="name"

                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter clinic name"
                                className="w-full outline-none text-gray-700"
                            />
                        </div>
                    </div>

                    {/* Address & Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Address
                            </label>
                            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                                <FiMapPin className="text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Enter clinic address"
                                    className="w-full outline-none text-gray-700"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number
                            </label>
                            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                                <FiPhone className="text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="Enter phone number"
                                    className="w-full outline-none text-gray-700"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Fax & Website */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                FAX Number
                            </label>
                            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                                <FiPhone className="text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    name="fax"
                                    value={formData.fax}
                                    onChange={handleChange}
                                    placeholder="Enter fax number"
                                    className="w-full outline-none text-gray-700"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Website
                            </label>
                            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
                                <FiGlobe className="text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    placeholder="Enter website link"
                                    className="w-full outline-none text-gray-700"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                        </label>
                        <div className="space-y-2">
                            <div className="relative">
                                <FiType className="absolute left-3 top-2.5 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search clinic types..."
                                    value={searchClinicType}
                                    onChange={(e) => setSearchClinicType(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>

                            {formData.clinic_type && (
                                <div className="px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-teal-700">
                                            {clinicTypes?.find((t) => t.id === formData.clinic_type)?.name || "Selected"}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setFormData((prev) => ({ ...prev, clinic_type: "" }))}
                                            className="text-teal-600 hover:text-teal-800"
                                            aria-label="Clear clinic type"
                                        >
                                            <FiX className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="border border-gray-300 rounded-lg p-2 max-h-48 overflow-y-auto">
                                {clinicTypesLoading ? (
                                    <span className="text-sm text-gray-500">Loading clinic types...</span>
                                ) : Array.isArray(clinicTypes) && clinicTypes.length > 0 ? (
                                    <div className="space-y-1">
                                        {clinicTypes
                                            .filter(
                                                (t) =>
                                                    t.is_active !== false &&
                                                    t.name.toLowerCase().includes(searchClinicType.toLowerCase())
                                            )
                                            .map((type) => (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            clinic_type: type.id,
                                                        }));
                                                        setSearchClinicType("");
                                                    }}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition ${
                                                        formData.clinic_type === type.id
                                                            ? "bg-teal-100 text-teal-700 border-teal-300"
                                                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    {type.name}
                                                </button>
                                            ))}
                                        {clinicTypes.filter(
                                            (t) =>
                                                t.is_active !== false &&
                                                t.name.toLowerCase().includes(searchClinicType.toLowerCase())
                                        ).length === 0 && (
                                            <span className="text-sm text-gray-500 p-2">
                                                No clinic types found
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-500">No data available</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-red-400 text-red-500 rounded-lg hover:bg-red-50 transition"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-60"
                            disabled={isLoading}
                        >
                            {isLoading ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Clinic" : "Add Clinic")}
                        </button>
                    </div>
                </form>
            </div>
        </div >
    );
};

export default AddClinicModal;
