'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUser } from '@/lib/auth';
import { useState } from 'react';
import Link from 'next/link';

interface Patient {
  id: number;
  patient_number: string;
  name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  status: string;
  created_at: string;
}

export default function PatientDirectoryPage() {
  const { data: currentUser } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch patients list
  const { data: patientsRes, isLoading, isError } = useQuery({
    queryKey: ['patients', searchQuery, statusFilter],
    queryFn: async () => {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;
      return (await api.get('/patients', { params })).data;
    },
  });

  const patientsList: Patient[] = patientsRes?.data ?? [];
  const canWrite = currentUser?.roles.includes('admin') || currentUser?.roles.includes('receptionist');

  return (
    <div className="space-y-8">
      {/* Search & Actions Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-5 rounded-2xl border border-brand-cream-dark/60 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto">
          {/* Search bar */}
          <div className="w-full sm:w-80">
            <input
              type="text"
              placeholder="Search by name, number, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
            />
          </div>

          {/* Status filter */}
          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal bg-white focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="discharged">Discharged</option>
            </select>
          </div>
        </div>

        {canWrite && (
          <Link
            href="/dashboard/patients/register"
            className="w-full sm:w-auto text-center rounded-full bg-brand-accent hover:bg-brand-accent-dark px-6 py-3 text-xs font-semibold text-white shadow-md shadow-brand-accent/20 hover:shadow-lg hover:shadow-brand-accent/35 transition-all duration-300 transform hover:scale-[1.01] cursor-pointer"
          >
            + Register Patient
          </Link>
        )}
      </div>

      {/* Patients Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20 bg-white border border-brand-cream-dark/60 rounded-2xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-cream-dark/40 border-t-brand-accent" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-800">
          An error occurred while fetching the patient directory. Please reload.
        </div>
      ) : patientsList.length === 0 ? (
        <div className="rounded-2xl border border-brand-cream-dark/60 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-cream text-brand-primary mb-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-brand-charcoal">No patients registered</p>
          <p className="text-xs text-brand-muted mt-1.5 leading-relaxed">There are no patient records matching the current filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-brand-cream-dark/60 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-brand-cream-dark/35 text-left text-sm text-brand-charcoal-light">
            <thead className="bg-brand-cream/45 text-xs font-bold text-brand-charcoal uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Patient ID</th>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">DOB & Gender</th>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream-dark/30 bg-white">
              {patientsList.map((patient) => (
                <tr key={patient.id} className="hover:bg-brand-cream/10 transition-colors duration-150">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-brand-primary">
                    {patient.patient_number}
                  </td>
                  <td className="px-6 py-4 font-semibold text-brand-charcoal">
                    {patient.name}
                  </td>
                  <td className="px-6 py-4 capitalize text-brand-charcoal-light font-medium">
                    {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}{' '}
                    <span className="text-brand-muted text-xs">({patient.gender ?? 'N/A'})</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-brand-charcoal-light">
                    {patient.phone ?? <span className="text-brand-muted">None</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                        patient.status === 'active'
                          ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/20'
                          : 'bg-brand-cream text-brand-charcoal-light ring-brand-cream-dark/40'
                      }`}
                    >
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/patients/${patient.id}`}
                      className="rounded-full bg-white border border-brand-cream-dark/60 hover:border-brand-primary/45 px-4.5 py-1.5 text-xs font-bold text-brand-charcoal hover:bg-brand-cream/10 transition-all shadow-sm cursor-pointer"
                    >
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
