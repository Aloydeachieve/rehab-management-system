'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUser } from '@/lib/auth';
import { useState, useMemo } from 'react';
import Link from 'next/link';

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
  dose_slot?: 'morning' | 'afternoon' | 'evening' | 'night' | null;
  scheduled_at: string;
  administered_at: string | null;
  status: string;
  notes: string | null;
  patient: Patient;
  prescription_item: PrescriptionItem;
  administering_staff?: { name: string };
}

interface GroupedMatrixRow {
  patient: Patient;
  prescription_item: PrescriptionItem;
  slots: {
    morning?: MedicationAdministration;
    afternoon?: MedicationAdministration;
    evening?: MedicationAdministration;
    night?: MedicationAdministration;
  };
  day_status: 'completed' | 'incomplete' | 'in_progress';
}

export default function MedicationsWorkspacePage() {
  const { data: currentUser } = useUser();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'matrix' | 'timeline'>('matrix');
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for the action dialog
  const [activeAdmin, setActiveAdmin] = useState<MedicationAdministration | null>(null);
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
      setActiveAdmin(null);
      setActionNotes('');
      queryClient.invalidateQueries({ queryKey: ['medications-schedule', selectedDate] });
    },
  });

  const handleOpenAction = (admin: MedicationAdministration, defaultStatus: string = 'given') => {
    setActiveAdmin(admin);
    setActionStatus(defaultStatus);
    setActionNotes(admin.notes || '');
  };

  const handleConfirmAction = () => {
    if (activeAdmin) {
      updateMedicationStatus.mutate({
        id: activeAdmin.id,
        status: actionStatus,
        notes: actionNotes,
      });
    }
  };

  // Group administrations into Matrix Rows (Patient x Prescription Item)
  const matrixRows = useMemo(() => {
    if (!administrations) return [];

    const map = new Map<string, GroupedMatrixRow>();

    administrations.forEach((admin) => {
      const key = `${admin.patient_id}_${admin.prescription_item_id}`;
      if (!map.has(key)) {
        map.set(key, {
          patient: admin.patient,
          prescription_item: admin.prescription_item,
          slots: {},
          day_status: 'in_progress',
        });
      }

      const row = map.get(key)!;
      
      // Determine slot key
      let slotKey: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';
      if (admin.dose_slot) {
        slotKey = admin.dose_slot;
      } else {
        const hour = new Date(admin.scheduled_at).getHours();
        if (hour < 12) slotKey = 'morning';
        else if (hour < 16) slotKey = 'afternoon';
        else if (hour < 20) slotKey = 'evening';
        else slotKey = 'night';
      }

      row.slots[slotKey] = admin;
    });

    // Compute day_status for each row based on expected doses for the prescription item
    map.forEach((row) => {
      const freq = (row.prescription_item?.frequency || '').trim().toLowerCase();
      let expectedSlots: Array<'morning' | 'afternoon' | 'evening' | 'night'> = ['morning'];
      if (['four', '4x', 'qid', 'q6h'].some(s => freq.includes(s)) || freq === '4') {
        expectedSlots = ['morning', 'afternoon', 'evening', 'night'];
      } else if (['three', '3x', 'tid', 'q8h'].some(s => freq.includes(s)) || freq === '3') {
        expectedSlots = ['morning', 'afternoon', 'night'];
      } else if (['twice', '2x', 'bid', 'q12h'].some(s => freq.includes(s)) || freq === '2') {
        expectedSlots = ['morning', 'night'];
      }

      const doses = Object.values(row.slots).filter(Boolean) as MedicationAdministration[];
      const hasIncomplete = doses.some((d) => d.status === 'refused' || d.status === 'missed');
      
      // All expected slots must exist and be marked 'given'
      const allExpectedGiven = expectedSlots.length > 0 && expectedSlots.every((slot) => {
        const dose = row.slots[slot];
        return dose && dose.status === 'given';
      });

      if (hasIncomplete) {
        row.day_status = 'incomplete';
      } else if (allExpectedGiven) {
        row.day_status = 'completed';
      } else {
        row.day_status = 'in_progress';
      }
    });

    const rows = Array.from(map.values());

    if (!searchTerm.trim()) return rows;

    const term = searchTerm.toLowerCase();
    return rows.filter((r) =>
      r.patient.name.toLowerCase().includes(term) ||
      r.patient.patient_number.toLowerCase().includes(term) ||
      r.prescription_item.medication_name.toLowerCase().includes(term)
    );
  }, [administrations, searchTerm]);

  // Overall statistics
  const stats = useMemo(() => {
    if (!administrations) return { total: 0, given: 0, scheduled: 0, missed: 0, refused: 0, rate: 0 };
    const total = administrations.length;
    const given = administrations.filter((a) => a.status === 'given').length;
    const scheduled = administrations.filter((a) => a.status === 'scheduled').length;
    const missed = administrations.filter((a) => a.status === 'missed').length;
    const refused = administrations.filter((a) => a.status === 'refused').length;
    const rate = total > 0 ? Math.round((given / total) * 100) : 0;
    return { total, given, scheduled, missed, refused, rate };
  }, [administrations]);

  const setDateOffset = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 text-brand-charcoal-light">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-6 rounded-3xl border border-brand-cream-dark/60 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif text-xl font-bold text-brand-charcoal">Facility eMAR Administration Board</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-primary px-2.5 py-0.5 rounded-full border border-brand-primary/20">
              Dose-Level Tracking
            </span>
          </div>
          <p className="text-xs text-brand-muted mt-1 font-medium">
            Cross-facility electronic medication administration record. Administer morning, afternoon, evening, and night slots under doctor orders.
          </p>
        </div>

        {/* Date Selector with quick pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-brand-cream/40 p-1 rounded-full border border-brand-cream-dark/50">
            <button
              onClick={() => setDateOffset(-1)}
              className="px-3 py-1 text-[11px] font-bold text-brand-charcoal hover:bg-brand-cream/60 rounded-full transition cursor-pointer"
            >
              Yesterday
            </button>
            <button
              onClick={() => setDateOffset(0)}
              className={`px-3 py-1 text-[11px] font-bold rounded-full transition cursor-pointer ${
                isToday ? 'bg-brand-primary text-white shadow-xs' : 'text-brand-charcoal hover:bg-brand-cream/60'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateOffset(1)}
              className="px-3 py-1 text-[11px] font-bold text-brand-charcoal hover:bg-brand-cream/60 rounded-full transition cursor-pointer"
            >
              Tomorrow
            </button>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-full border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-1.5 text-xs text-brand-charcoal bg-white focus:border-brand-primary focus:outline-none transition cursor-pointer"
          />
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-brand-cream-dark/60 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-brand-muted tracking-wider block">Total Doses</span>
          <span className="text-2xl font-extrabold text-brand-charcoal mt-1 block">{stats.total}</span>
          <span className="text-[10px] text-brand-muted block mt-0.5">Scheduled events</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-brand-cream-dark/60 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider block">Administered</span>
          <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">{stats.given}</span>
          <span className="text-[10px] text-emerald-600 block mt-0.5">Verified given</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-brand-cream-dark/60 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-amber-700 tracking-wider block">Due / Pending</span>
          <span className="text-2xl font-extrabold text-amber-700 mt-1 block">{stats.scheduled}</span>
          <span className="text-[10px] text-amber-600 block mt-0.5">Awaiting slot window</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-brand-cream-dark/60 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-rose-700 tracking-wider block">Missed / Refused</span>
          <span className="text-2xl font-extrabold text-rose-700 mt-1 block">{stats.missed + stats.refused}</span>
          <span className="text-[10px] text-rose-600 block mt-0.5">{stats.refused} refused &bull; {stats.missed} missed</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-brand-cream-dark/60 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase text-brand-primary tracking-wider block">Adherence</span>
          <span className="text-2xl font-extrabold text-brand-primary mt-1 block">{stats.rate}%</span>
          <span className="text-[10px] text-brand-muted block mt-0.5">Facility completion</span>
        </div>
      </div>

      {/* Main Board Section */}
      <div className="bg-white border border-brand-cream-dark/60 rounded-3xl shadow-sm overflow-hidden space-y-4 p-6">
        {/* Board Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-cream-dark/45 pb-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-full bg-brand-cream/40 p-1 border border-brand-cream-dark/50">
              <button
                onClick={() => setViewMode('matrix')}
                className={`px-3.5 py-1 text-xs font-bold rounded-full transition cursor-pointer ${
                  viewMode === 'matrix' ? 'bg-brand-primary text-white shadow-xs' : 'text-brand-charcoal hover:bg-brand-cream/60'
                }`}
              >
                Slot Matrix View
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3.5 py-1 text-xs font-bold rounded-full transition cursor-pointer ${
                  viewMode === 'timeline' ? 'bg-brand-primary text-white shadow-xs' : 'text-brand-charcoal hover:bg-brand-cream/60'
                }`}
              >
                Detailed Log View
              </button>
            </div>
            <span className="text-xs font-medium text-brand-muted hidden md:inline">
              ({matrixRows.length} patient medication regimens)
            </span>
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search patient, reg #, or drug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-1.5 text-xs text-brand-charcoal focus:border-brand-primary focus:outline-none placeholder-brand-muted/70"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-brand-primary" />
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-xs text-red-800">
            Failed to load facility medication administrations. Please verify authorization.
          </div>
        ) : viewMode === 'matrix' ? (
          /* MATRIX BOARD: Patient | Medication | Morning | Afternoon | Evening | Night | Day Status */
          <div className="overflow-x-auto rounded-2xl border border-brand-cream-dark/50">
            <table className="w-full text-left text-xs text-brand-charcoal border-collapse font-medium">
              <thead>
                <tr className="bg-brand-cream/45 border-b border-brand-cream-dark/45 text-[10px] font-bold text-brand-charcoal uppercase tracking-wider">
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Medication & Regimen</th>
                  <th className="py-3 px-3 text-center">Morning<br /><span className="text-[9px] font-normal text-brand-muted">08:00</span></th>
                  <th className="py-3 px-3 text-center">Afternoon<br /><span className="text-[9px] font-normal text-brand-muted">14:00</span></th>
                  <th className="py-3 px-3 text-center">Evening<br /><span className="text-[9px] font-normal text-brand-muted">18:00</span></th>
                  <th className="py-3 px-3 text-center">Night<br /><span className="text-[9px] font-normal text-brand-muted">20:00 / 22:00</span></th>
                  <th className="py-3 px-4 text-center">Day Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-cream-dark/30 bg-white">
                {matrixRows.map((row, idx) => {
                  const slots: Array<'morning' | 'afternoon' | 'evening' | 'night'> = ['morning', 'afternoon', 'evening', 'night'];
                  return (
                    <tr key={`${row.patient.id}_${row.prescription_item.id}_${idx}`} className="hover:bg-brand-cream/10 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          href={`/dashboard/patients/${row.patient.id}`}
                          className="font-bold text-brand-charcoal hover:text-brand-primary transition block"
                        >
                          {row.patient.name}
                        </Link>
                        <span className="text-[10px] text-brand-muted font-bold font-mono">
                          {row.patient.patient_number}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-brand-primary block">{row.prescription_item.medication_name}</span>
                        <span className="text-[11px] text-brand-muted block">
                          {row.prescription_item.dosage} &bull; {row.prescription_item.frequency}
                        </span>
                        {row.prescription_item.instructions && (
                          <span className="text-[10px] text-brand-charcoal-light italic block mt-0.5">
                            {row.prescription_item.instructions}
                          </span>
                        )}
                      </td>

                      {slots.map((slotKey) => {
                        const dose = row.slots[slotKey];
                        if (!dose) {
                          return (
                            <td key={slotKey} className="py-3 px-3 text-center text-zinc-300 font-mono">
                              —
                            </td>
                          );
                        }

                        const isGiven = dose.status === 'given';
                        const isRefused = dose.status === 'refused';
                        const isMissed = dose.status === 'missed';

                        return (
                          <td key={slotKey} className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleOpenAction(dose, dose.status === 'scheduled' ? 'given' : dose.status)}
                              title="Click to record or update dose state"
                              className={`inline-flex flex-col items-center justify-center px-2.5 py-1.5 rounded-xl border text-[10px] font-bold transition-all shadow-xs cursor-pointer ${
                                isGiven
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                                  : isRefused
                                  ? 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
                                  : isMissed
                                  ? 'bg-red-100 border-red-300 text-red-900 hover:bg-red-200'
                                  : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 ring-1 ring-amber-400/30'
                              }`}
                            >
                              <span>{isGiven ? '✓ Given' : isRefused ? '✕ Refused' : isMissed ? '✕ Missed' : '⏳ Due'}</span>
                              {dose.administering_staff && (
                                <span className="text-[8px] font-normal opacity-80 mt-0.5">
                                  {dose.administering_staff.name.split(' ')[0]}
                                </span>
                              )}
                            </button>
                          </td>
                        );
                      })}

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          row.day_status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : row.day_status === 'incomplete'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {row.day_status === 'completed'
                            ? 'Completed'
                            : row.day_status === 'incomplete'
                            ? 'Incomplete'
                            : 'In Progress'}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {matrixRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-brand-muted font-medium italic bg-white">
                      No medication administrations scheduled for {selectedDate}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* TIMELINE / DETAILED LOG VIEW */
          <div className="overflow-x-auto rounded-2xl border border-brand-cream-dark/50">
            <table className="w-full text-left text-xs text-brand-charcoal border-collapse font-medium">
              <thead>
                <tr className="bg-brand-cream/45 border-b border-brand-cream-dark/45 text-[10px] font-bold text-brand-charcoal uppercase tracking-wider">
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Medication & Dosage</th>
                  <th className="py-3 px-3">Slot</th>
                  <th className="py-3 px-4">Scheduled Time</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4">Logged Staff</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-cream-dark/30 bg-white">
                {administrations?.map((admin) => (
                  <tr key={admin.id} className="hover:bg-brand-cream/10 transition-colors">
                    <td className="py-3 px-4">
                      <Link href={`/dashboard/patients/${admin.patient.id}`} className="font-bold text-brand-charcoal hover:text-brand-primary">
                        {admin.patient.name}
                      </Link>
                      <div className="text-[10px] text-brand-muted font-mono font-bold">{admin.patient.patient_number}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-brand-primary">{admin.prescription_item.medication_name}</span>
                      <span className="text-brand-muted ml-1">({admin.prescription_item.dosage})</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="capitalize font-semibold text-brand-primary text-[11px]">
                        {admin.dose_slot || 'Standard'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-brand-muted">
                      {new Date(admin.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                        admin.status === 'given'
                          ? 'bg-emerald-100 text-emerald-800'
                          : admin.status === 'scheduled'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {admin.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {admin.administering_staff ? (
                        <span className="font-bold text-brand-charcoal">{admin.administering_staff.name}</span>
                      ) : (
                        <span className="text-brand-muted italic">Pending</span>
                      )}
                      {admin.notes && (
                        <div className="text-[10px] text-brand-muted italic mt-0.5">
                          {admin.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isStaffOrAdmin && (
                        <button
                          onClick={() => handleOpenAction(admin)}
                          className="rounded-full bg-brand-primary hover:bg-brand-primary-dark text-white px-3 py-1 text-[11px] font-bold shadow-xs transition cursor-pointer"
                        >
                          Update
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {(!administrations || administrations.length === 0) && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-brand-muted font-medium italic bg-white">
                      No medication administrations recorded for this date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Actions Dialog Modal */}
      {activeAdmin !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/45 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border border-brand-cream-dark/60 rounded-3xl p-6 shadow-xl space-y-4 text-brand-charcoal-light">
            <div className="flex justify-between items-center border-b border-brand-cream-dark/45 pb-3">
              <h3 className="font-serif text-base font-bold text-brand-charcoal">
                Record Dose Administration
              </h3>
              <button
                onClick={() => setActiveAdmin(null)}
                className="text-brand-muted hover:text-brand-charcoal text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="bg-brand-cream-light/30 p-3.5 rounded-2xl border border-brand-cream-dark/40 text-xs space-y-1">
              <p className="font-bold text-brand-primary text-sm">{activeAdmin.prescription_item.medication_name}</p>
              <p className="text-brand-charcoal">Patient: <strong>{activeAdmin.patient.name}</strong> ({activeAdmin.patient.patient_number})</p>
              <p className="text-brand-muted capitalize">
                Slot: <strong>{activeAdmin.dose_slot || 'standard'}</strong> &bull; Scheduled: {new Date(activeAdmin.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-brand-charcoal-light uppercase tracking-wider mb-1.5">
                  Administration Status *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'given', label: '✓ Given', color: 'border-emerald-400 bg-emerald-50 text-emerald-800' },
                    { val: 'refused', label: '✕ Refused', color: 'border-rose-400 bg-rose-50 text-rose-800' },
                    { val: 'missed', label: '✕ Missed', color: 'border-red-400 bg-red-50 text-red-900' },
                  ].map((btn) => (
                    <button
                      key={btn.val}
                      type="button"
                      onClick={() => setActionStatus(btn.val)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        actionStatus === btn.val
                          ? `${btn.color} ring-2 ring-brand-primary`
                          : 'bg-white border-brand-cream-dark/60 text-brand-charcoal hover:bg-brand-cream/30'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-charcoal-light uppercase tracking-wider mb-1">
                  {actionStatus === 'given' ? 'Clinical Notes (Optional)' : 'Reason / Findings Notes (Required) *'}
                </label>
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={actionStatus === 'given' ? 'e.g. Dose ingested without complaints...' : 'e.g. Patient refused morning dose due to nausea...'}
                  className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-3 py-2 text-xs text-brand-charcoal font-medium"
                />
              </div>

              <div className="text-[10px] text-brand-muted bg-brand-cream/30 p-2.5 rounded-xl border border-brand-cream-dark/30">
                Staff: <strong>{currentUser?.name}</strong> &bull; Dose-level administration logged in electronic record upon confirmation.
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2.5 border-t border-brand-cream-dark/45">
              <button
                onClick={() => {
                  setActiveAdmin(null);
                  setActionNotes('');
                }}
                className="rounded-full bg-white border border-brand-cream-dark/60 hover:bg-brand-cream/35 px-4 py-2 text-xs font-bold text-brand-charcoal shadow-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={updateMedicationStatus.isPending || (actionStatus !== 'given' && !actionNotes.trim())}
                className="rounded-full bg-brand-primary hover:bg-brand-primary-dark px-5 py-2 text-xs font-bold text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
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
