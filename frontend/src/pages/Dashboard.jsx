import React, { useState, useEffect, useCallback } from 'react'
import * as api from '../api'
import { useToast } from '../components/ui/Toast'
import { PageLoader } from '../components/ui/Skeleton'
import DashboardLayout from '../components/layout/DashboardLayout'
import StatCard from '../components/ui/StatCard'
import DoctorProfile from '../components/dashboard/DoctorProfile'
import PatientProfile from '../components/dashboard/PatientProfile'
import AdminSchedule from '../components/dashboard/AdminSchedule'
import Prescriptions from '../components/dashboard/Prescriptions'
import { Users, Stethoscope, Calendar, FileText, Activity, AlertTriangle } from 'lucide-react'

function getRoleKey(role) {
  if (!role) return 'default'
  const r = role.toLowerCase()
  if (r === 'admin' || r === 'hospital admin') return 'admin'
  if (r === 'doctor' || r === 'medical officer') return 'doctor'
  if (r === 'patient') return 'patient'
  return 'default'
}

export default function Dashboard({ user, onLogout, darkMode, onToggleDark }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const { toast } = useToast()

  const refresh = useCallback(async () => {
    try {
      const res = await api.getHospitalData()
      setData(res)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  if (loading) return <PageLoader />

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-surface-50 dark:bg-surface-950 p-6">
        <div className="w-16 h-16 rounded-2xl bg-danger-50 dark:bg-danger-500/10 flex items-center justify-center">
          <AlertTriangle size={28} className="text-danger-500" />
        </div>
        <div className="text-center">
          <p className="text-danger-600 dark:text-danger-400 font-semibold mb-1">Failed to load dashboard</p>
          <p className="text-surface-400 text-sm">{error}</p>
        </div>
        <button
          onClick={() => { setLoading(true); refresh() }}
          className="bg-gradient-purple-blue text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-md shadow-primary-500/20"
        >
          Retry
        </button>
      </div>
    )
  }

  const roleKey = getRoleKey(user.role)
  const isAdmin = roleKey === 'admin'
  const isDoctor = roleKey === 'doctor'
  const isPatient = roleKey === 'patient'

  // Compute stats
  const totalDoctors = data.doctors?.length || 0
  const totalPatients = data.patients?.length || 0
  const totalPrescriptions = data.currentPrescriptions?.length || 0
  const availableDoctors = data.doctors?.filter(d => d.status === 'available').length || 0

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
              <StatCard icon={Stethoscope} label="Total Doctors" value={totalDoctors} color="primary" />
              <StatCard icon={Users} label="Total Patients" value={totalPatients} color="info" />
              <StatCard icon={Activity} label="Available Now" value={availableDoctors} color="success" />
              <StatCard icon={FileText} label="Prescriptions" value={totalPrescriptions} color="warning" />
            </div>

            {/* Admin schedule */}
            {isAdmin && <AdminSchedule toast={toast} />}

            {/* Doctors section */}
            <DoctorProfile doctors={data.doctors} user={user} onRefresh={refresh} toast={toast} />

            {/* Patients section (not for admin) */}
            {!isAdmin && (
              <PatientProfile
                patients={data.patients}
                doctors={data.doctors}
                appointments={data.appointments || []}
                user={user}
                onRefresh={refresh}
                toast={toast}
              />
            )}

            {/* Prescriptions section */}
            <Prescriptions
              prescriptions={data.currentPrescriptions}
              patients={data.patients}
              doctors={data.doctors}
              user={user}
              onRefresh={refresh}
              toast={toast}
            />
          </>
        )

      case 'schedule':
        return <AdminSchedule toast={toast} />

      case 'doctors':
      case 'profile':
      case 'agenda':
        return <DoctorProfile doctors={data.doctors} user={user} onRefresh={refresh} toast={toast} />

      case 'patients':
      case 'appointments':
      case 'book':
        return (
          <PatientProfile
            patients={data.patients}
            doctors={data.doctors}
            appointments={data.appointments || []}
            user={user}
            onRefresh={refresh}
            toast={toast}
          />
        )

      case 'prescriptions':
        return (
          <Prescriptions
            prescriptions={data.currentPrescriptions}
            patients={data.patients}
            doctors={data.doctors}
            user={user}
            onRefresh={refresh}
            toast={toast}
          />
        )

      default:
        return null
    }
  }

  return (
    <DashboardLayout
      user={user}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={onLogout}
      darkMode={darkMode}
      onToggleDark={onToggleDark}
    >
      {renderContent()}
    </DashboardLayout>
  )
}
