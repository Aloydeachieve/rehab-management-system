'use client';

import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { api } from '@/lib/api';
import { useState } from 'react';
import Link from 'next/link';

const bookingSchema = zod.object({
  visitor_name: zod.string().min(1, 'Full name is required').max(100, 'Name is too long'),
  visitor_phone: zod
    .string()
    .min(5, 'Phone number must be at least 5 characters')
    .max(25, 'Phone number is too long'),
  visitor_email: zod
    .string()
    .email('Invalid email address')
    .or(zod.literal(''))
    .optional(),
  reason: zod.string().min(5, 'Please provide a clear reason for the appointment'),
  preferred_at: zod.string().min(1, 'Preferred date and time is required'),
  notes: zod.string().optional(),
});

type BookingFormValues = zod.infer<typeof bookingSchema>;

export default function BookAppointmentPage() {
  const [successData, setSuccessData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      visitor_name: '',
      visitor_phone: '',
      visitor_email: '',
      reason: '',
      preferred_at: '',
      notes: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: BookingFormValues) => {
      // If email is empty string, send as null
      const payload = {
        ...data,
        visitor_email: data.visitor_email || null,
        notes: data.notes || null,
      };
      return (await api.post('/appointments', payload)).data;
    },
    onSuccess: (data) => {
      setSuccessData(data.appointment);
      reset();
    },
  });

  const onSubmit = (data: BookingFormValues) => {
    mutation.mutate(data);
  };

  if (successData) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
        <div className="rounded-2xl border border-zinc-200 p-8 text-center bg-white shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-600 text-2xl">
            ✓
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900">
            Request Submitted Successfully!
          </h1>
          <p className="mt-2 text-sm text-zinc-500 leading-relaxed">
            Thank you, **{successData.visitor_name}**. Your request has been logged. Our receptionist team will review your preferred date and contact you shortly.
          </p>

          <div className="mt-8 text-left rounded-xl bg-zinc-50 p-6 border border-zinc-200 text-sm">
            <h3 className="font-semibold text-zinc-800 border-b border-zinc-200 pb-2 mb-4">Request Summary</h3>
            <div className="space-y-2 text-zinc-600">
              <p><strong>Appointment ID:</strong> #{successData.id}</p>
              <p><strong>Preferred Time:</strong> {new Date(successData.preferred_at).toLocaleString()}</p>
              <p><strong>Reason:</strong> {successData.reason}</p>
              {successData.visitor_email && <p><strong>Email Notification Sent To:</strong> {successData.visitor_email}</p>}
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/"
              className="rounded-full bg-zinc-100 px-6 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-200"
            >
              Return Home
            </Link>
            <button
              onClick={() => setSuccessData(null)}
              className="rounded-full bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Book Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Book an Appointment</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Please fill out the form below to request an intake assessment or center visit.
        </p>

        {mutation.isError && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-800 border border-red-200">
            {((mutation.error as any)?.response?.data?.message) || 'An error occurred while submitting. Please try again.'}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="visitor_name" className="block text-sm font-medium text-zinc-700">
                Visitor / Guardian Full Name *
              </label>
              <input
                id="visitor_name"
                type="text"
                {...register('visitor_name')}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="e.g. Chukwuma Benson"
              />
              {errors.visitor_name && (
                <p className="mt-1 text-xs text-red-600">{errors.visitor_name.message}</p>
              )}
            </div>

            {/* Phone & Email Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="visitor_phone" className="block text-sm font-medium text-zinc-700">
                  Phone Number *
                </label>
                <input
                  id="visitor_phone"
                  type="text"
                  {...register('visitor_phone')}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. +234 803 000 0000"
                />
                {errors.visitor_phone && (
                  <p className="mt-1 text-xs text-red-600">{errors.visitor_phone.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="visitor_email" className="block text-sm font-medium text-zinc-700">
                  Email Address
                </label>
                <input
                  id="visitor_email"
                  type="email"
                  {...register('visitor_email')}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. chukwuma@gmail.com"
                />
                {errors.visitor_email && (
                  <p className="mt-1 text-xs text-red-600">{errors.visitor_email.message}</p>
                )}
              </div>
            </div>

            {/* Preferred date and time */}
            <div>
              <label htmlFor="preferred_at" className="block text-sm font-medium text-zinc-700">
                Preferred Date & Time *
              </label>
              <input
                id="preferred_at"
                type="datetime-local"
                {...register('preferred_at')}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              {errors.preferred_at && (
                <p className="mt-1 text-xs text-red-600">{errors.preferred_at.message}</p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-zinc-700">
                Reason for Appointment *
              </label>
              <textarea
                id="reason"
                rows={3}
                {...register('reason')}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="e.g. Admission inquiry, facility tour, or clinical consultation details."
              />
              {errors.reason && (
                <p className="mt-1 text-xs text-red-600">{errors.reason.message}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-zinc-700">
                Additional Message / Notes
              </label>
              <textarea
                id="notes"
                rows={2}
                {...register('notes')}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Any special requests or instructions for our staff."
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex w-full justify-center rounded-full bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 focus:outline-none disabled:bg-teal-400 transition-all"
            >
              {mutation.isPending ? 'Submitting...' : 'Submit Appointment Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
