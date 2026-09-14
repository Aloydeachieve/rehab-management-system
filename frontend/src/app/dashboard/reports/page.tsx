'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUser } from '@/lib/auth';
import Link from 'next/link';

type ReportType = 'patients' | 'treatment-sessions' | 'billing' | 'payments' | 'medications' | 'appointments';

export default function ReportsPage() {
  const { data: user, isLoading: userLoading } = useUser();

  const [activeTab, setActiveTab] = useState<ReportType>('patients');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const isAdmin = user?.roles.includes('admin');
  const isReceptionist = user?.roles.includes('receptionist');

  // Fetch report data
  const { data: reportData, isLoading, isError, error } = useQuery({
    queryKey: ['report', activeTab, statusFilter, fromDate, toDate, searchQuery, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', page.toString());
      params.append('per_page', '15');

      const res = await api.get(`/reports/${activeTab}?${params.toString()}`);
      return res.data;
    },
    enabled: !!user && (isAdmin || isReceptionist),
  });

  const handleTabChange = (tab: ReportType) => {
    setActiveTab(tab);
    setStatusFilter('all');
    setSearchQuery('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const handleResetFilters = () => {
    setStatusFilter('all');
    setFromDate('');
    setToDate('');
    setSearchQuery('');
    setPage(1);
  };

  if (userLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-brand-primary" />
          <span className="text-xs text-brand-muted">Loading reports portal...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin && !isReceptionist) {
    return (
      <div className="rounded-2xl border border-brand-cream-dark/60 bg-white p-8 text-center max-w-xl mx-auto shadow-sm my-12">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h2 className="font-serif text-xl font-bold text-brand-charcoal">Unauthorized Access</h2>
        <p className="mt-2 text-xs text-brand-muted leading-relaxed">
          The administrative and operational reporting suite is reserved for Facility Administrators and Operational Front-Desk staff.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-primary-dark transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Handle pagination extraction (billing & payments return { paginator, summary })
  const paginator = reportData?.paginator ?? (reportData?.data ? reportData : null);
  const records = paginator?.data ?? [];
  const summary = reportData?.summary;
  const totalPages = paginator?.last_page ?? 1;
  const totalRecords = paginator?.total ?? records.length;

  return (
    <div className="space-y-8">
      {/* Page Header Banner */}
      <div className="rounded-2xl border border-brand-cream-dark/60 bg-white p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full filter blur-2xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-accent">Analytics & Regulatory Compliance</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-brand-charcoal sm:text-3xl">
            Operational & Clinical Reports
          </h2>
          <p className="mt-1 text-xs text-brand-charcoal-light font-medium">
            Generate, filter, and audit cross-departmental records for patients, treatment sessions, billing ledgers, medication administrations, and appointments.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl border border-brand-cream-dark/60 bg-white px-4 py-2.5 text-xs font-semibold text-brand-charcoal hover:bg-brand-cream transition shadow-xs cursor-pointer"
        >
          <svg className="h-4 w-4 text-brand-muted" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.656h10.5z" />
          </svg>
          Print Report
        </button>
      </div>

      {/* Report Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-brand-cream-dark/60 pb-3">
        <button
          onClick={() => handleTabChange('patients')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'patients'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'bg-white text-brand-charcoal hover:bg-brand-cream border border-brand-cream-dark/60'
          }`}
        >
          Patient / Admissions
        </button>

        <button
          onClick={() => handleTabChange('treatment-sessions')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'treatment-sessions'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'bg-white text-brand-charcoal hover:bg-brand-cream border border-brand-cream-dark/60'
          }`}
        >
          Treatment Sessions
        </button>

        <button
          onClick={() => handleTabChange('billing')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'billing'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'bg-white text-brand-charcoal hover:bg-brand-cream border border-brand-cream-dark/60'
          }`}
        >
          Billing & Invoices
        </button>

        <button
          onClick={() => handleTabChange('payments')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'payments'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'bg-white text-brand-charcoal hover:bg-brand-cream border border-brand-cream-dark/60'
          }`}
        >
          Payment Transactions
        </button>

        {/* Medication Report: Admin Only */}
        {isAdmin ? (
          <button
            onClick={() => handleTabChange('medications')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
              activeTab === 'medications'
                ? 'bg-brand-primary text-white shadow-xs'
                : 'bg-white text-brand-charcoal hover:bg-brand-cream border border-brand-cream-dark/60'
            }`}
          >
            Medication eMAR
          </button>
        ) : (
          <div
            title="Clinical Medication Reports are restricted to Clinical Administrators"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-brand-cream-dark/30 text-brand-muted/70 border border-brand-cream-dark/40 cursor-not-allowed flex items-center gap-1.5"
          >
            <span>🔒</span> Medication eMAR
          </div>
        )}

        <button
          onClick={() => handleTabChange('appointments')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'appointments'
              ? 'bg-brand-primary text-white shadow-xs'
              : 'bg-white text-brand-charcoal hover:bg-brand-cream border border-brand-cream-dark/60'
          }`}
        >
          Appointments
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="rounded-2xl border border-brand-cream-dark/60 bg-white p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div>
            <label className="block text-[11px] font-bold text-brand-charcoal mb-1 uppercase tracking-wide">Search</label>
            <input
              type="text"
              placeholder="Search name, ID, reference..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full bg-brand-cream-light/50 border border-brand-cream-dark/60 rounded-xl px-3 py-2 text-xs text-brand-charcoal focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-brand-charcoal mb-1 uppercase tracking-wide">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-brand-cream-light/50 border border-brand-cream-dark/60 rounded-xl px-3 py-2 text-xs text-brand-charcoal focus:ring-2 focus:ring-brand-primary focus:outline-none"
            >
              <option value="all">All Statuses</option>
              {activeTab === 'patients' && (
                <>
                  <option value="active">Active</option>
                  <option value="discharged">Discharged</option>
                  <option value="registered">Registered</option>
                </>
              )}
              {activeTab === 'treatment-sessions' && (
                <>
                  <option value="active">Active Sessions</option>
                  <option value="completed">Completed Sessions</option>
                  <option value="discharged">Discharged Sessions</option>
                </>
              )}
              {activeTab === 'billing' && (
                <>
                  <option value="unpaid">Unpaid</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </>
              )}
              {activeTab === 'payments' && (
                <>
                  <option value="successful">Successful</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </>
              )}
              {activeTab === 'medications' && (
                <>
                  <option value="scheduled">Scheduled</option>
                  <option value="given">Given</option>
                  <option value="missed">Missed</option>
                  <option value="refused">Refused</option>
                  <option value="cancelled">Cancelled</option>
                </>
              )}
              {activeTab === 'appointments' && (
                <>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="rescheduled">Rescheduled</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </>
              )}
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-[11px] font-bold text-brand-charcoal mb-1 uppercase tracking-wide">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="w-full bg-brand-cream-light/50 border border-brand-cream-dark/60 rounded-xl px-3 py-2 text-xs text-brand-charcoal focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-[11px] font-bold text-brand-charcoal mb-1 uppercase tracking-wide">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="w-full bg-brand-cream-light/50 border border-brand-cream-dark/60 rounded-xl px-3 py-2 text-xs text-brand-charcoal focus:ring-2 focus:ring-brand-primary focus:outline-none"
            />
          </div>
        </div>

        {(statusFilter !== 'all' || fromDate || toDate || searchQuery) && (
          <div className="flex items-center justify-between pt-2 border-t border-brand-cream-dark/40 text-xs">
            <span className="text-brand-muted">Active filters applied</span>
            <button
              onClick={handleResetFilters}
              className="text-brand-accent hover:underline font-bold cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Summary Statistics Banner if available */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {activeTab === 'billing' && (
            <>
              <div className="rounded-2xl border border-brand-cream-dark/60 bg-white p-5 shadow-xs">
                <span className="text-[11px] font-bold text-brand-muted uppercase">Filtered Invoiced</span>
                <p className="text-2xl font-serif font-bold text-brand-charcoal mt-1">
                  ₦{summary.total_amount?.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs">
                <span className="text-[11px] font-bold text-emerald-800 uppercase">Filtered Collected</span>
                <p className="text-2xl font-serif font-bold text-emerald-800 mt-1">
                  ₦{summary.total_paid?.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
                <span className="text-[11px] font-bold text-amber-800 uppercase">Filtered Balance Due</span>
                <p className="text-2xl font-serif font-bold text-amber-900 mt-1">
                  ₦{summary.total_balance?.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </>
          )}

          {activeTab === 'payments' && (
            <>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs">
                <span className="text-[11px] font-bold text-emerald-800 uppercase">Total Collected</span>
                <p className="text-2xl font-serif font-bold text-emerald-800 mt-1">
                  ₦{summary.total_collected?.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="rounded-2xl border border-brand-cream-dark/60 bg-white p-5 shadow-xs">
                <span className="text-[11px] font-bold text-brand-muted uppercase">Transactions Logged</span>
                <p className="text-2xl font-serif font-bold text-brand-charcoal mt-1">
                  {summary.total_transactions}
                </p>
              </div>
              <div className="rounded-2xl border border-brand-cream-dark/60 bg-white p-5 shadow-xs">
                <span className="text-[11px] font-bold text-brand-muted uppercase">Records Found</span>
                <p className="text-2xl font-serif font-bold text-brand-charcoal mt-1">
                  {totalRecords}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Main Report Data Table */}
      <div className="rounded-2xl border border-brand-cream-dark/60 bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-brand-cream-dark/60 flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-brand-charcoal text-base capitalize">
              {activeTab.replace('-', ' ')} Ledger
            </h3>
            <p className="text-xs text-brand-muted mt-0.5">
              Showing {records.length} of {totalRecords} total entries
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-brand-primary mx-auto mb-3" />
            <p className="text-xs text-brand-muted font-medium">Generating report dataset...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-600 text-xs">
            Failed to load report data: {(error as any)?.response?.data?.message || 'Unauthorized or server error.'}
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-3xl block mb-2">📊</span>
            <p className="text-sm font-semibold text-brand-charcoal">No report entries found</p>
            <p className="text-xs text-brand-muted mt-1">Try broadening your date range or adjusting status filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-brand-charcoal">
              <thead className="bg-brand-cream-light/60 border-b border-brand-cream-dark/60 text-[11px] font-bold text-brand-charcoal-light uppercase tracking-wider">
                {activeTab === 'patients' && (
                  <tr>
                    <th className="px-5 py-3.5">Patient Number</th>
                    <th className="px-5 py-3.5">Full Name</th>
                    <th className="px-5 py-3.5">Gender</th>
                    <th className="px-5 py-3.5">Admission Date</th>
                    <th className="px-5 py-3.5">Type</th>
                    <th className="px-5 py-3.5">Current Session</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                )}
                {activeTab === 'treatment-sessions' && (
                  <tr>
                    <th className="px-5 py-3.5">Patient</th>
                    <th className="px-5 py-3.5">Session #</th>
                    <th className="px-5 py-3.5">Session Price</th>
                    <th className="px-5 py-3.5">Start Date</th>
                    <th className="px-5 py-3.5">Expected End</th>
                    <th className="px-5 py-3.5">Practitioner</th>
                    <th className="px-5 py-3.5">Payment</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                )}
                {activeTab === 'billing' && (
                  <tr>
                    <th className="px-5 py-3.5">Invoice #</th>
                    <th className="px-5 py-3.5">Patient</th>
                    <th className="px-5 py-3.5">Session</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Paid</th>
                    <th className="px-5 py-3.5">Balance</th>
                    <th className="px-5 py-3.5">Due Date</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                )}
                {activeTab === 'payments' && (
                  <tr>
                    <th className="px-5 py-3.5">Reference</th>
                    <th className="px-5 py-3.5">Invoice #</th>
                    <th className="px-5 py-3.5">Patient</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Method</th>
                    <th className="px-5 py-3.5">Paid At</th>
                    <th className="px-5 py-3.5">Recorded By</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                )}
                {activeTab === 'medications' && (
                  <tr>
                    <th className="px-5 py-3.5">Patient</th>
                    <th className="px-5 py-3.5">Medication</th>
                    <th className="px-5 py-3.5">Dosage</th>
                    <th className="px-5 py-3.5">Scheduled Time</th>
                    <th className="px-5 py-3.5">Administered Time</th>
                    <th className="px-5 py-3.5">Staff</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                )}
                {activeTab === 'appointments' && (
                  <tr>
                    <th className="px-5 py-3.5">Visitor / Patient</th>
                    <th className="px-5 py-3.5">Contact Phone</th>
                    <th className="px-5 py-3.5">Reason</th>
                    <th className="px-5 py-3.5">Date & Time</th>
                    <th className="px-5 py-3.5">Assigned Staff</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                )}
              </thead>

              <tbody className="divide-y divide-brand-cream-dark/40">
                {activeTab === 'patients' &&
                  records.map((item: any) => (
                    <tr key={item.id} className="hover:bg-brand-cream/10 transition">
                      <td className="px-5 py-3.5 font-mono font-semibold text-brand-primary">{item.patient_number}</td>
                      <td className="px-5 py-3.5 font-medium">{item.patient_name}</td>
                      <td className="px-5 py-3.5 capitalize">{item.gender}</td>
                      <td className="px-5 py-3.5">{item.admission_date || 'N/A'}</td>
                      <td className="px-5 py-3.5 capitalize">{item.admission_type || 'N/A'}</td>
                      <td className="px-5 py-3.5">
                        {item.current_session_number ? `Session #${item.current_session_number}` : 'None'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                {activeTab === 'treatment-sessions' &&
                  records.map((item: any) => (
                    <tr key={item.id} className="hover:bg-brand-cream/10 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold">{item.patient_name}</div>
                        <div className="font-mono text-[11px] text-brand-muted">{item.patient_number}</div>
                      </td>
                      <td className="px-5 py-3.5 font-bold">Session #{item.session_number}</td>
                      <td className="px-5 py-3.5 font-semibold">
                        ₦{parseFloat(item.session_price || '0').toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">{item.start_date}</td>
                      <td className="px-5 py-3.5">{item.expected_end_date}</td>
                      <td className="px-5 py-3.5">{item.assigned_practitioner}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.payment_status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 capitalize font-medium">{item.status}</td>
                    </tr>
                  ))}

                {activeTab === 'billing' &&
                  records.map((item: any) => (
                    <tr key={item.id} className="hover:bg-brand-cream/10 transition">
                      <td className="px-5 py-3.5 font-mono font-semibold text-brand-primary">{item.invoice_number}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold">{item.patient_name}</div>
                        <div className="font-mono text-[11px] text-brand-muted">{item.patient_number}</div>
                      </td>
                      <td className="px-5 py-3.5">{item.session_number ? `Session #${item.session_number}` : 'General'}</td>
                      <td className="px-5 py-3.5 font-semibold">₦{parseFloat(item.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3.5 text-emerald-700">₦{parseFloat(item.amount_paid).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3.5 font-bold text-amber-800">₦{parseFloat(item.balance).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3.5">{item.due_date}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                {activeTab === 'payments' &&
                  records.map((item: any) => (
                    <tr key={item.id} className="hover:bg-brand-cream/10 transition">
                      <td className="px-5 py-3.5 font-mono font-semibold text-brand-primary">{item.reference}</td>
                      <td className="px-5 py-3.5 font-mono text-[11px]">{item.invoice_number || 'N/A'}</td>
                      <td className="px-5 py-3.5 font-medium">{item.patient_name}</td>
                      <td className="px-5 py-3.5 font-bold text-emerald-700">₦{parseFloat(item.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</td>
                      <td className="px-5 py-3.5 uppercase">{item.method?.replace('_', ' ')}</td>
                      <td className="px-5 py-3.5">{item.paid_at ? new Date(item.paid_at).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-5 py-3.5">{item.recorded_by}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                {activeTab === 'medications' &&
                  records.map((item: any) => (
                    <tr key={item.id} className="hover:bg-brand-cream/10 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold">{item.patient_name}</div>
                        <div className="font-mono text-[11px] text-brand-muted">{item.patient_number}</div>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-brand-charcoal">{item.medication_name}</td>
                      <td className="px-5 py-3.5">{item.dosage}</td>
                      <td className="px-5 py-3.5">{item.scheduled_at ? new Date(item.scheduled_at).toLocaleString() : 'N/A'}</td>
                      <td className="px-5 py-3.5">{item.administered_at ? new Date(item.administered_at).toLocaleString() : 'Not given'}</td>
                      <td className="px-5 py-3.5">{item.administering_staff}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.status === 'given'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'missed' || item.status === 'refused'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-zinc-100 text-zinc-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                {activeTab === 'appointments' &&
                  records.map((item: any) => (
                    <tr key={item.id} className="hover:bg-brand-cream/10 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold">{item.visitor_name}</div>
                        {item.patient_name && <div className="text-[11px] text-brand-muted">For: {item.patient_name}</div>}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px]">{item.visitor_phone}</td>
                      <td className="px-5 py-3.5 text-xs text-brand-charcoal-light">{item.reason}</td>
                      <td className="px-5 py-3.5">{item.appointment_date ? new Date(item.appointment_date).toLocaleString() : 'TBD'}</td>
                      <td className="px-5 py-3.5">{item.assigned_staff}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.status === 'approved' || item.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-zinc-100 text-zinc-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-brand-cream-dark/40 flex items-center justify-between text-xs">
            <span className="text-brand-muted">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-brand-cream-dark/60 bg-white hover:bg-brand-cream disabled:opacity-40 transition cursor-pointer font-semibold"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-xl border border-brand-cream-dark/60 bg-white hover:bg-brand-cream disabled:opacity-40 transition cursor-pointer font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
