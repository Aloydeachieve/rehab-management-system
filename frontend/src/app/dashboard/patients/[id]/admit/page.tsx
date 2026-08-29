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
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Record Residential Admission</h2>
          <p className="mt-1 text-xs text-zinc-400">
            Formally log the residential care intake parameters for this patient.
          </p>
        </div>

        {mutation.isError && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-xs text-red-800 border border-red-200">
            {((mutation.error as any)?.response?.data?.message) || 'Failed to record admission. Please try again.'}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6 text-zinc-700">
          <div className="space-y-4">
            {/* Date of Admission */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600">Admission Date *</label>
              <input
                type="date"
                {...register('admission_date')}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              {errors.admission_date && (
                <p className="mt-1 text-xs text-red-600">{errors.admission_date.message}</p>
              )}
            </div>

            {/* Type of Admission */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600">Admission Type *</label>
              <select
                {...register('admission_type')}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 bg-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="voluntary">Voluntary Admission</option>
                <option value="involuntary">Involuntary Admission</option>
              </select>
              {errors.admission_type && (
                <p className="mt-1 text-xs text-red-600">{errors.admission_type.message}</p>
              )}
            </div>

            {/* Notes / Intake description */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600">Intake Notes / Reason</label>
              <textarea
                rows={4}
                {...register('notes')}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm placeholder-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Detail intake observations, client state, accompanying belongings, or guardian instructions..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/patients/${id}`)}
              className="rounded-full bg-white border border-zinc-200 px-5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-full bg-teal-600 px-6 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:bg-teal-400 shadow-sm"
            >
              {mutation.isPending ? 'Saving...' : 'Confirm Admission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
