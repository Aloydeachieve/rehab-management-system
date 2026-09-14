'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUser } from '@/lib/auth';
import Link from 'next/link';

interface DashboardSummary {
  patients: {
    total_registered: number;
    currently_admitted: number;
    active_sessions: number;
    discharged: number;
  };
  appointments: {
    pending: number;
    approved: number;
    today: number;
    completed: number;
  };
  billing: {
    total_invoiced: number;
    total_collected: number;
    outstanding_balance: number;
    partially_paid_count: number;
    overdue_count: number;
  };
  medications: {
    today_scheduled: number;
    today_given: number;
    today_missed: number;
    today_refused: number;
    today_cancelled: number;
  };
  guardians: {
    total_conversations: number;
    unread_messages: number;
  };
  generated_at: string;
}

interface AlertItem {
  id: string;
  category: string;
  type: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  action_url: string;
  action_label: string;
  created_at: string;
  meta?: any;
}

interface TreatmentSessionOverviewItem {
  id: number;
  patient_id: number;
  session_number: number;
  session_price?: string | null;
  start_date: string;
  expected_end_date: string;
  actual_end_date: string | null;
  status: string;
  payment_status: string;
  recommendation: string | null;
  reassessed_at: string | null;
  decision_at: string | null;
  is_approaching_end?: boolean;
  days_remaining?: number;
  patient?: {
    id: number;
    name: string;
    patient_number: string;
    status: string;
  };
  professional?: {
    id: number;
    name: string;
  };
}

export default function DashboardOverviewPage() {
  const { data: user } = useUser();
  const [sessionFilter, setSessionFilter] = useState<'active' | 'expiring' | 'decision_needed' | 'all'>('active');

  const isAdmin = user?.roles.includes('admin');
  const isReceptionist = user?.roles.includes('receptionist');
  const isStaff = isAdmin || isReceptionist;

  // 1. Fetch Summary Statistics
  const { data: summary, isLoading: summaryLoading } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: async () => (await api.get('/dashboard/summary')).data,
    enabled: isStaff,
    refetchInterval: 30000,
  });

  // 2. Fetch Operational Alerts
  const { data: alertsData, isLoading: alertsLoading } = useQuery<{ alerts: AlertItem[]; count: number }>({
    queryKey: ['dashboard-alerts'],
    queryFn: async () => (await api.get('/dashboard/alerts')).data,
    enabled: isStaff,
    refetchInterval: 15000,
  });

  const alerts = alertsData?.alerts || [];

  // 3. Fetch Treatment Sessions Monitoring
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery<{ data: TreatmentSessionOverviewItem[] }>({
    queryKey: ['dashboard-sessions', sessionFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (sessionFilter === 'active') {
        params.append('status', 'active');
      } else if (sessionFilter === 'expiring') {
        params.append('status', 'active');
        params.append('approaching_end', '1');
      } else if (sessionFilter === 'decision_needed') {
        params.append('status', 'active');
        params.append('decision_state', 'needs_decision');
      } else {
        params.append('status', 'all');
      }
      params.append('per_page', '10');

      const res = await api.get(`/treatment-sessions?${params.toString()}`);
      return res.data;
    },
    enabled: !!user,
  });

  const sessions = sessionsData?.data || [];

  return (
    <div className="space-y-8">
      {/* 1. Welcome Banner */}
      <div className="rounded-2xl border border-brand-cream-dark/60 bg-white p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full filter blur-2xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-brand-accent">Operational Monitoring Online</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-brand-charcoal sm:text-3xl">
            Welcome back, {user?.name}!
          </h2>
          <p className="mt-1 text-xs text-brand-charcoal-light font-medium">
            Administrative overview, live operational alerts, and residential treatment metrics for Nibo Rehabilitation Center.
          </p>
        </div>
        <div className="flex items-center gap-2 relative z-10">
          <span className="inline-flex items-center rounded-full bg-brand-primary/10 px-3.5 py-1.5 text-xs font-bold text-brand-primary tracking-wide ring-1 ring-inset ring-brand-primary/20 uppercase">
            Role: {user?.roles.join(', ')}
          </span>
        </div>
      </div>

      {/* 2. Top Metric Cards (Clickable to existing workspaces) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Patients */}
        <Link
          href="/dashboard/patients"
          className="rounded-2xl border border-brand-cream-dark/60 bg-white p-5 shadow-sm hover:shadow-md hover:border-brand-primary/40 transition duration-200 group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-charcoal-light uppercase tracking-wide">Registered Patients</span>
            <div className="p-2 bg-brand-cream rounded-xl text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-3xl font-serif font-bold text-brand-charcoal">
            {summaryLoading ? '—' : summary?.patients.total_registered ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-brand-muted font-medium flex items-center justify-between">
            <span>{summary?.patients.currently_admitted ?? 0} admitted</span>
            <span>{summary?.patients.discharged ?? 0} discharged</span>
          </p>
        </Link>

        {/* Active Residential Sessions */}
        <div
          onClick={() => {
            const el = document.getElementById('sessions-section');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="rounded-2xl border border-brand-cream-dark/60 bg-white p-5 shadow-sm hover:shadow-md hover:border-brand-primary/40 transition duration-200 group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-charcoal-light uppercase tracking-wide">Active Sessions</span>
            <div className="p-2 bg-brand-cream rounded-xl text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-3xl font-serif font-bold text-brand-charcoal">
            {summaryLoading ? '—' : summary?.patients.active_sessions ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-brand-muted font-medium">
            30-day residential care tracking
          </p>
        </div>

        {/* Pending Appointments */}
        <Link
          href="/dashboard/appointments"
          className="rounded-2xl border border-brand-cream-dark/60 bg-white p-5 shadow-sm hover:shadow-md hover:border-brand-primary/40 transition duration-200 group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-charcoal-light uppercase tracking-wide">Pending Appointments</span>
            <div className="p-2 bg-brand-cream rounded-xl text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
          </div>
          <p className="mt-3 text-3xl font-serif font-bold text-brand-charcoal">
            {summaryLoading ? '—' : summary?.appointments.pending ?? 0}
          </p>
          <p className="mt-1 text-[11px] text-brand-muted font-medium flex items-center justify-between">
            <span>{summary?.appointments.today ?? 0} scheduled today</span>
            <span>{summary?.appointments.approved ?? 0} approved</span>
          </p>
        </Link>

        {/* Outstanding Invoice Balance */}
        <Link
          href="/dashboard/billing"
          className="rounded-2xl border border-brand-cream-dark/60 bg-white p-5 shadow-sm hover:shadow-md hover:border-brand-primary/40 transition duration-200 group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-charcoal-light uppercase tracking-wide">Outstanding Balance</span>
            <div className="p-2 bg-brand-cream rounded-xl text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
              <span className="font-serif font-bold text-sm leading-none block">₦</span>
            </div>
          </div>
          <p className="mt-3 text-2xl font-serif font-bold text-amber-900">
            {summaryLoading ? '—' : `₦${summary?.billing.outstanding_balance?.toLocaleString('en-NG', { minimumFractionDigits: 2 }) ?? '0.00'}`}
          </p>
          <p className="mt-1 text-[11px] text-brand-muted font-medium flex items-center justify-between">
            <span className="text-emerald-700 font-semibold">₦{summary?.billing.total_collected?.toLocaleString('en-NG') ?? '0'} collected</span>
            <span className="text-red-700 font-semibold">{summary?.billing.overdue_count ?? 0} overdue</span>
          </p>
        </Link>
      </div>

      {/* 3. Operational Alerts / Action Required */}
      <div className="rounded-2xl border border-brand-cream-dark/60 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-brand-cream-dark/40 pb-4 mb-5 gap-2">
          <div>
            <h3 className="font-serif text-lg font-bold text-brand-charcoal flex items-center gap-2">
              <span>⚠️</span> Action Required / Operational Alerts
            </h3>
            <p className="text-xs text-brand-muted mt-0.5">
              Urgent items requiring clinical decision, front-desk collection, or visitor appointment triage.
            </p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            {alerts.length} Active {alerts.length === 1 ? 'Alert' : 'Alerts'}
          </span>
        </div>

        {alertsLoading ? (
          <div className="py-8 text-center text-xs text-brand-muted">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="py-8 text-center bg-brand-cream-light/40 rounded-xl border border-brand-cream-dark/40">
            <span className="text-2xl block mb-1">🎉</span>
            <p className="text-sm font-semibold text-brand-charcoal">All systems operational</p>
            <p className="text-xs text-brand-muted mt-0.5">No overdue invoices, pending appointments, or expiring sessions requiring immediate action.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                  alert.severity === 'high'
                    ? 'border-red-300 bg-red-50/50'
                    : 'border-amber-200 bg-amber-50/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      alert.severity === 'high' ? 'bg-red-200 text-red-900' : 'bg-amber-200 text-amber-900'
                    }`}>
                      {alert.category}
                    </span>
                    <span className="text-[10px] text-brand-muted">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-brand-charcoal leading-tight">
                    {alert.title}
                  </h4>
                  <p className="text-[11px] text-brand-charcoal-light mt-1 leading-relaxed">
                    {alert.description}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-brand-cream-dark/30 flex justify-end">
                  <Link
                    href={alert.action_url}
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-primary hover:text-brand-accent transition"
                  >
                    {alert.action_label} →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Treatment Session Monitoring Table */}
      <div id="sessions-section" className="rounded-2xl border border-brand-cream-dark/60 bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-brand-cream-dark/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-brand-charcoal flex items-center gap-2">
              <span>🩺</span> Treatment Session Monitoring
            </h3>
            <p className="text-xs text-brand-muted mt-0.5">
              Live tracking of ongoing 30-day residential cycles, reassessment deadlines, and settlement status.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 bg-brand-cream-light/80 p-1 rounded-xl border border-brand-cream-dark/60">
            <button
              onClick={() => setSessionFilter('active')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                sessionFilter === 'active'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-brand-charcoal hover:bg-brand-cream'
              }`}
            >
              All Active
            </button>
            <button
              onClick={() => setSessionFilter('expiring')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                sessionFilter === 'expiring'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-brand-charcoal hover:bg-brand-cream'
              }`}
            >
              Ending Soon (≤ 7 Days)
            </button>
            <button
              onClick={() => setSessionFilter('decision_needed')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                sessionFilter === 'decision_needed'
                  ? 'bg-brand-accent text-white shadow-xs'
                  : 'text-brand-charcoal hover:bg-brand-cream'
              }`}
            >
              Decision Needed
            </button>
            <button
              onClick={() => setSessionFilter('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                sessionFilter === 'all'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-brand-charcoal hover:bg-brand-cream'
              }`}
            >
              All Sessions
            </button>
          </div>
        </div>

        {sessionsLoading ? (
          <div className="p-8 text-center text-xs text-brand-muted">Loading treatment sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="p-10 text-center text-xs text-brand-muted">
            No treatment sessions matching this operational filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-brand-charcoal">
              <thead className="bg-brand-cream-light/60 border-b border-brand-cream-dark/60 text-[11px] font-bold text-brand-charcoal-light uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Session #</th>
                  <th className="px-5 py-3">Start Date</th>
                  <th className="px-5 py-3">Expected End</th>
                  <th className="px-5 py-3">Time Left</th>
                  <th className="px-5 py-3">Assigned Doctor</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Decision State</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-cream-dark/40">
                {sessions.map((session) => (
                  <tr
                    key={session.id}
                    className={`hover:bg-brand-cream/15 transition ${
                      session.is_approaching_end ? 'bg-amber-50/20' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-brand-charcoal">{session.patient?.name}</div>
                      <div className="font-mono text-[10px] text-brand-muted">{session.patient?.patient_number}</div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-brand-primary">
                      Session #{session.session_number}
                    </td>
                    <td className="px-5 py-3.5 text-brand-muted">{session.start_date}</td>
                    <td className="px-5 py-3.5 text-brand-muted">{session.expected_end_date}</td>
                    <td className="px-5 py-3.5">
                      {session.days_remaining !== undefined ? (
                        session.days_remaining < 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                            Overdue ({Math.abs(session.days_remaining)}d)
                          </span>
                        ) : session.days_remaining <= 7 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            {session.days_remaining}d remaining
                          </span>
                        ) : (
                          <span className="text-[11px] text-brand-muted">
                            {session.days_remaining} days
                          </span>
                        )
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-medium">
                      {session.professional?.name ?? 'Unassigned'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        session.payment_status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : session.payment_status === 'partially_paid'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-zinc-100 text-zinc-700'
                      }`}>
                        {session.payment_status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {session.recommendation ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary">
                          Recommended: <strong className="capitalize">{session.recommendation}</strong>
                        </span>
                      ) : (
                        <span className="text-[11px] text-brand-muted">Awaiting reassessment</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/dashboard/sessions/${session.id}`}
                        className="inline-flex items-center gap-1 rounded-xl bg-brand-cream border border-brand-cream-dark/60 hover:bg-brand-primary hover:text-white px-3 py-1 text-xs font-semibold text-brand-charcoal transition shadow-2xs"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Departmental Operational Summaries (Billing, Medications, Appointments, Guardian Support) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Billing & Financial Ledger Summary */}
        <div className="rounded-2xl border border-brand-cream-dark/60 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-brand-cream-dark/40 pb-3 mb-4">
              <h3 className="font-serif text-base font-bold text-brand-charcoal flex items-center gap-2">
                <span>💳</span> Billing & Revenue Summary
              </h3>
              <Link href="/dashboard/billing" className="text-xs font-bold text-brand-accent hover:underline">
                View Invoices →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-brand-cream-light/60 p-3 rounded-xl border border-brand-cream-dark/50">
                <span className="text-[10px] font-bold text-brand-muted uppercase block">Total Invoiced</span>
                <span className="text-lg font-serif font-bold text-brand-charcoal">
                  ₦{summary?.billing.total_invoiced?.toLocaleString('en-NG', { minimumFractionDigits: 2 }) ?? '0.00'}
                </span>
              </div>
              <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Total Collected</span>
                <span className="text-lg font-serif font-bold text-emerald-800">
                  ₦{summary?.billing.total_collected?.toLocaleString('en-NG', { minimumFractionDigits: 2 }) ?? '0.00'}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs text-brand-charcoal-light py-1 border-t border-brand-cream-dark/30">
              <span>Partially Paid Invoices:</span>
              <strong className="font-bold">{summary?.billing.partially_paid_count ?? 0}</strong>
            </div>
            <div className="flex justify-between items-center text-xs text-brand-charcoal-light py-1">
              <span>Overdue Invoices:</span>
              <strong className="font-bold text-red-700">{summary?.billing.overdue_count ?? 0}</strong>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-brand-cream-dark/40 text-right">
            <Link
              href="/dashboard/billing"
              className="text-xs font-semibold text-brand-primary hover:text-brand-primary-dark"
            >
              Open Full Billing Workspace →
            </Link>
          </div>
        </div>

        {/* Medication Administration (eMAR) Overview */}
        <div className="rounded-2xl border border-brand-cream-dark/60 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-brand-cream-dark/40 pb-3 mb-4">
              <h3 className="font-serif text-base font-bold text-brand-charcoal flex items-center gap-2">
                <span>💊</span> Today&apos;s Medication Administration (eMAR)
              </h3>
              <Link href="/dashboard/medications" className="text-xs font-bold text-brand-accent hover:underline">
                View Schedule →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mb-4">
              <div className="bg-brand-cream-light/60 p-3 rounded-xl border border-brand-cream-dark/50">
                <span className="text-[10px] font-bold text-brand-muted uppercase block">Scheduled</span>
                <span className="text-xl font-serif font-bold text-brand-charcoal">
                  {summary?.medications.today_scheduled ?? 0}
                </span>
              </div>
              <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Given</span>
                <span className="text-xl font-serif font-bold text-emerald-800">
                  {summary?.medications.today_given ?? 0}
                </span>
              </div>
              <div className="bg-red-50/50 p-3 rounded-xl border border-red-200">
                <span className="text-[10px] font-bold text-red-800 uppercase block">Missed / Refused</span>
                <span className="text-xl font-serif font-bold text-red-800">
                  {(summary?.medications.today_missed ?? 0) + (summary?.medications.today_refused ?? 0)}
                </span>
              </div>
            </div>
            <p className="text-xs text-brand-muted">
              Cancelled doses today: <strong>{summary?.medications.today_cancelled ?? 0}</strong>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-brand-cream-dark/40 text-right">
            <Link
              href="/dashboard/medications"
              className="text-xs font-semibold text-brand-primary hover:text-brand-primary-dark"
            >
              Open Daily eMAR Workspace →
            </Link>
          </div>
        </div>

        {/* Appointment Management Overview */}
        <div className="rounded-2xl border border-brand-cream-dark/60 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-brand-cream-dark/40 pb-3 mb-4">
              <h3 className="font-serif text-base font-bold text-brand-charcoal flex items-center gap-2">
                <span>📅</span> Appointment Lifecycle Overview
              </h3>
              <Link href="/dashboard/appointments" className="text-xs font-bold text-brand-accent hover:underline">
                Manage All →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Pending</span>
                <span className="text-xl font-serif font-bold text-amber-900">
                  {summary?.appointments.pending ?? 0}
                </span>
              </div>
              <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Approved</span>
                <span className="text-xl font-serif font-bold text-emerald-800">
                  {summary?.appointments.approved ?? 0}
                </span>
              </div>
              <div className="bg-brand-cream-light/60 p-3 rounded-xl border border-brand-cream-dark/50">
                <span className="text-[10px] font-bold text-brand-muted uppercase block">Completed</span>
                <span className="text-xl font-serif font-bold text-brand-charcoal">
                  {summary?.appointments.completed ?? 0}
                </span>
              </div>
            </div>
            <p className="text-xs text-brand-muted">
              Scheduled appointments today: <strong>{summary?.appointments.today ?? 0}</strong>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-brand-cream-dark/40 text-right">
            <Link
              href="/dashboard/appointments"
              className="text-xs font-semibold text-brand-primary hover:text-brand-primary-dark"
            >
              Open Appointments Workspace →
            </Link>
          </div>
        </div>

        {/* Guardian Support Messages Overview */}
        <div className="rounded-2xl border border-brand-cream-dark/60 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-brand-cream-dark/40 pb-3 mb-4">
              <h3 className="font-serif text-base font-bold text-brand-charcoal flex items-center gap-2">
                <span>💬</span> Guardian Support Chat
              </h3>
              <Link href="/dashboard/messages" className="text-xs font-bold text-brand-accent hover:underline">
                Open Inbox →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-brand-cream-light/60 p-3 rounded-xl border border-brand-cream-dark/50 text-center">
                <span className="text-[10px] font-bold text-brand-muted uppercase block">Active Conversations</span>
                <span className="text-xl font-serif font-bold text-brand-charcoal">
                  {summary?.guardians.total_conversations ?? 0}
                </span>
              </div>
              <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200 text-center">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Unread Inquiries</span>
                <span className="text-xl font-serif font-bold text-amber-900">
                  {summary?.guardians.unread_messages ?? 0}
                </span>
              </div>
            </div>
            <p className="text-xs text-brand-muted">
              Guardians reach out directly regarding patient welfare, admissions, and visiting schedules.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-brand-cream-dark/40 text-right">
            <Link
              href="/dashboard/messages"
              className="text-xs font-semibold text-brand-primary hover:text-brand-primary-dark"
            >
              Open Support Messages Inbox →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
