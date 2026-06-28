import React, { useState, useEffect } from 'react'
import * as api from '../../api'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'
import { FileText, Plus, Loader2, Pill, User, Stethoscope, Edit2, Trash2 } from 'lucide-react'

export default function Prescriptions({ prescriptions, patients, doctors, user, onRefresh, toast }) {
  const [showForm, setShowForm] = useState(false)
  const [editingRx, setEditingRx] = useState(null)
  const [form, setForm] = useState({ patientId: '', prescriptionId: '', medication: '', issuedBy: '' })
  const [busy, setBusy] = useState(false)
  const [localPrescriptions, setLocalPrescriptions] = useState([])

  const isDoctor = user.role === 'doctor' || user.role === 'Medical Officer'
  const isPatient = user.role === 'patient'

  useEffect(() => {
    setLocalPrescriptions(prescriptions)
  }, [prescriptions])

  useEffect(() => {
    if (editingRx) {
      setForm({
        patientId: editingRx.patientId,
        prescriptionId: editingRx.prescriptionId,
        medication: editingRx.medication,
        issuedBy: editingRx.issuedBy
      })
      setShowForm(true)
    } else {
      setForm({ patientId: '', prescriptionId: '', medication: '', issuedBy: '' })
    }
  }, [editingRx])

  let displayPrescriptions = localPrescriptions
  if (isPatient) displayPrescriptions = localPrescriptions.filter(p => p.patientId === user.referenceId)
  if (isDoctor) displayPrescriptions = localPrescriptions.filter(p => p.issuedBy === user.referenceId)

  let actionablePatients = patients
  if (isDoctor) actionablePatients = patients.filter(p => p.assignedDoctorId === user.referenceId)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      if (editingRx) {
        await api.updatePrescription(editingRx._id, form.medication)
        toast('Prescription updated')
      } else {
        await api.createPrescription(form.prescriptionId, form.patientId, form.medication)
        toast('Prescription created')
      }
      setForm({ patientId: '', prescriptionId: '', medication: '', issuedBy: '' })
      setEditingRx(null)
      setShowForm(false)
      await onRefresh()
    } catch (err) {
      toast(err.message, false)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (rx) => {
    if (!window.confirm("Are you sure you want to delete this prescription?")) return
    try {
      setLocalPrescriptions(prev => prev.filter(item => item._id !== rx._id))
      await api.deletePrescription(rx._id)
      toast('Prescription deleted')
      await onRefresh()
    } catch (err) {
      toast(err.message, false)
      await onRefresh()
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
            onClick={() => {
              if (showForm) {
                setEditingRx(null)
                setShowForm(false)
              } else {
                setShowForm(true)
              }
            }}
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

      {/* Prescription Form */}
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
                  disabled={!!editingRx}
                  onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))}
                  className="w-full bg-white dark:bg-dark-input border border-surface-200 dark:border-dark-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-surface-900 dark:text-surface-100 input-ring appearance-none disabled:opacity-50"
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
                  disabled={!!editingRx}
                  onChange={e => setForm(f => ({ ...f, issuedBy: e.target.value }))}
                  className="w-full bg-white dark:bg-dark-input border border-surface-200 dark:border-dark-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-surface-900 dark:text-surface-100 input-ring appearance-none disabled:opacity-50"
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
                disabled={!!editingRx}
                value={form.prescriptionId}
                onChange={e => setForm(f => ({ ...f, prescriptionId: e.target.value }))}
                className="w-full bg-white dark:bg-dark-input border border-surface-200 dark:border-dark-border rounded-xl px-4 py-2.5 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 input-ring disabled:opacity-50"
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

            <div className="sm:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 bg-gradient-purple-blue text-white font-semibold text-sm px-6 py-2.5 rounded-xl hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all shadow-md shadow-primary-500/20"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : editingRx ? <Edit2 size={14} /> : <Plus size={14} />}
                {busy ? 'Saving...' : editingRx ? 'Update Prescription' : 'Create Prescription'}
              </button>
              {editingRx && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingRx(null)
                    setShowForm(false)
                  }}
                  className="bg-surface-200 text-surface-700 font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-surface-300 transition-all"
                >
                  Cancel
                </button>
              )}
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
              <div className="flex items-center gap-3">
                <Badge variant={rx.status?.replace(/ /g, '_') || 'pending_at_pharmacy'} size="sm">
                  {(rx.status || '').replace(/_/g, ' ')}
                </Badge>
                {isDoctor && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingRx(rx)}
                      className="text-xs bg-surface-100 dark:bg-surface-800 hover:bg-primary-100 dark:hover:bg-primary-500/20 hover:text-primary-600 dark:hover:text-primary-400 text-surface-600 dark:text-surface-300 p-1.5 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(rx)}
                      className="text-xs bg-surface-100 dark:bg-surface-800 hover:bg-danger-100 dark:hover:bg-danger-500/20 hover:text-danger-600 dark:hover:text-danger-400 text-surface-600 dark:text-surface-300 p-1.5 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
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
