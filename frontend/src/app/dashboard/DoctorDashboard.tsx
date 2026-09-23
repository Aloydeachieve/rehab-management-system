'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  Users,
  AlertCircle,
  Clock,
  ClipboardCheck,
  FileText,
  Activity,
  ArrowUpRight,
  Pill,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Stethoscope,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DoctorSummaryData {
  doctor_name: string;
  statistics: {
    active_patients: number;
    patients_requiring_review: number;
    sessions_ending_soon: number;
    pending_reassessments: number;
    recent_observations: number;
  };
  patients: Array<{
    id: number;
    patient_number: string;
    name: string;
    gender: string;
    date_of_birth: string | null;
    status: string;
    active_session?: {
      id: number;
      session_number: number;
      status: string;
      payment_status: string;
      days_remaining: number | null;
      is_ending_soon: boolean;
      reassessed_at: string | null;
    } | null;
    last_observation?: {
      id: number;
      note_type: string;
      content: string;
      recorded_at: string;
      practitioner_name?: string;
    } | null;
    last_assessment?: {
      id: number;
      assessment_type: string;
      recorded_at: string;
    } | null;
    active_prescriptions_count: number;
    today_medications: {
      total: number;
      given: number;
      missed: number;
    };
    alert?: string | null;
  }>;
  generated_at: string;
}

export default function DoctorDashboard({ user }: { user: any }) {
  const { data, isLoading, isError } = useQuery<DoctorSummaryData>({
    queryKey: ['doctor-dashboard'],
    queryFn: async () => (await api.get('/dashboard/doctor')).data,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-[#2F7D5B]" />
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Loading Clinical Workspace...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8 rounded-3xl bg-red-50 border border-red-200 text-center">
        <p className="text-sm font-semibold text-red-800">Failed to load clinical workspace. Please refresh.</p>
      </div>
    );
  }

  const { statistics, patients } = data;

  return (
    <div className="space-y-8">
      {/* 1. Clinical Header (Aesthetic inspired by Image 1: "Today's Nursing" / Doctor Workspace) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaf6f0] text-[#1f5c43] text-xs font-bold uppercase tracking-wider mb-2">
            <Stethoscope className="h-3.5 w-3.5" /> Clinical Workspace
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 font-serif">
            Good morning, Dr. {user.name.replace(/^Dr\.?\s*/i, '')}
          </h1>
          <p className="text-sm text-zinc-600 mt-1">
            Your assigned patients, clinical observations, and today&apos;s active treatment tasks.
          </p>
        </div>

        <Link
          href="/dashboard/patients"
          className="inline-flex items-center gap-2 self-start sm:self-auto px-5 py-2.5 rounded-full bg-[#2F7D5B] text-white text-xs font-bold shadow-xs hover:bg-[#1f5c43] transition-all cursor-pointer"
        >
          <span>All My Patients</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* 2. Patient Care Overview Card (Guided by UI Reference Image 1) */}
      <Card className="p-6 sm:p-8 bg-white border border-zinc-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Clinical Care Overview</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Key caseload indicators and treatment decision readiness</p>
          </div>
          <Badge variant="secondary" className="font-semibold text-xs px-3 py-1 bg-[#eaf6f0] text-[#1f5c43]">
            Active Shift
          </Badge>
        </div>

        {/* Milestone Progress Bar (Guided by Image 1 milestone bar) */}
        <div className="my-6">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-600 mb-2">
            <span>Treatment Trajectory</span>
            <span>{statistics.active_patients > 0 ? Math.round(((statistics.active_patients - statistics.patients_requiring_review) / statistics.active_patients) * 100) : 100}% on schedule</span>
          </div>
          <div className="relative h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#2F7D5B] to-[#3d9970] rounded-full transition-all duration-700"
              style={{
                width: `${statistics.active_patients > 0 ? Math.max(15, Math.min(100, Math.round(((statistics.active_patients - statistics.patients_requiring_review) / statistics.active_patients) * 100))) : 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-semibold text-zinc-400 mt-2 px-1">
            <span>Intake & Stabilize</span>
            <span>Intensive Session</span>
            <span>Reassessment</span>
            <span>Discharge Ready</span>
          </div>
        </div>

        {/* 4 Circular Metric Tiles (Directly inspired by Image 1: Total Patients, Stable, Critical, Discharges) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Tile 1: Active Patients */}
          <div className="p-4 rounded-2xl bg-[#f7f9f7] border border-zinc-200/60 flex flex-col items-center text-center">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-full border-2 border-[#2F7D5B] text-[#2F7D5B] mb-2 bg-white shadow-2xs">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-zinc-600">Assigned Patients</span>
            <span className="text-2xl font-extrabold text-zinc-950 mt-1">{statistics.active_patients}</span>
          </div>

          {/* Tile 2: Requiring Review */}
          <div className="p-4 rounded-2xl bg-[#f7f9f7] border border-zinc-200/60 flex flex-col items-center text-center">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-full border-2 border-amber-500 text-amber-600 mb-2 bg-white shadow-2xs">
              <AlertCircle className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-zinc-600">Requires Review</span>
            <span className="text-2xl font-extrabold text-amber-700 mt-1">{statistics.patients_requiring_review}</span>
          </div>

          {/* Tile 3: Ending Soon */}
          <div className="p-4 rounded-2xl bg-[#f7f9f7] border border-zinc-200/60 flex flex-col items-center text-center">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-full border-2 border-indigo-400 text-indigo-600 mb-2 bg-white shadow-2xs">
              <Clock className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-zinc-600">Sessions Ending Soon</span>
            <span className="text-2xl font-extrabold text-indigo-900 mt-1">{statistics.sessions_ending_soon}</span>
          </div>

          {/* Tile 4: Observations Logged */}
          <div className="p-4 rounded-2xl bg-[#f7f9f7] border border-zinc-200/60 flex flex-col items-center text-center">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-full border-2 border-emerald-500 text-emerald-600 mb-2 bg-white shadow-2xs">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold text-zinc-600">Recent Observations</span>
            <span className="text-2xl font-extrabold text-zinc-950 mt-1">{statistics.recent_observations}</span>
          </div>
        </div>
      </Card>

      {/* 3. Assigned Patients Clinical Roster */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">My Assigned Patients</h2>
            <p className="text-xs text-zinc-500">Day-to-day clinical ownership and observations</p>
          </div>
          <span className="text-xs font-semibold text-zinc-500">
            {patients.length} {patients.length === 1 ? 'Patient' : 'Patients'} under your care
          </span>
        </div>

        {patients.length === 0 ? (
          <Card className="p-12 text-center bg-white border border-zinc-200">
            <div className="h-12 w-12 mx-auto rounded-full bg-[#eaf6f0] text-[#2F7D5B] flex items-center justify-center mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-900">No Patients Currently Assigned</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              When an administrator assigns patients to your care, their complete clinical records, sessions, and observations will appear here.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {patients.map((pt) => {
              const session = pt.active_session;
              const hasAlert = !!pt.alert;

              return (
                <Card
                  key={pt.id}
                  className={`p-6 bg-white border transition-all hover:shadow-md ${
                    hasAlert ? 'border-amber-300 ring-1 ring-amber-100' : 'border-zinc-200/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-zinc-950 hover:text-[#2F7D5B] transition-colors">
                          <Link href={`/dashboard/patients/${pt.id}`}>{pt.name}</Link>
                        </h3>
                        <Badge variant="outline" className="text-[10px] font-mono text-zinc-600 bg-zinc-50">
                          {pt.patient_number}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {pt.gender ? pt.gender.charAt(0).toUpperCase() + pt.gender.slice(1) : 'Patient'}
                        {pt.date_of_birth ? ` • DOB: ${pt.date_of_birth}` : ''}
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/patients/${pt.id}`}
                      className="p-2 rounded-xl bg-zinc-50 hover:bg-[#eaf6f0] text-zinc-600 hover:text-[#2F7D5B] transition-colors cursor-pointer"
                      title="Open clinical workspace"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {/* Alert Tag if any */}
                  {hasAlert && (
                    <div className="mt-3.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs font-semibold text-amber-800">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{pt.alert}</span>
                    </div>
                  )}

                  {/* Session Status & Days */}
                  <div className="mt-4 pt-3.5 border-t border-zinc-100 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Residential Session</span>
                      {session ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-bold text-zinc-800">Cycle #{session.session_number}</span>
                          <Badge
                            variant="secondary"
                            className={session.is_ending_soon ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}
                          >
                            {session.days_remaining !== null ? `${session.days_remaining}d remaining` : 'Active'}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-zinc-500 font-medium">No active session</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Medications Today</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-bold text-zinc-800 flex items-center gap-1">
                          <Pill className="h-3.5 w-3.5 text-[#2F7D5B]" />
                          {pt.active_prescriptions_count} Active
                        </span>
                        {pt.today_medications.missed > 0 ? (
                          <span className="text-rose-600 font-semibold text-[11px] flex items-center gap-0.5">
                            <XCircle className="h-3 w-3" /> {pt.today_medications.missed} Missed
                          </span>
                        ) : pt.today_medications.given > 0 ? (
                          <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-0.5">
                            <CheckCircle2 className="h-3 w-3" /> {pt.today_medications.given} Given
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Last Clinical Observation */}
                  <div className="mt-3.5 pt-3 border-t border-zinc-100">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Last Observation
                    </span>
                    {pt.last_observation ? (
                      <div className="mt-1">
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 mr-2">
                          {pt.last_observation.note_type}
                        </span>
                        <span className="text-xs text-zinc-700 italic truncate inline-block max-w-[280px] align-middle">
                          &ldquo;{pt.last_observation.content}&rdquo;
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 italic mt-0.5">No observations recorded yet</p>
                    )}
                  </div>

                  {/* Action Link */}
                  <div className="mt-5">
                    <Link
                      href={`/dashboard/patients/${pt.id}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-zinc-900 hover:bg-[#2F7D5B] text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Stethoscope className="h-3.5 w-3.5" />
                      <span>Open Clinical Workspace</span>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
