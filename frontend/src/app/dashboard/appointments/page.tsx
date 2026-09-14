'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';

interface Appointment {
  id: number;
  visitor_name: string;
  visitor_phone: string;
  visitor_email: string | null;
  reason: string;
  preferred_at: string;
  scheduled_at: string | null;
  status: string;
  notes: string | null;
}

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'reschedule' | 'complete' | 'cancel' | null>(null);
  
  // Modal Form States
  const [notesInput, setNotesInput] = useState<string>('');
  const [scheduledAtInput, setScheduledAtInput] = useState<string>('');

  // Fetch appointments list
  const { data: appointmentsRes, isLoading, isError } = useQuery({
    queryKey: ['appointments', statusFilter, searchQuery],
    queryFn: async () => {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      return (await api.get('/appointments', { params })).data;
    },
  });

  const appointmentsList: Appointment[] = appointmentsRes?.data ?? [];

  // Mutations
  const actionMutation = useMutation({
    mutationFn: async ({
      id,
      endpoint,
      payload,
    }: {
      id: number;
      endpoint: string;
      payload: any;
    }) => {
      return (await api.patch(`/appointments/${id}/${endpoint}`, payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-appointments'] });
      closeModal();
    },
  });

  const handleOpenActionModal = (appointment: Appointment, type: typeof actionType) => {
    setSelectedAppointment(appointment);
    setActionType(type);
    setNotesInput(appointment.notes ?? '');
    setScheduledAtInput(
      appointment.scheduled_at
        ? new Date(appointment.scheduled_at).toISOString().slice(0, 16)
        : new Date(appointment.preferred_at).toISOString().slice(0, 16)
    );
  };

  const closeModal = () => {
    setSelectedAppointment(null);
    setActionType(null);
    setNotesInput('');
    setScheduledAtInput('');
  };

  const handleConfirmAction = () => {
    if (!selectedAppointment || !actionType) return;

    let endpoint = actionType;
    let payload: any = { notes: notesInput };

    if (actionType === 'reschedule') {
      payload.scheduled_at = scheduledAtInput;
    }

    actionMutation.mutate({
      id: selectedAppointment.id,
      endpoint,
      payload,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-800 ring-amber-600/20';
      case 'approved':
        return 'bg-brand-primary/10 text-brand-primary ring-brand-primary/20';
      case 'rejected':
        return 'bg-red-50 text-red-800 ring-red-600/20';
      case 'rescheduled':
        return 'bg-blue-50 text-blue-800 ring-blue-600/20';
      case 'completed':
        return 'bg-emerald-50 text-emerald-800 ring-emerald-600/20';
      case 'cancelled':
        return 'bg-brand-cream text-brand-charcoal-light ring-brand-cream-dark/45';
      default:
        return 'bg-brand-cream text-brand-charcoal-light ring-brand-cream-dark/45';
    }
  };

  return (
    <div className="space-y-6 text-brand-charcoal-light">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4.5 rounded-2xl border border-brand-cream-dark/60 shadow-sm">
        {/* Search */}
        <div className="w-full sm:w-80 relative">
          <input
            type="text"
            placeholder="Search visitor, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
          />
        </div>

        {/* Filter status */}
        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal bg-white focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointment table / list */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20 bg-white border border-brand-cream-dark/60 rounded-2xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-cream-dark/30 border-t-brand-primary" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-800 border-red-200/50">
          An error occurred while fetching appointments list. Please reload the page.
        </div>
      ) : appointmentsList.length === 0 ? (
        <div className="rounded-2xl border border-brand-cream-dark/60 bg-white p-12 text-center">
          <span className="text-4xl block mb-4">📅</span>
          <p className="text-sm font-bold text-brand-charcoal">No appointments found</p>
          <p className="text-xs text-brand-muted mt-1 font-medium">There are no appointment records matching the current filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-brand-cream-dark/60 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-brand-cream-dark/35 text-left text-sm text-brand-charcoal-light">
            <thead className="bg-brand-cream/45 text-xs font-bold text-brand-charcoal uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Visitor</th>
                <th className="px-6 py-4">Reason / Notes</th>
                <th className="px-6 py-4">Preferred / Scheduled</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream-dark/30 bg-white">
              {appointmentsList.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-brand-cream/10 transition-colors">
                  {/* Visitor details */}
                  <td className="px-6 py-4">
                    <p className="font-semibold text-brand-charcoal">{appointment.visitor_name}</p>
                    <p className="text-xs text-brand-muted font-medium mt-0.5">{appointment.visitor_phone}</p>
                    {appointment.visitor_email && (
                      <p className="text-xs text-brand-muted font-medium mt-0.5">{appointment.visitor_email}</p>
                    )}
                  </td>
                  {/* Reason & notes */}
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-brand-charcoal font-semibold truncate" title={appointment.reason}>
                      {appointment.reason}
                    </p>
                    {appointment.notes && (
                      <p className="text-xs text-brand-primary mt-1.5 font-medium">
                        <strong>Notes:</strong> {appointment.notes}
                      </p>
                    )}
                  </td>
                  {/* Date details */}
                  <td className="px-6 py-4">
                    {appointment.status === 'rescheduled' && appointment.scheduled_at ? (
                      <div>
                        <p className="font-semibold text-blue-700">
                          {new Date(appointment.scheduled_at).toLocaleString()}
                        </p>
                        <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">Rescheduled</span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-brand-charcoal font-semibold">
                          {new Date(appointment.preferred_at).toLocaleString()}
                        </p>
                        <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wider">Preferred</span>
                      </div>
                    )}
                  </td>
                  {/* Status Badge */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ring-1 ring-inset ${getStatusColor(
                        appointment.status
                      )}`}
                    >
                      {appointment.status}
                    </span>
                  </td>
                  {/* Action buttons */}
                  <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                    {appointment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleOpenActionModal(appointment, 'approve')}
                          className="rounded-full bg-brand-accent hover:bg-brand-accent-dark px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleOpenActionModal(appointment, 'reject')}
                          className="rounded-full bg-white border border-brand-cream-dark/60 px-3 py-1.5 text-xs font-bold text-brand-charcoal hover:bg-brand-cream/35 transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {['pending', 'approved', 'rescheduled'].includes(appointment.status) && (
                      <button
                        onClick={() => handleOpenActionModal(appointment, 'reschedule')}
                        className="rounded-full bg-white border border-brand-cream-dark/60 px-3 py-1.5 text-xs font-bold text-brand-charcoal hover:bg-brand-cream/35 transition-colors cursor-pointer"
                      >
                        Reschedule
                      </button>
                    )}
                    {['approved', 'rescheduled'].includes(appointment.status) && (
                      <>
                        <button
                          onClick={() => handleOpenActionModal(appointment, 'complete')}
                          className="rounded-full bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleOpenActionModal(appointment, 'cancel')}
                          className="rounded-full bg-white border border-brand-cream-dark/60 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50/60 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Dialog Modal */}
      {selectedAppointment && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-charcoal/45 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-brand-cream-dark/60 bg-white p-6 shadow-xl space-y-6 text-brand-charcoal-light">
            <div>
              <h3 className="font-serif text-lg font-bold text-brand-charcoal capitalize">
                {actionType} Appointment
              </h3>
              <p className="mt-1 text-xs text-brand-muted font-medium">
                Submit update for appointment requested by **{selectedAppointment.visitor_name}**.
              </p>
            </div>

            {/* Form elements depending on action */}
            <div className="space-y-4">
              {actionType === 'reschedule' && (
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">
                    New Scheduled Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAtInput}
                    onChange={(e) => setScheduledAtInput(e.target.value)}
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal-light placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">
                  Staff Notes / Message to Visitor
                </label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Notes about decision, instructions, or rescheduling details..."
                  className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-2.5 border-t border-brand-cream-dark/45">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full bg-white border border-brand-cream-dark/60 px-5 py-2.5 text-xs font-bold text-brand-charcoal hover:bg-brand-cream/35 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={actionMutation.isPending}
                className="rounded-full bg-brand-accent hover:bg-brand-accent-dark px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-accent/20 transition-all disabled:bg-brand-accent/50 cursor-pointer"
              >
                {actionMutation.isPending ? 'Saving...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
