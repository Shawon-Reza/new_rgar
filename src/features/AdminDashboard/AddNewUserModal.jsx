import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FiActivity,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiEye,
  FiEyeOff,
  FiHash,
  FiLock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSearch,
  FiUser,
  FiUserPlus,
  FiX,
} from 'react-icons/fi'
import { useMutation, useQuery } from '@tanstack/react-query'
import axiosApi from '../../service/axiosInstance'
import { queryClient } from '../../main'
import { toast } from 'react-toastify'

const fieldLabelClass = 'mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#77849a]'
const inputClass = 'h-11 w-full rounded-xl border border-[#d9e1ec] bg-white px-4 text-sm font-semibold text-[#172033] outline-none transition placeholder:text-[#97a4b8] focus:border-[#2f6ff3] focus:ring-4 focus:ring-blue-100'
const iconInputClass = 'h-11 w-full rounded-xl border border-[#d9e1ec] bg-white py-2 pl-11 pr-4 text-sm font-semibold text-[#172033] outline-none transition placeholder:text-[#97a4b8] focus:border-[#2f6ff3] focus:ring-4 focus:ring-blue-100'

const Field = ({ label, icon: Icon, children }) => (
  <div>
    <label className={fieldLabelClass}>
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </label>
    {children}
  </div>
)

const TextInput = ({ icon: Icon, className = '', ...props }) => (
  <div className="relative">
    {Icon && <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b98ad]" />}
    <input
      {...props}
      className={`${Icon ? iconInputClass : inputClass} ${className}`}
    />
  </div>
)

const Select = ({ value, onChange, options, placeholder = 'Select', leftIcon: Icon }) => (
  <div className="relative">
    {Icon && <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b98ad]" />}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${Icon ? iconInputClass : inputClass} appearance-none pr-11`}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option} value={option}>
          {String(option).replace('_', ' ')}
        </option>
      ))}
    </select>
    <FiChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b98ad]" />
  </div>
)

const Section = ({ title, description, children }) => (
  <section className="rounded-2xl border border-[#e3e9f2] bg-white p-5 shadow-[0_14px_32px_rgba(15,23,42,0.04)]">
    <div className="mb-5">
      <h3 className="text-base font-extrabold text-[#111827]">{title}</h3>
      {description && <p className="mt-1 text-sm font-medium text-[#6b7890]">{description}</p>}
    </div>
    {children}
  </section>
)

const AddNewUserModal = ({
  isOpen,
  onClose,
  onCreated,
  mode = 'create',
  userId = null,
  roles = ['President', 'Manager', 'Doctor', 'Staff', 'jr_staff'],
  clinics = [],
  isLoading = false,
}) => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: '',
    startDate: new Date().toISOString().slice(0, 10),
    employeeId: '',
    knowledgeLevel: '',
    clinics: [],
    clinicIds: [],
    status: 'Active',
    subroleId: null,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loadingUserData, setLoadingUserData] = useState(false)
  const [searchSubrole, setSearchSubrole] = useState('')
  const hasInitializedClinicIds = useRef(false)
  const [subroleNameFromUser, setSubroleNameFromUser] = useState('')
  const subroleRoles = ['Doctor', 'Staff', 'jr_staff', 'Manager']

  const { data: subRolesData, isLoading: isLoadingSubRoles } = useQuery({
    queryKey: ['subRoles', form.clinicIds],
    queryFn: async () => {
      const clinicIdsParam = form.clinicIds.join(',')
      const response = await axiosApi.get(`/api/v1/subroles/?clinic_ids=${clinicIdsParam}`)
      return response.data
    },
    enabled: isOpen && form.clinicIds.length > 0,
  })

  const subRoles = useMemo(() => {
    if (Array.isArray(subRolesData)) return subRolesData
    return subRolesData?.results || subRolesData?.data || []
  }, [subRolesData])

  const filteredSubRoles = useMemo(() => (
    subRoles.filter((subrole) =>
      subrole?.is_active &&
      subrole?.name?.toLowerCase().includes(searchSubrole.toLowerCase())
    )
  ), [searchSubrole, subRoles])

  useEffect(() => {
    if (mode === 'create' && isOpen) {
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: '',
        startDate: new Date().toISOString().slice(0, 10),
        employeeId: '',
        knowledgeLevel: '',
        clinics: [],
        clinicIds: [],
        status: 'Active',
        subroleId: null,
      })
      setSearchSubrole('')
      setSubroleNameFromUser('')
      setShowPassword(false)
    }
  }, [mode, isOpen])

  useEffect(() => {
    if (!hasInitializedClinicIds.current) {
      hasInitializedClinicIds.current = true
      return
    }
    setForm((prev) => ({ ...prev, subroleId: null }))
    setSearchSubrole('')
  }, [form.clinicIds])

  useEffect(() => {
    if (mode !== 'edit') return
    if (subroleRoles.includes(form.role)) return
    if (!form.subroleId) return

    setForm((prev) => ({ ...prev, subroleId: null }))
    setSearchSubrole('')
  }, [form.role, form.subroleId, mode])

  useEffect(() => {
    if (mode === 'edit' && userId && isOpen) {
      setLoadingUserData(true)
      axiosApi.get(`/api/v1/users/${userId}/`)
        .then((response) => {
          const userData = response.data
          let normalizedClinics = []
          let normalizedClinicIds = []

          if (Array.isArray(userData.clinics)) {
            normalizedClinics = userData.clinics.map((clinic) => {
              if (typeof clinic === 'object' && clinic !== null) {
                return clinic.name || clinic.title || clinic.id || ''
              }
              return clinic
            }).filter(Boolean)

            normalizedClinicIds = userData.clinics.map((clinic) => {
              if (typeof clinic === 'object' && clinic !== null) {
                return clinic.id
              }
              return clinics.find((item) => (item.name || item) === clinic)?.id
            }).filter(Boolean)
          } else if (userData.clinic_ids) {
            normalizedClinicIds = userData.clinic_ids
          }

          const firstSubroleName = Array.isArray(userData.subroles) && userData.subroles.length > 0
            ? userData.subroles[0]
            : ''
          setSubroleNameFromUser(firstSubroleName)
          const subroleId = firstSubroleName
            ? subRoles.find((subrole) => subrole.name === firstSubroleName)?.id || null
            : null

          setForm({
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            password: '',
            role: userData.role
              ? userData.role === 'jr_staff'
                ? 'jr_staff'
                : userData.role.charAt(0).toUpperCase() + userData.role.slice(1)
              : '',
            startDate: userData.joining_date || new Date().toISOString().slice(0, 10),
            employeeId: userData.employee_id || '',
            knowledgeLevel: String(userData.knowledge_level || ''),
            clinics: normalizedClinics,
            clinicIds: normalizedClinicIds,
            status: userData.is_active ? 'Active' : 'Inactive',
            subroleId,
          })
          setLoadingUserData(false)
        })
        .catch(() => {
          toast.error('Failed to load user data.')
          setLoadingUserData(false)
          onClose()
        })
    }
  }, [clinics, isOpen, mode, onClose, subRoles, userId])

  useEffect(() => {
    if (!subroleNameFromUser || form.subroleId || !Array.isArray(subRoles)) return
    const matched = subRoles.find((subrole) => subrole.name === subroleNameFromUser)
    if (matched?.id) {
      setForm((prev) => ({ ...prev, subroleId: matched.id }))
    }
  }, [form.subroleId, subRoles, subroleNameFromUser])

  const createUserMutation = useMutation({
    mutationFn: async (payload) => {
      if (mode === 'edit' && userId) {
        const response = await axiosApi.patch(`/api/v1/users/${userId}/update/`, payload)
        return response.data
      }
      const response = await axiosApi.post('/api/v1/users/create/', payload)
      return response.data
    },
    onSuccess: (data) => {
      onCreated && onCreated(data)
      onClose && onClose()
      queryClient.invalidateQueries({ queryKey: ['userList'] })
      toast.success(`User ${mode === 'edit' ? 'updated' : 'created'} successfully.`)
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || `Failed to ${mode === 'edit' ? 'update' : 'create'} user.`)
    },
  })

  const canSubmit = useMemo(() => {
    const baseValidation =
      form.firstName &&
      form.lastName &&
      /@/.test(form.email) &&
      form.role &&
      form.employeeId &&
      form.status

    if (mode === 'create') {
      return baseValidation && form.password
    }

    return baseValidation
  }, [form, mode])

  const update = (key) => (eOrValue) => {
    const value = eOrValue?.target ? eOrValue.target.value : eOrValue
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const getClinicIdByName = (clinicName) => {
    if (!clinicName || typeof clinicName !== 'string') return undefined
    return clinics.find((clinic) => (clinic.name || clinic).toLowerCase() === clinicName.toLowerCase())?.id
  }

  const getClinicName = (clinic) => clinic?.name || clinic

  const getClinicId = (clinic) => {
    if (clinic?.id) return clinic.id
    const clinicName = getClinicName(clinic)
    return getClinicIdByName(clinicName)
  }

  const isClinicSelected = (clinic) => {
    const clinicId = getClinicId(clinic)
    if (clinicId) return form.clinicIds.includes(clinicId)
    const clinicName = getClinicName(clinic)
    return form.clinics.includes(clinicName)
  }

  useEffect(() => {
    if (!form.clinics.length || form.clinicIds.length) return
    const derivedIds = form.clinics
      .map((clinic) => (typeof clinic === 'object' && clinic !== null ? clinic.id : getClinicIdByName(clinic)))
      .filter(Boolean)
    if (derivedIds.length) {
      setForm((prev) => ({ ...prev, clinicIds: derivedIds }))
    }
  }, [clinics, form.clinics, form.clinicIds.length])

  const toggleClinic = (clinic) => {
    setForm((prev) => {
      const clinicName = getClinicName(clinic)
      const clinicId = getClinicId(clinic)
      const hasClinic = isClinicSelected(clinic)
      const newClinics = hasClinic
        ? prev.clinics.filter((item) => item !== clinicName)
        : clinicName
          ? [...prev.clinics, clinicName]
          : prev.clinics
      const newClinicIds = hasClinic
        ? clinicId
          ? prev.clinicIds.filter((id) => id !== clinicId)
          : prev.clinicIds
        : clinicId
          ? [...prev.clinicIds, clinicId]
          : prev.clinicIds
      return { ...prev, clinics: newClinics, clinicIds: newClinicIds }
    })
  }

  const handleRemoveClinic = (clinicName) => {
    setForm((prev) => {
      const clinicIndex = prev.clinics.indexOf(clinicName)
      const clinicId = getClinicIdByName(clinicName)
      const newClinics = prev.clinics.filter((clinic) => clinic !== clinicName)
      const newClinicIds = clinicId
        ? prev.clinicIds.filter((id) => id !== clinicId)
        : clinicIndex !== -1
          ? prev.clinicIds.filter((_, index) => index !== clinicIndex)
          : prev.clinicIds
      return { ...prev, clinics: newClinics, clinicIds: newClinicIds }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return

    const payload = {
      email: form.email,
      first_name: form.firstName,
      last_name: form.lastName,
      role: form.role.toLowerCase(),
      is_active: form.status === 'Active',
      clinic_ids: form.clinicIds,
      picture: null,
      employee_id: form.employeeId,
      knowledge_level: parseInt(form.knowledgeLevel) || 0,
      joining_date: form.startDate,
      phone: form.phone,
      subrole_ids: form.subroleId ? [form.subroleId] : [],
    }

    if (form.password) {
      payload.password = form.password
    }

    createUserMutation.mutate(payload)
  }

  if (!isOpen) return null

  const selectedSubrole = subRoles.find((subrole) => subrole.id === form.subroleId)
  const submitLabel = loadingUserData
    ? 'Loading...'
    : createUserMutation.isPending
      ? mode === 'edit' ? 'Updating...' : 'Adding...'
      : mode === 'edit' ? 'Update User' : 'Add User'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/45 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-user-title"
    >
      <div className="flex max-h-[calc(100vh-40px)] w-full max-w-5xl flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#edf1f7] px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eef4ff] text-[#2f6ff3]">
              <FiUserPlus className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#2f6ff3]">User Access</p>
              <h2 id="add-user-title" className="mt-1 text-xl font-extrabold text-[#111827] sm:text-2xl">
                {mode === 'edit' ? 'Update User' : 'Add New User'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-xl border border-[#d9e1ec] bg-white text-[#6b7890] transition hover:border-[#2f6ff3] hover:text-[#245fd1]"
            aria-label="Close"
            type="button"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8fafc] px-5 py-5 sm:px-6">
            <div className="grid gap-5">
              <Section title="Profile" description="Basic details used across the dashboard.">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="First Name" icon={FiUser}>
                    <TextInput
                      icon={FiUser}
                      type="text"
                      value={form.firstName}
                      onChange={update('firstName')}
                      placeholder="First name"
                      required
                      maxLength={20}
                    />
                  </Field>

                  <Field label="Last Name" icon={FiUser}>
                    <TextInput
                      icon={FiUser}
                      type="text"
                      value={form.lastName}
                      onChange={update('lastName')}
                      placeholder="Last name"
                      required
                    />
                  </Field>

                  <Field label="Email Address" icon={FiMail}>
                    <TextInput
                      icon={FiMail}
                      type="email"
                      value={form.email}
                      onChange={update('email')}
                      placeholder="name@example.com"
                      required
                    />
                  </Field>

                  <Field label="Phone Number" icon={FiPhone}>
                    <TextInput
                      icon={FiPhone}
                      type="tel"
                      value={form.phone}
                      onChange={update('phone')}
                      placeholder="+1 234 567 890"
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Access" description="Set the role, account state, and employee metadata.">
                <div className="grid gap-4 md:grid-cols-2">
                  {mode !== 'edit' && (
                    <Field label="Password" icon={FiLock}>
                      <div className="relative">
                        <FiLock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b98ad]" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={form.password}
                          onChange={update('password')}
                          className="h-11 w-full rounded-xl border border-[#d9e1ec] bg-white py-2 pl-11 pr-11 text-sm font-semibold text-[#172033] outline-none transition placeholder:text-[#97a4b8] focus:border-[#2f6ff3] focus:ring-4 focus:ring-blue-100"
                          placeholder="Enter password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[#6b7890] transition hover:bg-[#eef4ff] hover:text-[#245fd1]"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                        </button>
                      </div>
                    </Field>
                  )}

                  <Field label="Role" icon={FiBriefcase}>
                    <Select
                      value={form.role}
                      onChange={update('role')}
                      options={roles}
                      leftIcon={FiBriefcase}
                      placeholder="Select role"
                    />
                  </Field>

                  <Field label="Status" icon={FiCheckCircle}>
                    <Select
                      value={form.status}
                      onChange={update('status')}
                      options={['Active', 'Inactive']}
                      leftIcon={FiCheckCircle}
                      placeholder="Select status"
                    />
                  </Field>

                  <Field label="Start Date" icon={FiCalendar}>
                    <TextInput
                      icon={FiCalendar}
                      type="date"
                      value={form.startDate}
                      onChange={update('startDate')}
                    />
                  </Field>

                  <Field label="Employee ID" icon={FiHash}>
                    <TextInput
                      icon={FiHash}
                      type="text"
                      value={form.employeeId}
                      onChange={update('employeeId')}
                      placeholder="00125"
                      required
                    />
                  </Field>

                  <Field label="Knowledge Level" icon={FiActivity}>
                    <TextInput
                      icon={FiActivity}
                      type="number"
                      min="0"
                      max="10"
                      value={form.knowledgeLevel}
                      onChange={update('knowledgeLevel')}
                      placeholder="0-10"
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Clinic Assignment" description="Choose one or more clinics and an optional specialization.">
                <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <label className={fieldLabelClass}>
                      <FiMapPin className="h-4 w-4" />
                      Clinics
                    </label>
                    <div className="rounded-2xl border border-[#d9e1ec] bg-[#f8fafc] p-3">
                      <div className="mb-3 flex min-h-11 flex-wrap items-center gap-2 rounded-xl border border-[#e3e9f2] bg-white px-3 py-2">
                        {form.clinics.length ? (
                          form.clinics.map((clinic) => (
                            <span key={clinic} className="inline-flex items-center gap-2 rounded-full border border-[#bad0ff] bg-[#eef4ff] px-3 py-1.5 text-xs font-extrabold text-[#245fd1]">
                              {clinic}
                              <button
                                type="button"
                                onClick={() => handleRemoveClinic(clinic)}
                                aria-label={`Remove ${clinic}`}
                                className="text-[#6b7890] transition hover:text-[#245fd1]"
                              >
                                <FiX className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-sm font-semibold text-[#8b98ad]">No clinic selected</span>
                        )}
                      </div>

                      <div className="max-h-36 overflow-y-auto rounded-xl bg-white p-2">
                        {isLoading ? (
                          <p className="px-3 py-3 text-sm font-semibold text-[#6b7890]">Loading clinics...</p>
                        ) : clinics.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {clinics.map((clinic) => {
                              const clinicName = getClinicName(clinic)
                              const selected = isClinicSelected(clinic)
                              return (
                                <button
                                  type="button"
                                  key={clinic.id || clinicName}
                                  onClick={() => toggleClinic(clinic)}
                                  className={`rounded-full border px-3 py-1.5 text-xs font-extrabold transition ${selected
                                    ? 'border-[#2f6ff3] bg-[#eef4ff] text-[#245fd1]'
                                    : 'border-[#d9e1ec] bg-white text-[#41506a] hover:border-[#2f6ff3] hover:text-[#245fd1]'
                                    }`}
                                >
                                  {clinicName}
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="px-3 py-3 text-sm font-semibold text-[#6b7890]">No clinics available.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {subroleRoles.includes(form.role) && form.clinicIds.length > 0 ? (
                    <div>
                      <label className={fieldLabelClass}>
                        <FiBriefcase className="h-4 w-4" />
                        Sub Role
                      </label>
                      <div className="rounded-2xl border border-[#d9e1ec] bg-[#f8fafc] p-3">
                        <div className="relative">
                          <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b98ad]" />
                          <input
                            type="text"
                            placeholder="Search sub roles"
                            value={searchSubrole}
                            onChange={(e) => setSearchSubrole(e.target.value)}
                            className={iconInputClass}
                          />
                        </div>

                        {form.subroleId && (
                          <div className="mt-3 flex min-h-10 items-center justify-between gap-3 rounded-xl border border-[#bad0ff] bg-white px-3 text-sm font-extrabold text-[#245fd1]">
                            <span className="line-clamp-1">{selectedSubrole?.name || 'Selected'}</span>
                            <button
                              type="button"
                              onClick={() => setForm((prev) => ({ ...prev, subroleId: null }))}
                              className="grid h-7 w-7 place-items-center rounded-lg text-[#6b7890] transition hover:bg-[#eef4ff] hover:text-[#245fd1]"
                              aria-label="Clear sub role"
                            >
                              <FiX className="h-4 w-4" />
                            </button>
                          </div>
                        )}

                        <div className="mt-3 max-h-36 overflow-y-auto rounded-xl bg-white p-2">
                          {isLoadingSubRoles ? (
                            <p className="px-3 py-3 text-sm font-semibold text-[#6b7890]">Loading sub roles...</p>
                          ) : filteredSubRoles.length > 0 ? (
                            <div className="grid gap-1">
                              {filteredSubRoles.map((subrole) => (
                                <button
                                  key={subrole.id}
                                  type="button"
                                  onClick={() => {
                                    setForm((prev) => ({ ...prev, subroleId: subrole.id }))
                                    setSearchSubrole('')
                                  }}
                                  className={`flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm font-bold transition ${form.subroleId === subrole.id
                                    ? 'bg-[#eef4ff] text-[#245fd1]'
                                    : 'text-[#41506a] hover:bg-[#f8fafc]'
                                    }`}
                                >
                                  {subrole.name}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="px-3 py-3 text-sm font-semibold text-[#6b7890]">No sub roles found.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#d9e1ec] bg-[#f8fafc] p-5">
                      <p className="text-sm font-extrabold text-[#172033]">Sub role</p>
                      <p className="mt-2 text-sm font-medium leading-6 text-[#6b7890]">
                        Select a clinic and an eligible role to assign a specialization.
                      </p>
                    </div>
                  )}
                </div>
              </Section>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#edf1f7] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm font-semibold text-[#6b7890]">
              Required: name, email, role, employee ID{mode === 'create' ? ', and password' : ''}.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="h-11 rounded-xl border border-[#d9e1ec] bg-white px-5 text-sm font-extrabold text-[#41506a] transition hover:border-[#ef4444] hover:text-[#ef4444]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit || createUserMutation.isPending || loadingUserData}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1f6fff] px-5 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(31,111,255,0.22)] transition hover:bg-[#155ee8] disabled:cursor-not-allowed disabled:bg-[#9aa8bd] disabled:shadow-none"
              >
                <FiUserPlus className="h-4 w-4" />
                {submitLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddNewUserModal
