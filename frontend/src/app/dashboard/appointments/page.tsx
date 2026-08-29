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
        return 'bg-teal-50 text-teal-800 ring-teal-600/20';
      case 'rejected':
        return 'bg-red-50 text-red-800 ring-red-600/20';
      case 'rescheduled':
        return 'bg-blue-50 text-blue-800 ring-blue-600/20';
      case 'completed':
        return 'bg-zinc-50 text-zinc-800 ring-zinc-600/20';
      case 'cancelled':
        return 'bg-zinc-50 text-zinc-600 ring-zinc-500/20';
      default:
        return 'bg-zinc-50 text-zinc-700 ring-zinc-600/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
        {/* Search */}
        <div className="w-full sm:w-80 relative">
          <input
            type="text"
            placeholder="Search visitor, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 pl-3 pr-10 py-2 text-sm placeholder-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Filter status */}
        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 bg-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
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
        <div className="flex justify-center items-center py-20 bg-white border border-zinc-200 rounded-2xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-teal-600" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-800">
          An error occurred while fetching appointments list. Please reload the page.
        </div>
      ) : appointmentsList.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center">
          <span className="text-4xl block mb-4">📅</span>
          <p className="text-sm font-semibold text-zinc-800">No appointments found</p>
          <p className="text-xs text-zinc-400 mt-1">There are no appointment records matching the current filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-zinc-200 text-left text-sm text-zinc-500">
            <thead className="bg-zinc-50 text-xs font-semibold text-zinc-700 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Visitor</th>
                <th className="px-6 py-4">Reason / Notes</th>
                <th className="px-6 py-4">Preferred / Scheduled</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {appointmentsList.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-zinc-50/50">
                  {/* Visitor details */}
                  <td className="px-6 py-4">
                    <p className="font-semibold text-zinc-800">{appointment.visitor_name}</p>
                    <p className="text-xs text-zinc-400">{appointment.visitor_phone}</p>
                    {appointment.visitor_email && (
                      <p className="text-xs text-zinc-400">{appointment.visitor_email}</p>
                    )}
                  </td>
                  {/* Reason & notes */}
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-zinc-700 font-medium truncate" title={appointment.reason}>
                      {appointment.reason}
                    </p>
                    {appointment.notes && (
                      <p className="text-xs text-teal-600 mt-1">
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
                        <span className="text-[10px] text-zinc-400">Rescheduled</span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-zinc-800">
                          {new Date(appointment.preferred_at).toLocaleString()}
                        </p>
                        <span className="text-[10px] text-zinc-400">Preferred</span>
                      </div>
                    )}
                  </td>
                  {/* Status Badge */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${getStatusColor(
                        appointment.status
                      )}`}
                    >
                      {appointment.status}
                    </span>
                  </td>
                  {/* Action buttons */}
                  <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                    {appointment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleOpenActionModal(appointment, 'approve')}
                          className="rounded-full bg-teal-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-teal-700 shadow-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleOpenActionModal(appointment, 'reject')}
                          className="rounded-full bg-white border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {['pending', 'approved', 'rescheduled'].includes(appointment.status) && (
                      <button
                        onClick={() => handleOpenActionModal(appointment, 'reschedule')}
                        className="rounded-full bg-white border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                      >
                        Reschedule
                      </button>
                    )}
                    {['approved', 'rescheduled'].includes(appointment.status) && (
                      <>
                        <button
                          onClick={() => handleOpenActionModal(appointment, 'complete')}
                          className="rounded-full bg-teal-50 text-teal-700 hover:bg-teal-100 px-2.5 py-1 text-xs font-semibold"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleOpenActionModal(appointment, 'cancel')}
                          className="rounded-full bg-white border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-950 capitalize">
                {actionType} Appointment
              </h3>
              <p className="mt-1 text-xs text-zinc-400">
                Submit update for appointment requested by **{selectedAppointment.visitor_name}**.
              </p>
            </div>

            {/* Form elements depending on action */}
            <div className="space-y-4">
              {actionType === 'reschedule' && (
                <div>
                  <label className="block text-sm font-semibold text-zinc-700">
                    New Scheduled Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAtInput}
                    onChange={(e) => setScheduledAtInput(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-zinc-700">
                  Staff Notes / Message to Visitor
                </label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Notes about decision, instructions, or rescheduling details..."
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full bg-white border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={actionMutation.isPending}
                className="rounded-full bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:bg-teal-400"
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
