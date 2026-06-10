import { useMemo, useState } from 'react'
import { FiBookOpen, FiCheck, FiChevronDown, FiHash, FiMapPin, FiSearch, FiSend, FiUsers, FiX } from 'react-icons/fi'
import { PiGraduationCapLight } from 'react-icons/pi'
import { useMutation, useQuery } from '@tanstack/react-query'
import useGetSubjectMattersAndClinicsList from '../../../hooks/useGetSubjectMattersAndClinicsList'
import axiosApi from '../../../service/axiosInstance'
import { queryClient } from '../../../main'
import { toast } from 'react-toastify'

const inputClass = 'h-11 w-full rounded-xl border border-[#d9e1ec] bg-white px-4 text-sm font-medium text-[#172033] outline-none transition placeholder:text-[#97a4b8] focus:border-[#2B76F4] focus:ring-4 focus:ring-blue-100'
const labelClass = 'mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#77849a]'
const dropdownButtonClass = 'flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-[#d9e1ec] bg-white px-4 text-left text-sm font-medium text-[#172033] shadow-sm outline-none transition hover:border-[#2B76F4] focus:border-[#2B76F4] focus:ring-4 focus:ring-blue-100'
const dropdownMenuClass = 'absolute left-0 right-0 top-[calc(100%+8px)] z-[80] max-h-64 overflow-y-auto rounded-2xl border border-[#dfe7f2] bg-white p-1.5 shadow-[0_18px_42px_rgba(15,23,42,0.16)]'

const CreateNewAssesment = () => {
    const [formData, setFormData] = useState({
        title: '',
        role: '',
        clinic: '',
        numberOfQuestions: '5',
        message: '',
        subroleId: null,
        subjectMatterId: null,
    })
    const [searchSubrole, setSearchSubrole] = useState('')
    const [searchSubjectMatter, setSearchSubjectMatter] = useState('')
    const [openDropdown, setOpenDropdown] = useState(null)

    const roles = ['Manager', 'Doctor', 'Staff', 'Jr_staff']
    const subroleRoles = ['manager', 'doctor', 'staff', 'jr_staff']
    const { clinicsList } = useGetSubjectMattersAndClinicsList()

    const { data: subRolesData, isLoading: isLoadingSubRoles } = useQuery({
        queryKey: ['subRoles', formData.clinic],
        queryFn: async () => {
            const response = await axiosApi.get(`/api/v1/subroles/?clinic_ids=${formData.clinic}`)
            return response.data
        },
        enabled: Boolean(formData.clinic),
    })

    const { data: subjectMatters = [], isLoading: subjectMattersLoading } = useQuery({
        queryKey: ['subjectMatters'],
        queryFn: async () => {
            const response = await axiosApi.get('/api/v1/subjects/')
            return Array.isArray(response.data) ? response.data : response.data?.results || response.data?.data || []
        },
    })

    const subRoles = useMemo(() => {
        if (Array.isArray(subRolesData)) return subRolesData
        return subRolesData?.results || subRolesData?.data || []
    }, [subRolesData])

    const usesSubroles = subroleRoles.includes(formData.role)

    const filteredSubRoles = useMemo(() => (
        subRoles.filter((subrole) =>
            subrole?.is_active &&
            subrole?.name?.toLowerCase().includes(searchSubrole.toLowerCase())
        )
    ), [searchSubrole, subRoles])

    const filteredSubjectMatters = useMemo(() => (
        subjectMatters.filter((subject) =>
            subject?.title?.toLowerCase().includes(searchSubjectMatter.toLowerCase())
        )
    ), [searchSubjectMatter, subjectMatters])

    const selectedOptionLabel = usesSubroles
        ? subRoles.find((subrole) => subrole.id === formData.subroleId)?.name
        : subjectMatters.find((subject) => subject.id === formData.subjectMatterId)?.title

    const createAssessmentMutation = useMutation({
        mutationFn: async (data) => {
            const response = await axiosApi.post('/api/v1/assesments/create/', {
                title: data.title,
                clinic: parseInt(data.clinic),
                role: data.role.toLowerCase(),
                description: data.message,
                count: parseInt(data.numberOfQuestions),
                subject_matters: data.subjectMatterId ? [data.subjectMatterId] : [],
                subroles: data.subroleId ? [data.subroleId] : [],
            })
            return response.data
        },
        onSuccess: () => {
            toast.success('Assessment created successfully.')
            queryClient.invalidateQueries({ queryKey: ['assessments'] })
            setFormData({
                title: '',
                role: '',
                clinic: '',
                numberOfQuestions: '5',
                message: '',
                subroleId: null,
                subjectMatterId: null,
            })
            setSearchSubrole('')
            setSearchSubjectMatter('')
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Error creating assessment.')
        }
    })

    const handleChange = (field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }))
    }

    const handleRoleChange = (newRole) => {
        setFormData(prev => ({
            ...prev,
            role: newRole,
            subroleId: null,
            subjectMatterId: null,
        }))
        setSearchSubrole('')
        setSearchSubjectMatter('')
        setOpenDropdown(null)
    }

    const handleClinicChange = (newClinic) => {
        setFormData(prev => ({
            ...prev,
            clinic: newClinic,
            subroleId: null,
        }))
        setSearchSubrole('')
        setOpenDropdown(null)
    }

    const clearSelectedOption = () => {
        setFormData(prev => ({
            ...prev,
            subroleId: null,
            subjectMatterId: null,
        }))
    }

    const handleGenerate = (e) => {
        e.preventDefault()
        if (!formData.title || !formData.role || !formData.clinic) {
            toast.warn('Please fill in all required fields.')
            return
        }
        createAssessmentMutation.mutate(formData)
    }

    const SelectMenu = ({ id, valueLabel, placeholder, options, onSelect }) => {
        const isOpen = openDropdown === id

        return (
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setOpenDropdown((current) => current === id ? null : id)}
                    className={dropdownButtonClass}
                >
                    <span className={`truncate ${valueLabel ? '' : 'text-[#8da0ba]'}`}>
                        {valueLabel || placeholder}
                    </span>
                    <FiChevronDown className={`h-4 w-4 shrink-0 text-[#74839f] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className={dropdownMenuClass}>
                        {options.length > 0 ? (
                            options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => onSelect(option.value)}
                                    className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm font-semibold transition ${option.active
                                        ? 'bg-[#eef4ff] text-[#2B76F4]'
                                        : 'text-[#526174] hover:bg-[#f8fafc] hover:text-[#172033]'
                                    }`}
                                >
                                    <span className="truncate">{option.label}</span>
                                    {option.active && <FiCheck className="h-4 w-4 shrink-0" />}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-sm font-semibold text-[#8da0ba]">No options available</div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    return (
        <article className="relative z-20 overflow-visible rounded-2xl border border-[#dfe5ee] bg-white shadow-[0_20px_55px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-4 border-b border-[#edf1f7] bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
                <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eef4ff] text-[#2B76F4]">
                        <PiGraduationCapLight className="h-6 w-6" />
                    </span>
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2B76F4]">Builder</p>
                        <h2 className="text-xl font-semibold text-[#111827]">Create Assessment</h2>
                    </div>
                </div>
                <p className="max-w-md text-sm font-medium leading-6 text-[#6b7890]">
                    Build a focused assessment by clinic, role, and question count.
                </p>
            </div>

            <form onSubmit={handleGenerate} className="grid gap-5 px-5 py-5 md:px-6 md:py-6">
                <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                    <div>
                        <label className={labelClass}>
                            <FiBookOpen className="h-4 w-4" />
                            Title
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={handleChange('title')}
                            placeholder="Weekly knowledge check"
                            className={inputClass}
                            required
                        />
                    </div>

                    <div>
                        <label className={labelClass}>
                            <FiMapPin className="h-4 w-4" />
                            Clinic
                        </label>
                        <SelectMenu
                            id="clinic"
                            placeholder="Select clinic"
                            valueLabel={clinicsList?.find((clinic) => String(clinic.id) === String(formData.clinic))?.name}
                            options={(clinicsList || []).map((clinic) => ({
                                value: String(clinic.id),
                                label: clinic.name,
                                active: String(formData.clinic) === String(clinic.id),
                            }))}
                            onSelect={handleClinicChange}
                        />
                    </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                    <div>
                        <label className={labelClass}>
                            <FiUsers className="h-4 w-4" />
                            Role
                        </label>
                        <SelectMenu
                            id="role"
                            placeholder="Select a role"
                            valueLabel={roles.find((role) => role.toLowerCase() === formData.role)?.replace('_', ' ')}
                            options={roles.map((role) => ({
                                value: role.toLowerCase(),
                                label: role.replace('_', ' '),
                                active: formData.role === role.toLowerCase(),
                            }))}
                            onSelect={handleRoleChange}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>
                            <FiHash className="h-4 w-4" />
                            Questions
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="50"
                            value={formData.numberOfQuestions}
                            onChange={handleChange('numberOfQuestions')}
                            className={inputClass}
                            required
                        />
                    </div>
                </div>

                {formData.role && (
                    <div className="rounded-2xl border border-[#e3e9f2] bg-[#f8fafc] p-4">
                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div className="flex-1">
                                <label className={labelClass}>
                                    <FiSearch className="h-4 w-4" />
                                    {usesSubroles ? 'Sub Role' : 'Subject Matter'}
                                </label>
                                <input
                                    type="text"
                                    placeholder={usesSubroles ? 'Search sub roles' : 'Search subjects'}
                                    value={usesSubroles ? searchSubrole : searchSubjectMatter}
                                    onChange={(e) => {
                                        if (usesSubroles) {
                                            setSearchSubrole(e.target.value)
                                        } else {
                                            setSearchSubjectMatter(e.target.value)
                                        }
                                    }}
                                    className={inputClass}
                                />
                            </div>

                            {selectedOptionLabel && (
                                <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-[#bad0ff] bg-white px-4 text-sm font-semibold text-[#2B76F4] shadow-sm">
                                    <span className="line-clamp-1">{selectedOptionLabel}</span>
                                    <button
                                        type="button"
                                        onClick={clearSelectedOption}
                                        className="grid h-7 w-7 place-items-center rounded-lg text-[#6b7890] transition hover:bg-[#eef4ff] hover:text-[#2B76F4]"
                                        aria-label="Clear selected option"
                                    >
                                        <FiX className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="max-h-44 overflow-y-auto rounded-xl border border-[#e3e9f2] bg-white p-2">
                            {usesSubroles ? (
                                isLoadingSubRoles ? (
                                    <p className="px-3 py-3 text-sm font-semibold text-[#6b7890]">Loading sub roles...</p>
                                ) : filteredSubRoles.length > 0 ? (
                                    <div className="grid gap-1">
                                        {filteredSubRoles.map((subrole) => (
                                            <button
                                                key={subrole.id}
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, subroleId: subrole.id }))
                                                    setSearchSubrole('')
                                                }}
                                                className={`flex min-h-10 items-center justify-between rounded-lg px-3 text-left text-sm font-semibold transition ${formData.subroleId === subrole.id
                                                    ? 'bg-[#eef4ff] text-[#2B76F4]'
                                                    : 'text-[#41506a] hover:bg-[#f8fafc]'
                                                    }`}
                                            >
                                                <span>{subrole.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="px-3 py-3 text-sm font-semibold text-[#6b7890]">No matching sub roles.</p>
                                )
                            ) : (
                                subjectMattersLoading ? (
                                    <p className="px-3 py-3 text-sm font-semibold text-[#6b7890]">Loading subjects...</p>
                                ) : filteredSubjectMatters.length > 0 ? (
                                    <div className="grid gap-1">
                                        {filteredSubjectMatters.map((subject) => (
                                            <button
                                                key={subject.id}
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({ ...prev, subjectMatterId: subject.id }))
                                                    setSearchSubjectMatter('')
                                                }}
                                                className={`flex min-h-10 items-center justify-between rounded-lg px-3 text-left text-sm font-semibold transition ${formData.subjectMatterId === subject.id
                                                    ? 'bg-[#eef4ff] text-[#2B76F4]'
                                                    : 'text-[#41506a] hover:bg-[#f8fafc]'
                                                    }`}
                                            >
                                                <span>{subject.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="px-3 py-3 text-sm font-semibold text-[#6b7890]">No matching subjects.</p>
                                )
                            )}
                        </div>
                    </div>
                )}

                <div>
                    <label className={labelClass}>Instructions</label>
                    <textarea
                        value={formData.message}
                        onChange={handleChange('message')}
                        placeholder="Add scope, topics, or instructions for this assessment"
                        className="min-h-28 w-full resize-none rounded-xl border border-[#d9e1ec] bg-white px-4 py-3 text-sm font-medium leading-6 text-[#172033] outline-none transition placeholder:text-[#97a4b8] focus:border-[#2B76F4] focus:ring-4 focus:ring-blue-100"
                    />
                </div>

                <div className="flex flex-col gap-3 border-t border-[#edf1f7] pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-[#6b7890]">
                        Required fields: title, clinic, and role.
                    </p>
                    <button
                        type="submit"
                        disabled={createAssessmentMutation.isPending}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2B76F4] px-5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(43,118,244,0.22)] transition hover:bg-[#1f68e8] disabled:cursor-not-allowed disabled:bg-[#9aa8bd] disabled:shadow-none"
                    >
                        <FiSend className="h-4 w-4" />
                        {createAssessmentMutation.isPending ? 'Creating...' : 'Generate Assessment'}
                    </button>
                </div>
            </form>
        </article>
    )
}

export default CreateNewAssesment
