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
    <div className="space-y-6">
      {/* Search & Actions Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto">
          {/* Search bar */}
          <div className="w-full sm:w-80">
            <input
              type="text"
              placeholder="Search by name, number, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm placeholder-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Status filter */}
          <div className="w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 bg-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
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
            className="w-full sm:w-auto text-center rounded-full bg-teal-600 hover:bg-teal-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
          >
            + Register Patient
          </Link>
        )}
      </div>

      {/* Patients Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20 bg-white border border-zinc-200 rounded-2xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-teal-600" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-800">
          An error occurred while fetching the patient directory. Please reload.
        </div>
      ) : patientsList.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center">
          <span className="text-4xl block mb-4">👤</span>
          <p className="text-sm font-semibold text-zinc-800">No patients registered</p>
          <p className="text-xs text-zinc-400 mt-1">There are no patient records matching the current filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-zinc-200 text-left text-sm text-zinc-500">
            <thead className="bg-zinc-50 text-xs font-semibold text-zinc-700 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Patient ID</th>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">DOB & Gender</th>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {patientsList.map((patient) => (
                <tr key={patient.id} className="hover:bg-zinc-50/50">
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-zinc-900">
                    {patient.patient_number}
                  </td>
                  <td className="px-6 py-4 font-semibold text-zinc-800">
                    {patient.name}
                  </td>
                  <td className="px-6 py-4 capitalize">
                    {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}{' '}
                    <span className="text-zinc-400">({patient.gender ?? 'N/A'})</span>
                  </td>
                  <td className="px-6 py-4">
                    {patient.phone ?? <span className="text-zinc-400">None</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                        patient.status === 'active'
                          ? 'bg-teal-50 text-teal-800 ring-teal-600/20'
                          : 'bg-zinc-50 text-zinc-800 ring-zinc-600/20'
                      }`}
                    >
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/patients/${patient.id}`}
                      className="rounded-full bg-white border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-sm"
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
