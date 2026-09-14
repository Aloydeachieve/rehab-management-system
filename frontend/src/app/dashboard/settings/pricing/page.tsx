'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUser } from '@/lib/auth';
import Link from 'next/link';

interface PricingConfig {
  id: number;
  initial_session_price: string;
  subsequent_session_price: string;
  currency: string;
  session_duration_days: number;
  updated_by?: number | null;
  updated_by_user?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export default function PricingSettingsPage() {
  const { data: user, isLoading: userLoading } = useUser();
  const queryClient = useQueryClient();

  const [initialPrice, setInitialPrice] = useState<string>('300000');
  const [subsequentPrice, setSubsequentPrice] = useState<string>('200000');
  const [currency, setCurrency] = useState<string>('NGN');
  const [sessionDuration, setSessionDuration] = useState<string>('30');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isAdmin = user?.roles.includes('admin');

  // Fetch current pricing config
  const { data: pricingData, isLoading: configLoading } = useQuery<{ config: PricingConfig }>({
    queryKey: ['pricing-config'],
    queryFn: async () => (await api.get('/pricing-config')).data,
    enabled: !!user,
  });

  const config = pricingData?.config;

  useEffect(() => {
    if (config) {
      setInitialPrice(parseFloat(config.initial_session_price).toString());
      setSubsequentPrice(parseFloat(config.subsequent_session_price).toString());
      setCurrency(config.currency || 'NGN');
      setSessionDuration(config.session_duration_days.toString());
    }
  }, [config]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: {
      initial_session_price: number;
      subsequent_session_price: number;
      currency: string;
      session_duration_days: number;
    }) => {
      const res = await api.put('/pricing-config', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-config'] });
      setSuccessMessage('Treatment pricing configuration updated successfully.');
      setErrorMessage(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    },
    onError: (err: any) => {
      setErrorMessage(
        err.response?.data?.message ||
        err.response?.data?.errors?.initial_session_price?.[0] ||
        err.response?.data?.errors?.subsequent_session_price?.[0] ||
        err.response?.data?.errors?.session_duration_days?.[0] ||
        'Failed to update treatment pricing configuration.'
      );
      setSuccessMessage(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    const initVal = parseFloat(initialPrice);
    const subVal = parseFloat(subsequentPrice);
    const durVal = parseInt(sessionDuration, 10);

    if (isNaN(initVal) || initVal < 0) {
      setErrorMessage('Initial session price must be a valid positive amount.');
      return;
    }

    if (isNaN(subVal) || subVal < 0) {
      setErrorMessage('Subsequent session price must be a valid positive amount.');
      return;
    }

    if (isNaN(durVal) || durVal < 1) {
      setErrorMessage('Session duration must be at least 1 day.');
      return;
    }

    updateMutation.mutate({
      initial_session_price: initVal,
      subsequent_session_price: subVal,
      currency: currency.trim() || 'NGN',
      session_duration_days: durVal,
    });
  };

  if (userLoading || configLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-brand-primary" />
          <span className="text-xs text-brand-muted">Loading pricing settings...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-brand-cream-dark/60 bg-white p-8 text-center max-w-xl mx-auto shadow-sm my-12">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="font-serif text-xl font-bold text-brand-charcoal">Administrator Access Required</h2>
        <p className="mt-2 text-xs text-brand-muted leading-relaxed">
          Treatment pricing and financial tier models can only be configured by System Administrators. Receptionist and clinician staff cannot modify pricing parameters.
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
    <div className="space-y-8 max-w-5xl">
      {/* Page Header Banner */}
      <div className="rounded-2xl border border-brand-cream-dark/60 bg-white p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full filter blur-2xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-accent">Finance & Residential Operations</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-brand-charcoal sm:text-3xl">
            Treatment Pricing Configuration
          </h2>
          <p className="mt-1 text-xs text-brand-charcoal-light font-medium">
            Configure default residential stay pricing and duration applied to patient treatment sessions and automatic invoice generation.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-brand-primary/10 px-3.5 py-1.5 text-xs font-bold text-brand-primary tracking-wide ring-1 ring-inset ring-brand-primary/20 uppercase">
          Standard Tier
        </span>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <span>✓</span> {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <span>⚠️</span> {errorMessage}
        </div>
      )}

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-brand-cream-dark/60 bg-white p-6 sm:p-8 shadow-sm">
            <h3 className="font-serif text-lg font-bold text-brand-charcoal border-b border-brand-cream-dark/40 pb-3 mb-6">
              Residential Session Pricing Model
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Session 1 Price */}
              <div>
                <label className="block text-xs font-bold text-brand-charcoal mb-1">
                  Session 1 / Initial Residential Treatment Price ({currency}) *
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-brand-muted text-xs font-bold">
                    ₦
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={initialPrice}
                    onChange={(e) => setInitialPrice(e.target.value)}
                    className="w-full pl-8 bg-brand-cream-light/50 border border-brand-cream-dark/60 rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-charcoal focus:ring-2 focus:ring-brand-primary focus:outline-none"
                    placeholder="300000"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-brand-muted leading-relaxed">
                  Default price applied to the first 30-day residential care session spawned automatically upon patient admission.
                </p>
              </div>

              {/* Session 2+ Price */}
              <div>
                <label className="block text-xs font-bold text-brand-charcoal mb-1">
                  Session 2 and Subsequent Sessions Price ({currency}) *
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-brand-muted text-xs font-bold">
                    ₦
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={subsequentPrice}
                    onChange={(e) => setSubsequentPrice(e.target.value)}
                    className="w-full pl-8 bg-brand-cream-light/50 border border-brand-cream-dark/60 rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-charcoal focus:ring-2 focus:ring-brand-primary focus:outline-none"
                    placeholder="200000"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-brand-muted leading-relaxed">
                  Discounted continuation rate applied to sequential sessions when a clinician logs a continuation reassessment.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Session Duration */}
                <div>
                  <label className="block text-xs font-bold text-brand-charcoal mb-1">
                    Standard Session Duration (Days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    required
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(e.target.value)}
                    className="w-full bg-brand-cream-light/50 border border-brand-cream-dark/60 rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-charcoal focus:ring-2 focus:ring-brand-primary focus:outline-none"
                    placeholder="30"
                  />
                  <p className="mt-1 text-[11px] text-brand-muted">Standard residency evaluation cycle (e.g. 30 days).</p>
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-xs font-bold text-brand-charcoal mb-1">
                    Currency Code *
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    required
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                    className="w-full bg-brand-cream-light/50 border border-brand-cream-dark/60 rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-charcoal focus:ring-2 focus:ring-brand-primary focus:outline-none uppercase"
                    placeholder="NGN"
                  />
                  <p className="mt-1 text-[11px] text-brand-muted">ISO 4217 Currency (e.g. NGN, USD).</p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-brand-cream-dark/40 flex items-center justify-between">
                <div className="text-[11px] text-brand-muted">
                  {config?.updated_at && (
                    <span>Last updated: {new Date(config.updated_at).toLocaleString()} {config.updated_by_user?.name ? `by ${config.updated_by_user.name}` : ''}</span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="rounded-xl bg-brand-primary hover:bg-brand-primary-dark px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {updateMutation.isPending ? 'Saving Settings...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Informational Guidance Sidebar */}
        <div className="space-y-6">
          {/* Rules Card */}
          <div className="rounded-2xl border border-brand-cream-dark/60 bg-white p-6 shadow-sm">
            <h4 className="font-serif font-bold text-brand-charcoal text-sm flex items-center gap-2 mb-3">
              <span>📋</span> Configured Business Rules
            </h4>
            <ul className="space-y-3 text-xs text-brand-charcoal-light leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-brand-accent font-bold mt-0.5">•</span>
                <span>
                  <strong>Intake Admission:</strong> Admitting a patient automatically creates <strong>Session #1</strong> lasting {sessionDuration} days at ₦{parseFloat(initialPrice || '0').toLocaleString()}.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-accent font-bold mt-0.5">•</span>
                <span>
                  <strong>Treatment Continuation:</strong> Completing a reassessment and initiating <strong>Session #2+</strong> automatically uses the subsequent price of ₦{parseFloat(subsequentPrice || '0').toLocaleString()}.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-accent font-bold mt-0.5">•</span>
                <span>
                  <strong>Invoice Generation:</strong> Creating an invoice with a linked session automatically pre-populates with that session&apos;s configured price.
                </span>
              </li>
            </ul>
          </div>

          {/* Historical Safety Card */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm">
            <h4 className="font-serif font-bold text-emerald-950 text-sm flex items-center gap-2 mb-2">
              <span>🛡️</span> Historical Invoices Safe
            </h4>
            <p className="text-xs text-emerald-900/80 leading-relaxed">
              Updating pricing settings applies strictly to <em>future</em> admissions, sessions, and invoices. Historical invoices permanently preserve their recorded amounts, balances, and payment ledgers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
