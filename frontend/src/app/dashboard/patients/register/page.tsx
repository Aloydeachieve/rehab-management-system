'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

const registrationSchema = zod.object({
  // Patient details
  name: zod.string().min(1, 'Patient name is required').max(100),
  date_of_birth: zod.string().min(1, 'Date of birth is required'),
  gender: zod.string().min(1, 'Gender is required'),
  address: zod.string().min(1, 'Patient physical address is required'),
  phone: zod.string().max(25).optional().or(zod.literal('')),
  
  // Primary Guardian details
  guardian_name: zod.string().min(1, 'Guardian name is required').max(100),
  guardian_relationship: zod.string().min(1, 'Relationship is required').max(50),
  guardian_phone: zod.string().min(5, 'Guardian phone number must be at least 5 characters').max(25),
  guardian_email: zod.string().email('Invalid email address').or(zod.literal('')).optional(),
  guardian_address: zod.string().optional().or(zod.literal('')),
});

type RegistrationFormValues = zod.infer<typeof registrationSchema>;

export default function RegisterPatientPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: '',
      date_of_birth: '',
      gender: 'male',
      address: '',
      phone: '',
      guardian_name: '',
      guardian_relationship: '',
      guardian_phone: '',
      guardian_email: '',
      guardian_address: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: RegistrationFormValues) => {
      const payload = {
        ...data,
        phone: data.phone || null,
        guardian_email: data.guardian_email || null,
        guardian_address: data.guardian_address || null,
      };
      return (await api.post('/patients', payload)).data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      // Redirect to the created patient profile page
      router.push(`/dashboard/patients/${data.patient.id}`);
    },
  });

  const onSubmit = (data: RegistrationFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Register New Patient</h2>
          <p className="mt-1 text-xs text-zinc-400">
            Please register the patient details along with their primary guardian contact details.
          </p>
        </div>

        {mutation.isError && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-xs text-red-800 border border-red-200">
            {((mutation.error as any)?.response?.data?.message) || 'Failed to register patient. Please check input.'}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-8 text-zinc-700">
          {/* Section 1: Patient Demographic Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-teal-700 border-b border-zinc-100 pb-2 uppercase tracking-wider">
              1. Patient Demographics
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600">Patient Full Name *</label>
                <input
                  type="text"
                  {...register('name')}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. Somto Ndu"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600">Phone Number (Optional)</label>
                <input
                  type="text"
                  {...register('phone')}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. +234 803 111 2222"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600">Date of Birth *</label>
                <input
                  type="date"
                  {...register('date_of_birth')}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-zinc-500"
                />
                {errors.date_of_birth && <p className="mt-1 text-xs text-red-600">{errors.date_of_birth.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600">Gender *</label>
                <select
                  {...register('gender')}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 bg-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-600">Physical Address *</label>
              <textarea
                rows={2}
                {...register('address')}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="e.g. No. 5 Awka Road, Nibo, Anambra State"
              />
              {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>}
            </div>
          </div>

          {/* Section 2: Primary Guardian Details */}
          <div className="space-y-4 pt-4 border-t border-zinc-100">
            <h3 className="text-sm font-bold text-teal-700 border-b border-zinc-100 pb-2 uppercase tracking-wider">
              2. Primary Guardian Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600">Guardian Name *</label>
                <input
                  type="text"
                  {...register('guardian_name')}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. Chief Emeka Ndu"
                />
                {errors.guardian_name && <p className="mt-1 text-xs text-red-600">{errors.guardian_name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600">Relationship *</label>
                <input
                  type="text"
                  {...register('guardian_relationship')}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. Father, Uncle, Mother"
                />
                {errors.guardian_relationship && <p className="mt-1 text-xs text-red-600">{errors.guardian_relationship.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600">Guardian Phone *</label>
                <input
                  type="text"
                  {...register('guardian_phone')}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. +234 803 999 8888"
                />
                {errors.guardian_phone && <p className="mt-1 text-xs text-red-600">{errors.guardian_phone.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600">Guardian Email</label>
                <input
                  type="email"
                  {...register('guardian_email')}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. emeka@gmail.com"
                />
                {errors.guardian_email && <p className="mt-1 text-xs text-red-600">{errors.guardian_email.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-600">Guardian Physical Address</label>
              <textarea
                rows={2}
                {...register('guardian_address')}
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Leave blank if same as patient address"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => router.push('/dashboard/patients')}
              className="rounded-full bg-white border border-zinc-200 px-5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-full bg-teal-600 px-6 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:bg-teal-400 shadow-sm"
            >
              {mutation.isPending ? 'Registering...' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
