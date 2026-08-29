'use client';

import { useUser } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: user } = useUser();

  // Fetch appointments counts for overview metrics
  const { data: appointmentsRes } = useQuery({
    queryKey: ['dashboard-appointments'],
    queryFn: async () => (await api.get('/appointments')).data,
    enabled: !!user && (user.roles.includes('admin') || user.roles.includes('receptionist')),
  });

  const totalAppointmentsCount = appointmentsRes?.meta?.total ?? 0;
  const pendingAppointmentsCount = appointmentsRes?.data?.filter((a: any) => a.status === 'pending').length ?? 0;

  const isAdmin = user?.roles.includes('admin');
  const isReceptionist = user?.roles.includes('receptionist');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-teal-100 bg-teal-50/50 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-teal-950 sm:text-2xl">
            Welcome back, {user?.name}!
          </h2>
          <p className="mt-1 text-sm text-teal-800">
            Here is the operational status for Nibo Rehabilitation Center.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800 ring-1 ring-inset ring-teal-600/20 uppercase">
          Role: {user?.roles.join(', ')}
        </span>
      </div>

      {/* Grid of Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Appointments */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500">Requested Appointments</span>
            <span className="text-2xl">📅</span>
          </div>
          <p className="mt-4 text-3xl font-bold text-zinc-900">{totalAppointmentsCount}</p>
          <p className="mt-1 text-xs text-zinc-400">
            {pendingAppointmentsCount} pending review
          </p>
        </div>

        {/* Admitted Patients (Phase 3 placeholder) */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500">Residential Patients</span>
            <span className="text-2xl">👤</span>
          </div>
          <p className="mt-4 text-3xl font-bold text-zinc-300">Phase 3</p>
          <p className="mt-1 text-xs text-zinc-400">Admissions module</p>
        </div>

        {/* Treatment Sessions (Phase 5 placeholder) */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500">Active Sessions</span>
            <span className="text-2xl">⚡</span>
          </div>
          <p className="mt-4 text-3xl font-bold text-zinc-300">Phase 5</p>
          <p className="mt-1 text-xs text-zinc-400">30-day residency checks</p>
        </div>

        {/* Financial reports (Phase 8 placeholder) */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-500">Monthly Revenue</span>
            <span className="text-2xl">₦</span>
          </div>
          <p className="mt-4 text-3xl font-bold text-zinc-300">Phase 8</p>
          <p className="mt-1 text-xs text-zinc-400">Invoices & Webhooks</p>
        </div>
      </div>

      {/* Quick Links / Actions */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Quick Actions Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-950 border-b border-zinc-100 pb-2 mb-4">Quick Operations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(isAdmin || isReceptionist) && (
              <Link
                href="/dashboard/appointments"
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-200 hover:border-teal-500 hover:bg-teal-50/10 text-center transition-all group"
              >
                <span className="text-2xl mb-2">📅</span>
                <span className="text-sm font-semibold text-zinc-800 group-hover:text-teal-700">Manage Appointments</span>
                <span className="text-xs text-zinc-400 mt-1">Approve, reject, or reschedule requests.</span>
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/dashboard/staff"
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-200 hover:border-teal-500 hover:bg-teal-50/10 text-center transition-all group"
              >
                <span className="text-2xl mb-2">👥</span>
                <span className="text-sm font-semibold text-zinc-800 group-hover:text-teal-700">Staff Accounts</span>
                <span className="text-xs text-zinc-400 mt-1">Create and manage internal staff.</span>
              </Link>
            )}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-200 bg-zinc-50 text-center cursor-not-allowed opacity-60">
              <span className="text-2xl mb-2">👤</span>
              <span className="text-sm font-semibold text-zinc-400">Patient Directory</span>
              <span className="text-xs text-zinc-400 mt-1">Admission registers (Phase 3).</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-zinc-200 bg-zinc-50 text-center cursor-not-allowed opacity-60">
              <span className="text-2xl mb-2">📈</span>
              <span className="text-sm font-semibold text-zinc-400">Operational Reports</span>
              <span className="text-xs text-zinc-400 mt-1">Analytics summaries (Phase 9).</span>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity / Pending List */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-950 border-b border-zinc-100 pb-2 mb-4">
              Pending Appointment Review
            </h3>
            {pendingAppointmentsCount === 0 ? (
              <p className="text-sm text-zinc-400 py-8 text-center">No pending appointment requests to display.</p>
            ) : (
              <div className="divide-y divide-zinc-100 max-h-60 overflow-y-auto">
                {appointmentsRes?.data
                  ?.filter((a: any) => a.status === 'pending')
                  ?.slice(0, 3)
                  ?.map((appointment: any) => (
                    <div key={appointment.id} className="py-3 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-semibold text-zinc-800">{appointment.visitor_name}</p>
                        <p className="text-xs text-zinc-400">{appointment.reason}</p>
                      </div>
                      <Link
                        href="/dashboard/appointments"
                        className="rounded-full bg-teal-50 hover:bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700 transition-colors"
                      >
                        Review
                      </Link>
                    </div>
                  ))}
              </div>
            )}
          </div>
          {(isAdmin || isReceptionist) && pendingAppointmentsCount > 0 && (
            <Link
              href="/dashboard/appointments"
              className="block text-center text-xs font-semibold text-teal-600 hover:text-teal-700 mt-4 border-t border-zinc-100 pt-3 hover:underline"
            >
              View all appointments
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
