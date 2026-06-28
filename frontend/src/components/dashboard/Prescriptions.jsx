import React, { useState } from 'react'
import * as api from '../../api'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import { FileText, Plus, Loader2, Pill, User, Stethoscope } from 'lucide-react'

export default function Prescriptions({ prescriptions, patients, doctors, user, onRefresh, toast }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ patientId: '', prescriptionId: '', medication: '', issuedBy: '' })
  const [busy, setBusy] = useState(false)

  const isDoctor = user.role === 'doctor' || user.role === 'Medical Officer'
  const isPatient = user.role === 'patient'

  let displayPrescriptions = prescriptions
  if (isPatient) displayPrescriptions = prescriptions.filter(p => p.patientId === user.referenceId)
  if (isDoctor) displayPrescriptions = prescriptions.filter(p => p.issuedBy === user.referenceId)

  let actionablePatients = patients
  if (isDoctor) actionablePatients = patients.filter(p => p.assignedDoctorId === user.referenceId)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api.createPrescription(form.patientId, form.prescriptionId, form.medication, form.issuedBy)
      toast('Prescription created')
      setForm({ patientId: '', prescriptionId: '', medication: '', issuedBy: '' })
      setShowForm(false)
      await onRefresh()
    } catch (err) {
      toast(err.message, false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mb-8 animate-fade-in-up">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50 flex items-center gap-2">
          <FileText size={20} className="text-primary-500" />
          {isPatient ? 'My Active Prescriptions' : 'Prescriptions'}
          <span className="text-surface-400 font-normal text-sm">({displayPrescriptions.length})</span>
        </h2>
        {isDoctor && (
          <button
            onClick={() => setShowForm(!showForm)}
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl transition-all duration-200 ${
              showForm
                ? 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200'
                : 'bg-gradient-purple-blue text-white hover:opacity-90 shadow-md shadow-primary-500/20'
            }`}
          >
            {showForm ? 'Cancel' : <><Plus size={14} /> New Prescription</>}
          </button>
        )}
      </div>

      {/* New Prescription Form */}
      {showForm && isDoctor && (
        <Card className="mb-4 !bg-primary-50/50 dark:!bg-primary-500/5 !border-primary-200/40 dark:!border-primary-500/10 animate-slide-down">
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5">Patient</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <select
                  value={form.patientId}
                  required
                  onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}
                  className="w-full bg-white dark:bg-dark-input border border-surface-200 dark:border-dark-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-surface-900 dark:text-surface-100 input-ring appearance-none"
                >
                  <option value="">Select Patient</option>
                  {actionablePatients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5">Issuing Doctor</label>
              <div className="relative">
                <Stethoscope size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <select
                  value={form.issuedBy}
                  required
                  onChange={e => setForm(f => ({ ...f, issuedBy: e.target.value }))}
                  className="w-full bg-white dark:bg-dark-input border border-surface-200 dark:border-dark-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-surface-900 dark:text-surface-100 input-ring appearance-none"
                >
                  <option value="">Select Doctor</option>
                  {doctors.filter(d => d.id === user.referenceId).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5">Prescription ID</label>
              <input
                type="text"
                placeholder="e.g. RX-100"
                required
                value={form.prescriptionId}
                onChange={e => setForm(f => ({ ...f, prescriptionId: e.target.value }))}
                className="w-full bg-white dark:bg-dark-input border border-surface-200 dark:border-dark-border rounded-xl px-4 py-2.5 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 input-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1.5">Medication</label>
              <div className="relative">
                <Pill size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                  type="text"
                  placeholder="e.g. Amoxicillin 250mg"
                  required
                  value={form.medication}
                  onChange={e => setForm(f => ({ ...f, medication: e.target.value }))}
                  className="w-full bg-white dark:bg-dark-input border border-surface-200 dark:border-dark-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 input-ring"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 bg-gradient-purple-blue text-white font-semibold text-sm px-6 py-2.5 rounded-xl hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all shadow-md shadow-primary-500/20"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {busy ? 'Creating...' : 'Create Prescription'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Prescription cards */}
      <div className="grid gap-3">
        {displayPrescriptions.map(rx => (
          <Card key={rx.prescriptionId} className="!p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-warning-50 dark:bg-warning-500/10 flex items-center justify-center text-warning-600 dark:text-warning-400">
                  <Pill size={16} />
                </div>
                <div>
                  <p className="font-semibold text-surface-900 dark:text-surface-100 text-sm">{rx.medication}</p>
                  <p className="text-surface-400 text-xs mt-0.5">{rx.prescriptionId} · Patient: {rx.patientId} · By: {rx.issuedBy}</p>
                </div>
              </div>
              <Badge variant={rx.status?.replace(/ /g, '_') || 'pending_at_pharmacy'} size="sm">
                {(rx.status || '').replace(/_/g, ' ')}
              </Badge>
            </div>
          </Card>
        ))}
        {displayPrescriptions.length === 0 && (
          <EmptyState
            icon="prescriptions"
            title="No prescriptions found"
            description={isDoctor ? "Create a prescription using the button above." : "No prescriptions have been issued yet."}
          />
        )}
      </div>
    </section>
  )
}
