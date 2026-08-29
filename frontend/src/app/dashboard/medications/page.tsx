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
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Medication Administration Workspace</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Rehabilitation eMAR system &bull; Administer doses prescribed under clinician oversight.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase">Schedule Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm bg-white focus:border-teal-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Main Schedule Workspace */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="text-sm font-bold text-teal-700 uppercase tracking-wider">
                Daily Scheduled Administrations ({administrations?.length ?? 0})
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Staff record administration state updates according to scheduled prescription times.
              </p>
            </div>
            <div className="bg-teal-50 border border-teal-600/10 text-teal-800 rounded-lg p-2 text-xs font-medium max-w-sm">
              ℹ️ Staff may administer medication under active doctor prescriptions, they cannot prescribe.
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600 border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-6">Patient</th>
                <th className="py-3 px-6">Medication / Dosage</th>
                <th className="py-3 px-6">Scheduled Time</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Admin Logs</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {administrations?.map((admin) => {
                const scheduledTime = new Date(admin.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const isScheduled = admin.status === 'scheduled';
                return (
                  <tr key={admin.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-zinc-800">{admin.patient.name}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">{admin.patient.patient_number}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-teal-700">{admin.prescription_item.medication_name} ({admin.prescription_item.dosage})</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{admin.prescription_item.frequency}</div>
                      {admin.prescription_item.instructions && (
                        <div className="text-[10px] italic text-zinc-400 mt-1">Instructions: {admin.prescription_item.instructions}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 font-semibold text-zinc-700">
                      {scheduledTime}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                        admin.status === 'scheduled'
                          ? 'bg-amber-50 text-amber-700 ring-amber-600/10'
                          : admin.status === 'given'
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10'
                          : admin.status === 'missed'
                          ? 'bg-rose-50 text-rose-700 ring-rose-600/10'
                          : admin.status === 'refused'
                          ? 'bg-purple-50 text-purple-700 ring-purple-600/10'
                          : 'bg-zinc-50 text-zinc-600 ring-zinc-500/10'
                      }`}>
                        {admin.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs space-y-1">
                      {admin.administering_staff && (
                        <div>
                          Logged by: <strong>{admin.administering_staff.name}</strong>
                          {admin.administered_at && (
                            <span className="text-[10px] text-zinc-400 block">
                              at {new Date(admin.administered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      )}
                      {admin.notes && (
                        <div className="text-[10px] text-zinc-500 bg-zinc-50 border border-zinc-100 p-1 rounded italic">
                          Notes: {admin.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {isScheduled && isStaffOrAdmin ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAction(admin.id, 'given')}
                            className="rounded-full bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition-colors"
                          >
                            Given
                          </button>
                          <button
                            onClick={() => handleOpenAction(admin.id, 'missed')}
                            className="rounded-full bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 px-2.5 py-1 text-xs font-semibold shadow-sm transition-colors"
                          >
                            Missed
                          </button>
                          <button
                            onClick={() => handleOpenAction(admin.id, 'refused')}
                            className="rounded-full bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 px-2.5 py-1 text-xs font-semibold shadow-sm transition-colors"
                          >
                            Refused
                          </button>
                          <button
                            onClick={() => handleOpenAction(admin.id, 'cancelled')}
                            className="rounded-full bg-zinc-100 border border-zinc-300 text-zinc-700 hover:bg-zinc-200 px-2.5 py-1 text-xs font-semibold shadow-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {(!administrations || administrations.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-12 px-6 text-center text-sm text-zinc-400 italic">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-md font-bold text-zinc-950 capitalize">
                Confirm Medication State: {actionStatus}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Record logs for the selected scheduled medication dose.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-500 uppercase">
                {actionStatus === 'given' ? 'Optional Notes' : 'Reason / Findings Notes (Required)'}
              </label>
              <textarea
                rows={3}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder={actionStatus === 'given' ? 'Enter any logging note...' : 'Patient refused due to feeling unwell / missed dose parameter detail...'}
                className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => {
                  setActiveAdminId(null);
                  setActionNotes('');
                }}
                className="rounded-full bg-white border border-zinc-200 hover:bg-zinc-50 px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={updateMedicationStatus.isPending || (actionStatus !== 'given' && !actionNotes)}
                className="rounded-full bg-teal-600 hover:bg-teal-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-50"
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
