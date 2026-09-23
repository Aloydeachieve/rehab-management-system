'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUser } from '@/lib/auth';
import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Users,
  UserCheck,
  UserX,
  Activity,
  Stethoscope,
  ChevronRight,
  Plus,
  RefreshCw
} from 'lucide-react';

interface DoctorAssignment {
  id: number;
  doctor_id: number;
  status: string;
  assigned_at: string;
  doctor?: {
    id: number;
    name: string;
    email: string;
  };
}

interface Patient {
  id: number;
  patient_number: string;
  name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  active_doctor_assignment?: DoctorAssignment | null;
}

export default function PatientDirectoryPage() {
  const { data: currentUser } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');

  // Fetch doctors list for filter
  const { data: doctorsRes } = useQuery({
    queryKey: ['available-doctors'],
    queryFn: async () => (await api.get('/doctors')).data,
  });
  const doctorsList = doctorsRes?.data || [];

  // Fetch patients list with comprehensive filters
  const { data: patientsRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['patients', searchQuery, statusFilter, assignmentFilter, doctorFilter],
    queryFn: async () => {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;
      if (assignmentFilter) params.assignment_status = assignmentFilter;
      if (doctorFilter) params.doctor_id = doctorFilter;
      return (await api.get('/patients', { params })).data;
    },
  });

  const patientsList: Patient[] = patientsRes?.data ?? [];
  const canWrite = currentUser?.roles.includes('admin') || currentUser?.roles.includes('receptionist');

  // Compute directory metrics
  const totalCount = patientsList.length;
  const activeCount = patientsList.filter((p) => p.status === 'active').length;
  const assignedCount = patientsList.filter((p) => !!p.active_doctor_assignment).length;
  const unassignedCount = totalCount - assignedCount;

  return (
    <div className="space-y-6">
      {/* Top Header - Rexora Style */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-brand-cream-dark/50 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-brand-charcoal tracking-tight">Patient Directory</h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-cream-light text-brand-primary border border-brand-cream-dark/60">
              {totalCount} Total
            </span>
          </div>
          <p className="text-xs text-brand-muted mt-1 font-medium">
            Manage clinical responsibility, admissions status, and doctor assignments across all registered patients.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-full border border-brand-cream-dark/60 bg-white hover:bg-brand-cream-light text-brand-muted hover:text-brand-charcoal transition-colors cursor-pointer"
            title="Refresh Directory"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {canWrite && (
            <Link
              href="/dashboard/patients/register"
              className="inline-flex items-center gap-2 rounded-full bg-brand-primary hover:bg-brand-primary-dark px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Register Patient</span>
            </Link>
          )}
        </div>
      </div>

      {/* Overview Stat Cards - Inspired by Image 1 (Rexora Circular Rings & Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div className="bg-white rounded-3xl p-5 border border-brand-cream-dark/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-2xl bg-brand-cream-light flex items-center justify-center text-brand-primary border border-brand-cream-dark/60">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">All Records</span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-brand-charcoal font-serif">{totalCount}</p>
            <p className="text-xs text-brand-muted font-medium mt-0.5">Total Registered</p>
          </div>
        </div>

        {/* Active Residential */}
        <div className="bg-white rounded-3xl p-5 border border-brand-cream-dark/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-200">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">In Residential</span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-brand-charcoal font-serif">{activeCount}</p>
            <p className="text-xs text-brand-muted font-medium mt-0.5">Active Inpatients</p>
          </div>
        </div>

        {/* Assigned to Doctor */}
        <div className="bg-white rounded-3xl p-5 border border-brand-cream-dark/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-2xl bg-brand-cream-light flex items-center justify-center text-brand-primary border border-brand-cream-dark/60">
              <UserCheck className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Physician Care</span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-brand-charcoal font-serif">{assignedCount}</p>
            <p className="text-xs text-brand-muted font-medium mt-0.5">Assigned to Doctor</p>
          </div>
        </div>

        {/* Unassigned */}
        <div className="bg-white rounded-3xl p-5 border border-brand-cream-dark/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-700 border border-amber-200">
              <UserX className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Unassigned</span>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-brand-charcoal font-serif">{unassignedCount}</p>
            <p className="text-xs text-brand-muted font-medium mt-0.5">Needs Doctor Assignment</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar - Payzen Style */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-brand-cream-dark/60 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-muted" />
            <input
              type="text"
              placeholder="Search name, phone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-brand-cream-dark/70 bg-brand-cream-light/30 text-xs text-brand-charcoal placeholder-brand-muted/70 focus:border-brand-primary focus:outline-none focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-brand-cream-dark/70 bg-brand-cream-light/30 text-xs text-brand-charcoal focus:border-brand-primary focus:outline-none focus:bg-white transition-all font-medium cursor-pointer"
            >
              <option value="">All Admission Statuses</option>
              <option value="active">Active Inpatients</option>
              <option value="discharged">Discharged</option>
            </select>
          </div>

          {/* Assignment Status Filter */}
          <div>
            <select
              value={assignmentFilter}
              onChange={(e) => setAssignmentFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-brand-cream-dark/70 bg-brand-cream-light/30 text-xs text-brand-charcoal focus:border-brand-primary focus:outline-none focus:bg-white transition-all font-medium cursor-pointer"
            >
              <option value="">All Assignment States</option>
              <option value="assigned">Assigned to a Physician</option>
              <option value="unassigned">Unassigned (Needs Physician)</option>
            </select>
          </div>

          {/* Specific Doctor Filter */}
          <div>
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-brand-cream-dark/70 bg-brand-cream-light/30 text-xs text-brand-charcoal focus:border-brand-primary focus:outline-none focus:bg-white transition-all font-medium cursor-pointer"
            >
              <option value="">Filter by Attending Doctor</option>
              {doctorsList.map((doc: any) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(searchQuery || statusFilter || assignmentFilter || doctorFilter) && (
          <div className="flex items-center justify-between pt-2 border-t border-brand-cream-dark/30 text-xs text-brand-muted">
            <span>Filtered results active</span>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('');
                setAssignmentFilter('');
                setDoctorFilter('');
              }}
              className="text-xs font-bold text-brand-primary hover:underline cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Patients Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20 bg-white border border-brand-cream-dark/60 rounded-3xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-cream-dark/40 border-t-brand-primary" />
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-800">
          An error occurred while fetching the patient directory. Please reload.
        </div>
      ) : patientsList.length === 0 ? (
        <div className="rounded-3xl border border-brand-cream-dark/60 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-cream-light text-brand-primary mb-3">
            <Users className="h-6 w-6" />
          </div>
          <p className="text-sm font-bold text-brand-charcoal">No patients found</p>
          <p className="text-xs text-brand-muted mt-1">
            No patient records match the selected search or filter criteria.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-brand-cream-dark/60 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-brand-cream-dark/35 text-left text-xs text-brand-charcoal font-medium">
            <thead className="bg-brand-cream/45 text-[10px] font-bold text-brand-charcoal uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Patient Details</th>
                <th className="px-6 py-4">Contact & Enrolled</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Attending Physician</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream-dark/30 bg-white">
              {patientsList.map((patient) => {
                const doc = patient.active_doctor_assignment?.doctor;

                return (
                  <tr key={patient.id} className="hover:bg-brand-cream-light/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-brand-charcoal text-sm">{patient.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-brand-muted">
                            <span className="font-mono font-bold text-brand-primary">{patient.patient_number}</span>
                            <span>&bull;</span>
                            <span className="capitalize">{patient.gender ?? 'N/A'}</span>
                            {patient.date_of_birth && (
                              <>
                                <span>&bull;</span>
                                <span>DOB: {new Date(patient.date_of_birth).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-brand-muted">
                      <p className="text-brand-charcoal font-semibold">{patient.phone ?? 'No Phone'}</p>
                      <p className="text-[11px] mt-0.5">Enrolled {new Date(patient.created_at).toLocaleDateString()}</p>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          patient.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}
                      >
                        {patient.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {doc ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-cream-light text-brand-primary border border-brand-cream-dark/50">
                          <Stethoscope className="h-3.5 w-3.5" />
                          <span className="font-bold text-xs">{doc.name}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                          Unassigned
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/patients/${patient.id}`}
                        className="inline-flex items-center gap-1 rounded-full bg-white border border-brand-cream-dark/60 hover:border-brand-primary hover:bg-brand-cream-light px-4 py-1.5 text-xs font-bold text-brand-charcoal transition-all shadow-sm cursor-pointer"
                      >
                        <span>Profile & Care</span>
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
    </div>
  );
}
