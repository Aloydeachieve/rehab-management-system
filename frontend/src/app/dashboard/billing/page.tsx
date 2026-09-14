'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUser } from '@/lib/auth';
import Link from 'next/link';

interface PatientOption {
  id: number;
  patient_number: string;
  name: string;
  status: string;
}

interface TreatmentSessionOption {
  id: number;
  session_number: number;
  session_price?: string | null;
  start_date: string;
  expected_end_date: string;
  status: string;
  payment_status: string;
}

interface PaymentRecord {
  id: number;
  reference: string;
  amount: string;
  method: string;
  provider: string | null;
  status: string;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  recorded_by_user?: {
    id: number;
    name: string;
  };
}

interface InvoiceItem {
  id: number;
  invoice_number: string;
  patient_id: number;
  treatment_session_id: number | null;
  amount: string;
  amount_paid: string;
  balance: string;
  due_date: string;
  status: 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  notes: string | null;
  created_at: string;
  patient?: {
    id: number;
    patient_number: string;
    name: string;
    guardians?: Array<{
      id: number;
      name: string;
      phone: string;
      email: string | null;
      relationship: string;
      is_primary: boolean;
    }>;
  };
  treatment_session?: {
    id: number;
    session_number: number;
    start_date: string;
    expected_end_date: string;
    status: string;
  };
  payments?: PaymentRecord[];
  creator?: {
    id: number;
    name: string;
  };
}

export default function BillingPage() {
  const { data: currentUser, isLoading: userLoading } = useUser();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);

  const canAccessBilling = currentUser?.roles?.some((r) => r === 'admin' || r === 'receptionist');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Form states for Invoice Creation
  const [createPatientId, setCreatePatientId] = useState<number | ''>('');
  const [createSessionId, setCreateSessionId] = useState<number | ''>('');
  const [createAmount, setCreateAmount] = useState('');
  const [createDueDate, setCreateDueDate] = useState('');
  const [createNotes, setCreateNotes] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Form states for Payment Recording
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // 1. Fetch Invoices list
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery<{
    data: InvoiceItem[];
    total: number;
  }>({
    queryKey: ['invoices', searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const res = await api.get(`/invoices?${params.toString()}`);
      return res.data;
    },
    enabled: !!canAccessBilling,
  });

  const invoices = invoicesData?.data || [];

  // 2. Fetch Patients for Create Invoice dropdown
  const { data: patientsData } = useQuery<{ data: PatientOption[] }>({
    queryKey: ['patients_dropdown'],
    queryFn: async () => (await api.get('/patients?status=active')).data,
    enabled: isCreateModalOpen,
  });

  const patientsList = patientsData?.data || [];

  // 3. Fetch Treatment Sessions when patient is selected in Create Modal
  const { data: patientSessionsData } = useQuery<TreatmentSessionOption[]>({
    queryKey: ['patient_sessions', createPatientId],
    queryFn: async () => {
      if (!createPatientId) return [];
      const res = await api.get(`/patients/${createPatientId}/sessions`);
      return res.data.sessions || [];
    },
    enabled: isCreateModalOpen && !!createPatientId,
  });

  const patientSessions = patientSessionsData || [];

  // 4. Create Invoice Mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: {
      patient_id: number;
      treatment_session_id?: number | null;
      amount: number;
      due_date: string;
      notes?: string;
    }) => {
      const res = await api.post('/invoices', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsCreateModalOpen(false);
      resetCreateForm();
    },
  });

  // 5. Record Payment Mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async (data: {
      invoice_id: number;
      amount: number;
      method: string;
      reference?: string;
      paid_at?: string;
      notes?: string;
    }) => {
      const res = await api.post('/payments', data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      if (selectedInvoice && data.invoice) {
        setSelectedInvoice(data.invoice);
      }
      setIsPaymentModalOpen(false);
      resetPaymentForm();
    },
  });

  const resetCreateForm = () => {
    setCreatePatientId('');
    setCreateSessionId('');
    setCreateAmount('');
    setCreateDueDate('');
    setCreateNotes('');
    setCreateError(null);
  };

  const resetPaymentForm = () => {
    setPaymentAmount('');
    setPaymentMethod('bank_transfer');
    setPaymentReference('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNotes('');
    setPaymentError(null);
  };

  const handleOpenPaymentModal = (invoice: InvoiceItem) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.balance);
    setPaymentReference(`REF-${Date.now().toString().slice(-6)}`);
    setPaymentError(null);
    setIsPaymentModalOpen(true);
  };

  const handleOpenDetailsModal = async (invoice: InvoiceItem) => {
    try {
      const res = await api.get(`/invoices/${invoice.id}`);
      setSelectedInvoice(res.data.invoice);
    } catch {
      setSelectedInvoice(invoice);
    }
    setIsDetailsModalOpen(true);
  };

  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createPatientId || !createAmount || !createDueDate) {
      setCreateError('Please fill in all required fields.');
      return;
    }

    try {
      await createInvoiceMutation.mutateAsync({
        patient_id: Number(createPatientId),
        treatment_session_id: createSessionId ? Number(createSessionId) : null,
        amount: parseFloat(createAmount),
        due_date: createDueDate,
        notes: createNotes || undefined,
      });
    } catch (err: any) {
      setCreateError(
        err.response?.data?.message ||
        err.response?.data?.errors?.treatment_session_id?.[0] ||
        err.response?.data?.errors?.amount?.[0] ||
        'Failed to create invoice.'
      );
    }
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setPaymentError(null);

    const amountNum = parseFloat(paymentAmount);
    const balanceNum = parseFloat(selectedInvoice.balance);

    if (!amountNum || amountNum <= 0) {
      setPaymentError('Please enter a valid positive payment amount.');
      return;
    }

    if (amountNum > balanceNum) {
      setPaymentError(`Payment amount cannot exceed remaining balance of NGN ${balanceNum.toLocaleString()}.`);
      return;
    }

    try {
      await recordPaymentMutation.mutateAsync({
        invoice_id: selectedInvoice.id,
        amount: amountNum,
        method: paymentMethod,
        reference: paymentReference || undefined,
        paid_at: paymentDate || undefined,
        notes: paymentNotes || undefined,
      });
    } catch (err: any) {
      setPaymentError(
        err.response?.data?.message ||
        err.response?.data?.errors?.amount?.[0] ||
        err.response?.data?.errors?.reference?.[0] ||
        'Failed to record payment.'
      );
    }
  };

  // Metrics calculations
  const totalInvoiced = invoices.reduce((sum, inv) => sum + parseFloat(inv.amount || '0'), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + parseFloat(inv.amount_paid || '0'), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + parseFloat(inv.balance || '0'), 0);
  const unpaidCount = invoices.filter((inv) => inv.status === 'unpaid' || inv.status === 'overdue').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-300">
            ● Paid
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 border border-blue-300">
            ◐ Partially Paid
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-800 border border-red-300">
            ▲ Overdue
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 border border-slate-300">
            ✕ Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-300">
            ○ Unpaid
          </span>
        );
    }
  };

  if (userLoading) {
    return (
      <div className="flex justify-center items-center py-20 bg-white border border-brand-cream-dark/60 rounded-2xl">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-cream-dark/30 border-t-brand-primary" />
      </div>
    );
  }

  if (!canAccessBilling) {
    return (
      <div className="rounded-2xl border border-brand-cream-dark/60 bg-white p-8 text-center max-w-xl mx-auto shadow-sm my-12">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="font-serif text-xl font-bold text-brand-charcoal">Billing Access Restricted</h2>
        <p className="mt-2 text-xs text-brand-muted leading-relaxed">
          Residential billing, session invoices, and payment management are restricted to administrative and reception personnel.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-primary-dark transition"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-brand-cream-dark/60">
        <div>
          <h2 className="text-xl font-serif font-bold text-brand-charcoal">Billing & Payments</h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Manage residential care session invoices, record payments, and track client account balances.
          </p>
        </div>
        <button
          onClick={() => {
            resetCreateForm();
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-primary hover:bg-brand-primary-dark text-white text-xs font-semibold px-4 py-2.5 shadow-sm transition-all cursor-pointer"
        >
          <span>＋</span>
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-brand-cream-dark/60 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">Total Invoiced</span>
          <p className="text-2xl font-serif font-bold text-brand-charcoal mt-1">
            ₦{totalInvoiced.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-brand-muted mt-1 block">From all recorded program fees</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-brand-cream-dark/60 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Total Collected</span>
          <p className="text-2xl font-serif font-bold text-emerald-700 mt-1">
            ₦{totalCollected.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Verified payments received</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-brand-cream-dark/60 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Outstanding Balance</span>
          <p className="text-2xl font-serif font-bold text-amber-700 mt-1">
            ₦{totalOutstanding.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-amber-600 font-medium mt-1 block">Pending client settlements</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-brand-cream-dark/60 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-red-700">Action Required</span>
          <p className="text-2xl font-serif font-bold text-red-700 mt-1">{unpaidCount}</p>
          <span className="text-[11px] text-red-600 font-medium mt-1 block">Unpaid or overdue invoices</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-brand-cream-dark/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="w-full sm:w-80 relative">
          <input
            type="text"
            placeholder="Search by invoice # or patient name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-brand-cream-light/60 border border-brand-cream-dark/60 rounded-xl px-3.5 py-2 pl-9 text-xs text-brand-charcoal placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <svg
            className="w-4 h-4 text-brand-muted absolute left-3 top-2.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1 bg-brand-cream/40 p-1 rounded-xl text-xs font-medium">
          {['all', 'unpaid', 'partially_paid', 'paid', 'overdue'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg capitalize transition cursor-pointer ${
                statusFilter === tab
                  ? 'bg-white text-brand-primary font-bold shadow-xs'
                  : 'text-brand-muted hover:text-brand-charcoal'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-brand-cream-dark/60 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-brand-charcoal">
            <thead className="bg-brand-cream/40 text-brand-muted uppercase text-[10px] tracking-wider border-b border-brand-cream-dark/60">
              <tr>
                <th className="px-5 py-3.5 font-bold">Invoice #</th>
                <th className="px-5 py-3.5 font-bold">Patient</th>
                <th className="px-5 py-3.5 font-bold">Session</th>
                <th className="px-5 py-3.5 font-bold">Amount</th>
                <th className="px-5 py-3.5 font-bold">Paid</th>
                <th className="px-5 py-3.5 font-bold">Balance</th>
                <th className="px-5 py-3.5 font-bold">Due Date</th>
                <th className="px-5 py-3.5 font-bold">Status</th>
                <th className="px-5 py-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream-dark/40">
              {invoicesLoading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-brand-muted">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary mx-auto mb-2" />
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-brand-muted">
                    <div className="text-3xl mb-2">🧾</div>
                    <p className="font-semibold text-brand-charcoal">No invoices found</p>
                    <p className="text-[11px] text-brand-muted mt-0.5">
                      Create an invoice for an admitted patient&apos;s treatment session to get started.
                    </p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-brand-cream/20 transition">
                    <td className="px-5 py-4 font-bold text-brand-primary">
                      <button
                        onClick={() => handleOpenDetailsModal(inv)}
                        className="hover:underline cursor-pointer"
                      >
                        {inv.invoice_number}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      {inv.patient ? (
                        <div>
                          <p className="font-bold text-brand-charcoal">{inv.patient.name}</p>
                          <span className="text-[10px] text-brand-muted">{inv.patient.patient_number}</span>
                        </div>
                      ) : (
                        <span className="text-brand-muted">N/A</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {inv.treatment_session ? (
                        <span className="font-semibold text-brand-charcoal bg-brand-cream-light px-2 py-0.5 rounded border border-brand-cream-dark/60 text-[11px]">
                          Session #{inv.treatment_session.session_number}
                        </span>
                      ) : (
                        <span className="text-brand-muted text-[11px]">General Care</span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-semibold">
                      ₦{parseFloat(inv.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-emerald-700 font-semibold">
                      ₦{parseFloat(inv.amount_paid).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 font-bold text-amber-800">
                      ₦{parseFloat(inv.balance).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-brand-muted text-[11px]">
                      {new Date(inv.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(inv.status)}</td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                          <button
                            onClick={() => handleOpenPaymentModal(inv)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 py-1.5 rounded-lg text-[11px] transition shadow-xs cursor-pointer"
                          >
                            Pay
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenDetailsModal(inv)}
                          className="bg-brand-cream border border-brand-cream-dark/60 hover:bg-brand-cream-dark/40 text-brand-charcoal font-semibold px-2.5 py-1.5 rounded-lg text-[11px] transition cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. Create Invoice Modal */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-brand-cream-dark/60 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="p-5 border-b border-brand-cream-dark/60 flex items-center justify-between bg-brand-cream/30">
              <h3 className="font-serif font-bold text-brand-charcoal text-base">Generate Treatment Invoice</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-brand-muted hover:text-brand-charcoal text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} className="p-5 space-y-4">
              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {createError}
                </div>
              )}

              {/* Patient Selector */}
              <div>
                <label className="block text-xs font-bold text-brand-charcoal mb-1">Select Patient *</label>
                <select
                  required
                  value={createPatientId}
                  onChange={(e) => {
                    setCreatePatientId(e.target.value ? Number(e.target.value) : '');
                    setCreateSessionId('');
                  }}
                  className="w-full bg-brand-cream-light/50 border border-brand-cream-dark/60 rounded-xl px-3 py-2 text-xs text-brand-charcoal focus:ring-2 focus:ring-brand-primary focus:outline-none"
                >
                  <option value="">-- Choose admitted patient --</option>
                  {patientsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.patient_number} — {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Treatment Session Selector */}
              {createPatientId && (
                <div>
                  <label className="block text-xs font-bold text-brand-charcoal mb-1">
                    Link to Treatment Session (Optional)
                  </label>
                  <select
                    value={createSessionId}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : '';
                      setCreateSessionId(val);
                      if (val) {
                        const sess = patientSessions.find((s) => s.id === val);
                        if (sess) {
                          const autoPrice = sess.session_price
                            ? parseFloat(sess.session_price).toString()
                            : sess.session_number === 1
                            ? '300000'
                            : '200000';
                          setCreateAmount(autoPrice);
                        }
                      }
                    }}
                    className="w-full bg-brand-cream-light/50 border border-brand-cream-dark/60 rounded-xl px-3 py-2 text-xs text-brand-charcoal focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  >
                    <option value="">General Residential Care (No Specific Session)</option>
                    {patientSessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        Session #{s.session_number} ({s.start_date} to {s.expected_end_date}) — ₦{parseFloat(s.session_price || (s.session_number === 1 ? '300000' : '200000')).toLocaleString()} [{s.payment_status}]
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amount and Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-brand-charcoal mb-1">Amount (NGN) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 250000"
                    value={createAmount}
                    onChange={(e) => setCreateAmount(e.target.value)}
                    className="w-full bg-brand-cream-light/50 border border-brand-cream-dark/60 rounded-xl px-3 py-2 text-xs text-brand-charcoal focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-charcoal mb-1">Payment Due Date *</label>
                  <input
                    type="date"
                    required
                    value={createDueDate}
                    onChange={(e) => setCreateDueDate(e.target.value)}
                    className="w-full bg-brand-cream-light/50 border border-brand-cream-dark/60 rounded-xl px-3 py-2 text-xs text-brand-charcoal focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-brand-charcoal mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 30-Day Residential Care Program and Room Accommodation"
                  value={createNotes}
                  onChange={(e) => setCreateNotes(e.target.value)}
                  className="w-full bg-brand-cream-light/50 border border-brand-cream-dark/60 rounded-xl px-3 py-2 text-xs text-brand-charcoal focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>

              {/* Notice */}
              <p className="text-[11px] text-brand-muted">
                ℹ️ Generating this invoice will automatically email the client&apos;s registered primary guardian with the invoice details and payment instructions.
              </p>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-cream-dark/60">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-brand-cream-dark/60 text-xs font-semibold text-brand-charcoal hover:bg-brand-cream transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createInvoiceMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary-dark text-white text-xs font-semibold shadow transition cursor-pointer disabled:opacity-50"
                >
                  {createInvoiceMutation.isPending ? 'Generating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. Record Payment Modal */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-brand-cream-dark/60 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            <div className="p-5 border-b border-brand-cream-dark/60 flex items-center justify-between bg-brand-cream/30">
              <div>
                <h3 className="font-serif font-bold text-brand-charcoal text-base">Record Verified Payment</h3>
                <p className="text-[11px] text-brand-muted">
                  Invoice {selectedInvoice.invoice_number} • {selectedInvoice.patient?.name}
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-brand-muted hover:text-brand-charcoal text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="p-5 space-y-4">
              {paymentError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {paymentError}
                </div>
              )}

              {/* Invoice Summary Box */}
              <div className="bg-brand-cream-light/60 p-3.5 rounded-xl border border-brand-cream-dark/60 grid grid-cols-3 text-center text-xs">
                <div>
                  <span className="text-brand-muted text-[10px] uppercase font-bold block">Total Amount</span>
                  <strong className="text-brand-charcoal font-semibold">
                    ₦{parseFloat(selectedInvoice.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div>
                  <span className="text-emerald-700 text-[10px] uppercase font-bold block">Paid So Far</span>
                  <strong className="text-emerald-700 font-semibold">
                    ₦{parseFloat(selectedInvoice.amount_paid).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div>
                  <span className="text-amber-800 text-[10px] uppercase font-bold block">Remaining Due</span>
                  <strong className="text-amber-800 font-bold text-sm">
                    ₦{parseFloat(selectedInvoice.balance).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              {/* Amount and Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-brand-charcoal mb-1">Amount to Pay (NGN) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedInvoice.balance}
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full bg-brand-cream-light/50 border border-brand-cream-dark/60 rounded-xl px-3 py-2 text-xs text-brand-charcoal focus:ring-2 focus:ring-brand-primary focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-charcoal mb-1">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-brand-cream-light/50 border border-brand-cream-dark/60 rounded-xl px-3 py-2 text-xs text-brand-charcoal focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="pos">POS / Terminal</option>
                    <option value="card">Card (Direct)</option>
                    <option value="cheque">Bank Cheque</option>
                  </select>
                </div>
              </div>

              {/* Reference and Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-brand-charcoal mb-1">Payment Reference / Trx ID</label>
                  <input
                    type="text"
                    required
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="e.g. TRF-123456"
                    className="w-full bg-brand-cream-light/50 border border-brand-cream-dark/60 rounded-xl px-3 py-2 text-xs text-brand-charcoal focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brand-charcoal mb-1">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-brand-cream-light/50 border border-brand-cream-dark/60 rounded-xl px-3 py-2 text-xs text-brand-charcoal focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-brand-charcoal mb-1">Payment Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Verified by Front-Desk via FirstBank statement"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-brand-cream-light/50 border border-brand-cream-dark/60 rounded-xl px-3 py-2 text-xs text-brand-charcoal focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-cream-dark/60">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-brand-cream-dark/60 text-xs font-semibold text-brand-charcoal hover:bg-brand-cream transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordPaymentMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow transition cursor-pointer disabled:opacity-50"
                >
                  {recordPaymentMutation.isPending ? 'Recording...' : 'Confirm & Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. Invoice Details & Payment History Modal */}
      {/* ========================================================================= */}
      {isDetailsModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-brand-cream-dark/60 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in duration-150">
            <div className="p-5 border-b border-brand-cream-dark/60 flex items-center justify-between bg-brand-cream/30 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-sm">
                  🧾
                </div>
                <div>
                  <h3 className="font-serif font-bold text-brand-charcoal text-base">
                    Invoice {selectedInvoice.invoice_number}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {getStatusBadge(selectedInvoice.status)}
                    <span className="text-[11px] text-brand-muted">
                      Created {new Date(selectedInvoice.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-brand-muted hover:text-brand-charcoal text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Patient & Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-brand-cream-light/50 p-4 rounded-xl border border-brand-cream-dark/60 space-y-1.5 text-xs">
                  <span className="text-[10px] uppercase font-bold text-brand-muted block">Client Information</span>
                  <p className="font-bold text-brand-charcoal text-sm">{selectedInvoice.patient?.name}</p>
                  <p className="text-brand-muted">ID: {selectedInvoice.patient?.patient_number}</p>
                  {selectedInvoice.treatment_session && (
                    <p className="text-brand-primary font-semibold">
                      Session #{selectedInvoice.treatment_session.session_number} ({selectedInvoice.treatment_session.start_date} to {selectedInvoice.treatment_session.expected_end_date})
                    </p>
                  )}
                  {selectedInvoice.patient?.id && (
                    <Link
                      href={`/dashboard/patients/${selectedInvoice.patient.id}`}
                      className="text-[11px] font-semibold text-brand-primary hover:underline block pt-1"
                    >
                      View Full Patient Profile ↗
                    </Link>
                  )}
                </div>

                <div className="bg-brand-cream-light/50 p-4 rounded-xl border border-brand-cream-dark/60 space-y-2 text-xs">
                  <span className="text-[10px] uppercase font-bold text-brand-muted block">Financial Breakdown</span>
                  <div className="flex justify-between">
                    <span className="text-brand-muted">Total Invoiced:</span>
                    <strong className="text-brand-charcoal">
                      ₦{parseFloat(selectedInvoice.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Amount Paid:</span>
                    <strong>
                      ₦{parseFloat(selectedInvoice.amount_paid).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div className="flex justify-between text-amber-800 font-bold pt-1 border-t border-brand-cream-dark/60">
                    <span>Remaining Due:</span>
                    <strong className="text-sm">
                      ₦{parseFloat(selectedInvoice.balance).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div className="flex justify-between text-[11px] text-brand-muted">
                    <span>Due Date:</span>
                    <span>{new Date(selectedInvoice.due_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment History Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                    Payment Ledger / Receipts
                  </h4>
                  {selectedInvoice.status !== 'paid' && selectedInvoice.status !== 'cancelled' && (
                    <button
                      onClick={() => {
                        setIsDetailsModalOpen(false);
                        handleOpenPaymentModal(selectedInvoice);
                      }}
                      className="text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1 rounded-lg transition cursor-pointer"
                    >
                      ＋ Record Payment
                    </button>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-brand-cream-dark/60 overflow-hidden">
                  <table className="w-full text-left text-xs text-brand-charcoal">
                    <thead className="bg-brand-cream/40 text-brand-muted text-[10px] uppercase border-b border-brand-cream-dark/60">
                      <tr>
                        <th className="px-4 py-2.5 font-bold">Reference</th>
                        <th className="px-4 py-2.5 font-bold">Method</th>
                        <th className="px-4 py-2.5 font-bold">Amount</th>
                        <th className="px-4 py-2.5 font-bold">Date</th>
                        <th className="px-4 py-2.5 font-bold">Staff</th>
                        <th className="px-4 py-2.5 font-bold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-cream-dark/40">
                      {selectedInvoice.payments && selectedInvoice.payments.length > 0 ? (
                        selectedInvoice.payments.map((p) => (
                          <tr key={p.id}>
                            <td className="px-4 py-2.5 font-mono font-bold text-brand-primary">{p.reference}</td>
                            <td className="px-4 py-2.5 capitalize">{p.method.replace('_', ' ')}</td>
                            <td className="px-4 py-2.5 font-bold text-emerald-700">
                              ₦{parseFloat(p.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-2.5 text-brand-muted text-[11px]">
                              {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-2.5 text-brand-muted text-[11px]">
                              {p.recorded_by_user?.name || 'Staff'}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-brand-muted text-xs">
                            No payments recorded yet for this invoice.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-3 border-t border-brand-cream-dark/60">
                <button
                  type="button"
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-brand-cream border border-brand-cream-dark/60 text-xs font-semibold text-brand-charcoal hover:bg-brand-cream-dark/40 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
