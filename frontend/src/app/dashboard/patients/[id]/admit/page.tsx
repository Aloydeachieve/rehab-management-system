'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';

const admissionSchema = zod.object({
  admission_date: zod.string().min(1, 'Admission date is required'),
  admission_type: zod.enum(['voluntary', 'involuntary']),
  notes: zod.string().optional().or(zod.literal('')),
});

type AdmissionFormValues = zod.infer<typeof admissionSchema>;

export default function AdmitPatientPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdmissionFormValues>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      admission_date: new Date().toISOString().slice(0, 10), // Default to today's date
      admission_type: 'voluntary',
      notes: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: AdmissionFormValues) => {
      const payload = {
        ...data,
        notes: data.notes || null,
      };
      return (await api.post(`/patients/${id}/admission`, payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-profile', id] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      router.push(`/dashboard/patients/${id}`);
    },
  });

  const onSubmit = (data: AdmissionFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="bg-white border border-brand-cream-dark/60 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div>
          <h2 className="font-serif text-xl font-bold text-brand-charcoal">Record Residential Admission</h2>
          <p className="mt-1 text-xs text-brand-muted font-medium">
            Formally log the residential care intake parameters for this patient.
          </p>
        </div>

        {mutation.isError && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-xs text-red-800 border border-red-200/50">
            {((mutation.error as any)?.response?.data?.message) || 'Failed to record admission. Please try again.'}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6 text-brand-charcoal-light">
          <div className="space-y-4">
            {/* Date of Admission */}
            <div>
              <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Admission Date *</label>
              <input
                type="date"
                {...register('admission_date')}
                className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal-light placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
              />
              {errors.admission_date && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.admission_date.message}</p>
              )}
            </div>

            {/* Type of Admission */}
            <div>
              <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Admission Type *</label>
              <select
                {...register('admission_type')}
                className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal-light bg-white focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all cursor-pointer"
              >
                <option value="voluntary">Voluntary Admission</option>
                <option value="involuntary">Involuntary Admission</option>
              </select>
              {errors.admission_type && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.admission_type.message}</p>
              )}
            </div>

            {/* Notes / Intake description */}
            <div>
              <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Intake Notes / Reason</label>
              <textarea
                rows={4}
                {...register('notes')}
                className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                placeholder="Detail intake observations, client state, accompanying belongings, or guardian instructions..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-brand-cream-dark/45">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/patients/${id}`)}
              className="rounded-full bg-white border border-brand-cream-dark/60 px-6 py-2.5 text-xs font-bold text-brand-charcoal hover:bg-brand-cream/35 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-full bg-brand-accent hover:bg-brand-accent-dark px-6 py-2.5 text-xs font-bold text-white disabled:bg-brand-accent/50 shadow-md shadow-brand-accent/20 transition-all cursor-pointer"
            >
              {mutation.isPending ? 'Saving...' : 'Confirm Admission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
