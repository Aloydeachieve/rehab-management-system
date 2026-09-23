'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUser } from '@/lib/auth';
import Link from 'next/link';
import {
  Users,
  Calendar,
  CreditCard,
  Pill,
  Clock,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ChevronRight,
  Filter,
  ArrowUpRight,
  TrendingUp,
  Building2,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DoctorDashboard from './DoctorDashboard';

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

interface AnalyticsData {
  period: string;
  range: {
    start: string;
    end: string;
  };
  patient_activity: Array<{
    month: string;
    registrations: number;
    admissions: number;
  }>;
  revenue_breakdown: {
    total_invoiced: number;
    total_collected: number;
    outstanding_balance: number;
    overdue_balance: number;
    chart_data: Array<{
      name: string;
      value: number;
      color: string;
    }>;
  };
  appointments: {
    pending: number;
    approved: number;
    completed: number;
    cancelled: number;
    total: number;
    chart_data: Array<{
      name: string;
      value: number;
      color: string;
    }>;
  };
  medications: {
    scheduled: number;
    given: number;
    missed: number;
    refused: number;
    cancelled: number;
    total: number;
    chart_data: Array<{
      name: string;
      value: number;
      color: string;
    }>;
  };
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
    active_doctor_assignment?: {
      doctor?: {
        name: string;
      };
    };
  };
  professional?: {
    id: number;
    name: string;
  };
}

export default function DashboardOverviewPage() {
  const { data: user } = useUser();
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'this_month' | 'prev_month' | '3_months' | '6_months'>('this_month');
  const [sessionFilter, setSessionFilter] = useState<'active' | 'expiring' | 'decision_needed' | 'all'>('active');

  const isAdmin = user?.roles.includes('admin');
  const isDoctor = user?.roles.includes('doctor');
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

  // 3. Fetch Visual Analytics with period controls
  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ['dashboard-analytics', analyticsPeriod],
    queryFn: async () => (await api.get(`/dashboard/analytics?period=${analyticsPeriod}`)).data,
    enabled: isStaff,
  });

  // 4. Fetch Treatment Sessions Monitoring
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
    enabled: isStaff,
  });

  // If the logged-in user is a Doctor, render the dedicated Doctor Clinical Workspace!
  if (isDoctor && !isAdmin) {
    return <DoctorDashboard user={user} />;
  }

  const alerts = alertsData?.alerts || [];
  const sessions = sessionsData?.data || [];

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaf6f0] text-[#1f5c43] text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 className="h-3.5 w-3.5" /> Center Operations
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 font-serif">
            Administrative Dashboard
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Real-time patient census, clinical oversight, revenue status, and operational alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/patients/register"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#2F7D5B] hover:bg-[#1f5c43] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <span>+ Intake Patient</span>
          </Link>
          {isAdmin && (
            <Link
              href="/dashboard/staff"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <span>Manage Staff</span>
            </Link>
          )}
        </div>
      </div>

      {/* 2. Top 6 Stat Cards (Guided by Image 1 & 2 aesthetic: Clean white cards, meaningful progress bars) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Registered Patients */}
        <Card className="p-6 bg-white border border-zinc-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Registered Patients</span>
            <div className="h-9 w-9 rounded-2xl bg-[#eaf6f0] text-[#2F7D5B] flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-950">
              {summaryLoading ? '—' : summary?.patients.total_registered ?? 0}
            </span>
            <span className="text-xs font-semibold text-zinc-500">all time</span>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
            <span>Currently Admitted:</span>
            <span className="font-bold text-zinc-900">{summary?.patients.currently_admitted ?? 0}</span>
          </div>
        </Card>

        {/* Card 2: Active Treatment Sessions */}
        <Card className="p-6 bg-white border border-zinc-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Active Sessions</span>
            <div className="h-9 w-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-950">
              {summaryLoading ? '—' : summary?.patients.active_sessions ?? 0}
            </span>
            <span className="text-xs font-semibold text-zinc-500">residential cycles</span>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
            <span>Discharged:</span>
            <span className="font-bold text-zinc-900">{summary?.patients.discharged ?? 0}</span>
          </div>
        </Card>

        {/* Card 3: Pending Appointments */}
        <Card className="p-6 bg-white border border-zinc-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Pending Appointments</span>
            <div className="h-9 w-9 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-700">
              {summaryLoading ? '—' : summary?.appointments.pending ?? 0}
            </span>
            <span className="text-xs font-semibold text-zinc-500">awaiting review</span>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
            <span>Scheduled Today:</span>
            <span className="font-bold text-zinc-900">{summary?.appointments.today ?? 0}</span>
          </div>
        </Card>

        {/* Card 4: Outstanding Balance */}
        <Card className="p-6 bg-white border border-zinc-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Outstanding Balance</span>
            <div className="h-9 w-9 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-zinc-950">
              ₦{summaryLoading ? '—' : Number(summary?.billing.outstanding_balance ?? 0).toLocaleString()}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
            <span>Overdue Invoices:</span>
            <span className="font-bold text-rose-700">{summary?.billing.overdue_count ?? 0}</span>
          </div>
        </Card>

        {/* Card 5: Total Collected */}
        <Card className="p-6 bg-white border border-zinc-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Revenue Collected</span>
            <div className="h-9 w-9 rounded-2xl bg-[#eaf6f0] text-[#2F7D5B] flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#2F7D5B]">
              ₦{summaryLoading ? '—' : Number(summary?.billing.total_collected ?? 0).toLocaleString()}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
            <span>Invoiced Total:</span>
            <span className="font-bold text-zinc-900">₦{Number(summary?.billing.total_invoiced ?? 0).toLocaleString()}</span>
          </div>
        </Card>

        {/* Card 6: Medication Activity Today */}
        <Card className="p-6 bg-white border border-zinc-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Medications Today</span>
            <div className="h-9 w-9 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Pill className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-950">
              {summaryLoading ? '—' : summary?.medications.today_given ?? 0}
            </span>
            <span className="text-xs font-semibold text-zinc-500">
              of {summary?.medications.today_scheduled ?? 0} scheduled given
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
            <span>Missed / Refused:</span>
            <span className={`font-bold ${(summary?.medications.today_missed ?? 0) > 0 ? 'text-rose-600' : 'text-zinc-900'}`}>
              {(summary?.medications.today_missed ?? 0) + (summary?.medications.today_refused ?? 0)}
            </span>
          </div>
        </Card>
      </div>

      {/* 3. Real Visual Analytics Section with Period Controls (PART 10 & 11) */}
      <Card className="p-6 sm:p-8 bg-white border border-zinc-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
        {/* Header with Period Switcher Pills (Guided by Image 1 & 2) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Center Analytics & Activity</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Real historical data aggregated directly from the clinical ledger</p>
          </div>

          {/* Period Selector Tabs */}
          <div className="inline-flex p-1 rounded-full bg-zinc-100 border border-zinc-200/60 self-start sm:self-auto text-xs font-semibold">
            <button
              onClick={() => setAnalyticsPeriod('this_month')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                analyticsPeriod === 'this_month' ? 'bg-[#2F7D5B] text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setAnalyticsPeriod('prev_month')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                analyticsPeriod === 'prev_month' ? 'bg-[#2F7D5B] text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Prev Month
            </button>
            <button
              onClick={() => setAnalyticsPeriod('3_months')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                analyticsPeriod === '3_months' ? 'bg-[#2F7D5B] text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              3 Months
            </button>
            <button
              onClick={() => setAnalyticsPeriod('6_months')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                analyticsPeriod === '6_months' ? 'bg-[#2F7D5B] text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              6 Months
            </button>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
          {/* Chart A: Patient Activity (7 Cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-900">Patient Activity (Registrations & Admissions)</span>
              <span className="text-xs text-zinc-400">Monthly Volume</span>
            </div>
            <div className="h-64 w-full pt-2">
              {analyticsLoading ? (
                <div className="h-full flex items-center justify-center text-xs text-zinc-400">Loading chart...</div>
              ) : (analytics?.patient_activity?.length ?? 0) === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-zinc-400">No activity in period</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.patient_activity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: '#111827', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="registrations" name="New Patients" fill="#2F7D5B" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="admissions" name="Admissions" fill="#D97706" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart B: Revenue Breakdown Donut (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-900">Revenue Settlement</span>
              <span className="text-xs text-zinc-400">Collected vs Outstanding</span>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              {analyticsLoading ? (
                <div className="text-xs text-zinc-400">Loading chart...</div>
              ) : (analytics?.revenue_breakdown?.total_invoiced ?? 0) === 0 ? (
                <div className="text-xs text-zinc-400">No invoices in selected period</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics?.revenue_breakdown?.chart_data}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {analytics?.revenue_breakdown?.chart_data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(val: any) => [`₦${Number(val).toLocaleString()}`, 'Amount']}
                      contentStyle={{ backgroundColor: '#111827', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 text-xs">
              <div>
                <span className="text-zinc-500">Collected:</span>
                <span className="font-bold text-[#2F7D5B] block">₦{Number(analytics?.revenue_breakdown?.total_collected ?? 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-zinc-500">Outstanding:</span>
                <span className="font-bold text-amber-700 block">₦{Number(analytics?.revenue_breakdown?.outstanding_balance ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Priority Operational Alerts (PART 12 - Clean left border accent, priority system) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Action Required & Operational Alerts</h2>
            <Badge variant="secondary" className="bg-rose-50 text-rose-700 border-rose-200">
              {alerts.length} Pending
            </Badge>
          </div>
          <span className="text-xs text-zinc-500">Auto-refreshes every 15s</span>
        </div>

        {alertsLoading ? (
          <div className="p-8 text-center text-xs text-zinc-400 bg-white rounded-2xl border border-zinc-200">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <Card className="p-8 text-center bg-white border border-zinc-200/80">
            <div className="h-10 w-10 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold text-zinc-900">All Operations Clear</p>
            <p className="text-xs text-zinc-500 mt-0.5">No urgent billing, medication, or intake tasks requiring triage.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.map((alert) => {
              const isHigh = alert.severity === 'high';
              const isMed = alert.severity === 'medium';

              return (
                <div
                  key={alert.id}
                  className={`p-5 rounded-2xl bg-white border transition-all hover:shadow-md flex flex-col justify-between ${
                    isHigh
                      ? 'border-l-4 border-l-rose-600 border-zinc-200/80 shadow-2xs'
                      : isMed
                      ? 'border-l-4 border-l-amber-500 border-zinc-200/80 shadow-2xs'
                      : 'border-l-4 border-l-[#2F7D5B] border-zinc-200/80 shadow-2xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        {alert.category}
                      </span>
                      <Badge
                        variant={isHigh ? 'destructive' : isMed ? 'warning' : 'secondary'}
                        className="text-[10px] px-2 py-0.5"
                      >
                        {isHigh ? 'CRITICAL' : isMed ? 'WARNING' : 'INFO'}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-bold text-zinc-950 leading-tight">{alert.title}</h3>
                    <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">{alert.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400">
                      {new Date(alert.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <Link
                      href={alert.action_url}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#2F7D5B] hover:text-[#1f5c43] transition-colors"
                    >
                      <span>{alert.action_label}</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Treatment Session Monitoring (PART 13) */}
      <Card className="p-6 sm:p-8 bg-white border border-zinc-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Residential Treatment Sessions</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Monitoring 30-day residential care cycles, payments, and clinical decisions</p>
          </div>

          {/* Filter Pills */}
          <div className="inline-flex p-1 rounded-full bg-zinc-100 border border-zinc-200/60 self-start sm:self-auto text-xs font-semibold">
            <button
              onClick={() => setSessionFilter('active')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                sessionFilter === 'active' ? 'bg-[#2F7D5B] text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setSessionFilter('expiring')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                sessionFilter === 'expiring' ? 'bg-[#2F7D5B] text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Expiring Soon
            </button>
            <button
              onClick={() => setSessionFilter('decision_needed')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                sessionFilter === 'decision_needed' ? 'bg-[#2F7D5B] text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Needs Decision
            </button>
            <button
              onClick={() => setSessionFilter('all')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                sessionFilter === 'all' ? 'bg-[#2F7D5B] text-white shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Sessions Table / Cards */}
        {sessionsLoading ? (
          <div className="p-8 text-center text-xs text-zinc-400">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400">No treatment sessions found matching this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Cycle</th>
                  <th className="py-3 px-4">Primary Doctor</th>
                  <th className="py-3 px-4">Days Remaining</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Decision State</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {sessions.map((s) => {
                  const doctorName = s.patient?.active_doctor_assignment?.doctor?.name ?? 'Unassigned';

                  return (
                    <tr key={s.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-zinc-900">
                        <Link href={`/dashboard/patients/${s.patient_id}`} className="hover:text-[#2F7D5B]">
                          {s.patient?.name ?? `Patient #${s.patient_id}`}
                        </Link>
                        <span className="block text-[10px] text-zinc-400 font-mono">{s.patient?.patient_number}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-zinc-800">
                        Cycle #{s.session_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-zinc-800 font-medium">{doctorName}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant="secondary"
                          className={s.is_approaching_end ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}
                        >
                          {s.days_remaining !== undefined ? `${s.days_remaining} days` : 'Active'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={s.payment_status === 'paid' ? 'success' : s.payment_status === 'partially_paid' ? 'warning' : 'destructive'}
                          className="capitalize"
                        >
                          {s.payment_status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        {s.reassessed_at ? (
                          <span className="text-emerald-700 font-medium">Reassessed</span>
                        ) : (
                          <span className="text-amber-700 font-medium">Awaiting Reassessment</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/dashboard/sessions/${s.id}`}
                          className="inline-flex items-center gap-1 font-bold text-[#2F7D5B] hover:text-[#1f5c43]"
                        >
                          <span>Manage</span>
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
