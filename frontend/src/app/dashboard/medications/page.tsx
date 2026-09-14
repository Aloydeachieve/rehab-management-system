'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUser } from '@/lib/auth';
import { useState } from 'react';

interface PrescriptionItem {
  id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  instructions: string | null;
}

interface Patient {
  id: number;
  name: string;
  patient_number: string;
}

interface MedicationAdministration {
  id: number;
  patient_id: number;
  prescription_item_id: number;
  scheduled_at: string;
  administered_at: string | null;
  status: string;
  notes: string | null;
  patient: Patient;
  prescription_item: PrescriptionItem;
  administering_staff?: { name: string };
}

export default function MedicationsWorkspacePage() {
  const { data: currentUser } = useUser();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // State for the action dialog
  const [activeAdminId, setActiveAdminId] = useState<number | null>(null);
  const [actionStatus, setActionStatus] = useState<string>('given');
  const [actionNotes, setActionNotes] = useState<string>('');

  const isStaffOrAdmin = currentUser?.roles.includes('admin') || currentUser?.roles.includes('receptionist');

  // Fetch administrations across all patients for the selected date
  const { data: administrations, isLoading, isError } = useQuery<MedicationAdministration[]>({
    queryKey: ['medications-schedule', selectedDate],
    queryFn: async () => (await api.get(`/medication-administrations?date=${selectedDate}`)).data,
  });

  // Mutation to update medication status
  const updateMedicationStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes: string }) => {
      return api.patch(`/medication-administrations/${id}`, { status, notes });
    },
    onSuccess: () => {
      setActiveAdminId(null);
      setActionNotes('');
      queryClient.invalidateQueries({ queryKey: ['medications-schedule', selectedDate] });
    },
  });

  const handleOpenAction = (id: number, status: string) => {
    setActiveAdminId(id);
    setActionStatus(status);
  };

  const handleConfirmAction = () => {
    if (activeAdminId) {
      updateMedicationStatus.mutate({
        id: activeAdminId,
        status: actionStatus,
        notes: actionNotes,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 bg-white border border-zinc-200 rounded-2xl shadow-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-teal-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-800">
        Failed to load medication schedules. Make sure you have authorized access.
      </div>
    );
  }

  return (
    <div className="space-y-6 text-brand-charcoal-light">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-6 rounded-2xl border border-brand-cream-dark/60 shadow-sm">
        <div>
          <h2 className="font-serif text-xl font-bold text-brand-charcoal">Medication Administration Workspace</h2>
          <p className="text-xs text-brand-muted mt-1.5 font-medium">
            Rehabilitation eMAR system &bull; Administer doses prescribed under clinician oversight.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">Schedule Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-2 text-sm text-brand-charcoal-light bg-white focus:border-brand-primary focus:outline-none transition-all cursor-pointer"
          />
        </div>
      </div>

      {/* Main Schedule Workspace */}
      <div className="bg-white border border-brand-cream-dark/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-brand-cream-dark/45 bg-brand-cream/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-bold text-brand-primary uppercase tracking-wider">
                Daily Scheduled Administrations ({administrations?.length ?? 0})
              </h3>
              <p className="text-xs text-brand-muted mt-1 font-medium">
                Staff record administration state updates according to scheduled prescription times.
              </p>
            </div>
            <div className="bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-xl p-3 text-xs font-bold max-w-sm leading-relaxed shadow-sm">
              ℹ️ Staff may administer medication under active doctor prescriptions, they cannot prescribe.
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-brand-charcoal-light border-collapse">
            <thead>
              <tr className="bg-brand-cream/45 border-b border-brand-cream-dark/45 text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                <th className="py-3 px-6">Patient</th>
                <th className="py-3 px-6">Medication / Dosage</th>
                <th className="py-3 px-6">Scheduled Time</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Admin Logs</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream-dark/30 bg-white">
              {administrations?.map((admin) => {
                const scheduledTime = new Date(admin.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const isScheduled = admin.status === 'scheduled';
                return (
                  <tr key={admin.id} className="hover:bg-brand-cream/10 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-brand-charcoal">{admin.patient.name}</div>
                      <div className="text-[10px] text-brand-muted mt-1 font-bold">{admin.patient.patient_number}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-brand-primary">{admin.prescription_item.medication_name} ({admin.prescription_item.dosage})</div>
                      <div className="text-xs text-brand-muted font-medium mt-1">{admin.prescription_item.frequency}</div>
                      {admin.prescription_item.instructions && (
                        <div className="text-[10px] italic text-brand-muted mt-1 font-medium">Instructions: {admin.prescription_item.instructions}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 font-semibold text-brand-charcoal">
                      {scheduledTime}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ring-1 ring-inset ${
                        admin.status === 'scheduled'
                          ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
                          : admin.status === 'given'
                          ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/20'
                          : admin.status === 'missed'
                          ? 'bg-rose-50 text-rose-800 ring-rose-600/20'
                          : admin.status === 'refused'
                          ? 'bg-purple-50 text-purple-800 ring-purple-600/20'
                          : 'bg-brand-cream text-brand-charcoal-light ring-brand-cream-dark/45'
                      }`}>
                        {admin.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs space-y-1 font-medium text-brand-charcoal-light">
                      {admin.administering_staff && (
                        <div>
                          Logged by: <strong className="text-brand-charcoal">{admin.administering_staff.name}</strong>
                          {admin.administered_at && (
                            <span className="text-[10px] text-brand-muted block font-medium mt-0.5">
                              at {new Date(admin.administered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      )}
                      {admin.notes && (
                        <div className="text-[10px] text-brand-charcoal-light bg-brand-cream-light border border-brand-cream-dark/60 p-2 rounded-xl italic font-medium leading-relaxed mt-1">
                          Notes: {admin.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {isScheduled && isStaffOrAdmin ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAction(admin.id, 'given')}
                            className="rounded-full bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
                          >
                            Given
                          </button>
                          <button
                            onClick={() => handleOpenAction(admin.id, 'missed')}
                            className="rounded-full bg-rose-50 border border-rose-200/50 text-rose-700 hover:bg-rose-100/60 px-3 py-1.5 text-xs font-bold shadow-sm transition-colors cursor-pointer"
                          >
                            Missed
                          </button>
                          <button
                            onClick={() => handleOpenAction(admin.id, 'refused')}
                            className="rounded-full bg-purple-50 border border-purple-200/50 text-purple-700 hover:bg-purple-100/60 px-3 py-1.5 text-xs font-bold shadow-sm transition-colors cursor-pointer"
                          >
                            Refused
                          </button>
                          <button
                            onClick={() => handleOpenAction(admin.id, 'cancelled')}
                            className="rounded-full bg-white border border-brand-cream-dark/60 text-brand-charcoal hover:bg-brand-cream/35 px-3 py-1.5 text-xs font-bold shadow-sm transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-brand-muted font-medium">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {(!administrations || administrations.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-12 px-6 text-center text-sm text-brand-muted font-medium italic bg-white">
                    No medication administrations scheduled for the selected date.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Actions Dialog Modal */}
      {activeAdminId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/45 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-brand-cream-dark/60 rounded-2xl p-6 shadow-xl space-y-5 text-brand-charcoal-light">
            <div>
              <h3 className="font-serif text-lg font-bold text-brand-charcoal capitalize">
                Confirm Medication State: {actionStatus}
              </h3>
              <p className="text-xs text-brand-muted mt-1.5 font-medium">
                Record logs for the selected scheduled medication dose.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">
                {actionStatus === 'given' ? 'Optional Notes' : 'Reason / Findings Notes (Required) *'}
              </label>
              <textarea
                rows={3}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder={actionStatus === 'given' ? 'Enter any logging note...' : 'Patient refused due to feeling unwell / missed dose parameter detail...'}
                className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2.5 border-t border-brand-cream-dark/45">
              <button
                onClick={() => {
                  setActiveAdminId(null);
                  setActionNotes('');
                }}
                className="rounded-full bg-white border border-brand-cream-dark/60 hover:bg-brand-cream/35 px-5 py-2.5 text-xs font-bold text-brand-charcoal shadow-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={updateMedicationStatus.isPending || (actionStatus !== 'given' && !actionNotes)}
                className="rounded-full bg-brand-accent hover:bg-brand-accent-dark px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-accent/20 transition-all disabled:bg-brand-accent/50 cursor-pointer"
              >
                {updateMedicationStatus.isPending ? 'Saving...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
