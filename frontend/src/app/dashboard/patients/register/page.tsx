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
      <div className="bg-white border border-brand-cream-dark/60 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div>
          <h2 className="font-serif text-xl font-bold text-brand-charcoal">Register New Patient</h2>
          <p className="mt-1 text-xs text-brand-muted font-medium">
            Please register the patient details along with their primary guardian contact details.
          </p>
        </div>

        {mutation.isError && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-xs text-red-800 border border-red-200/50">
            {((mutation.error as any)?.response?.data?.message) || 'Failed to register patient. Please check input.'}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-8 text-brand-charcoal-light">
          {/* Section 1: Patient Demographic Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">
              1. Patient Demographics
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Patient Full Name *</label>
                <input
                  type="text"
                  {...register('name')}
                  className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                  placeholder="e.g. Somto Ndu"
                />
                {errors.name && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Phone Number (Optional)</label>
                <input
                  type="text"
                  {...register('phone')}
                  className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                  placeholder="e.g. +234 803 111 2222"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Date of Birth *</label>
                <input
                  type="date"
                  {...register('date_of_birth')}
                  className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal-light placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                />
                {errors.date_of_birth && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.date_of_birth.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Gender *</label>
                <select
                  {...register('gender')}
                  className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal-light bg-white focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all cursor-pointer"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Physical Address *</label>
              <textarea
                rows={2}
                {...register('address')}
                className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                placeholder="e.g. No. 5 Awka Road, Nibo, Anambra State"
              />
              {errors.address && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.address.message}</p>}
            </div>
          </div>

          {/* Section 2: Primary Guardian Details */}
          <div className="space-y-4 pt-4 border-t border-brand-cream-dark/45">
            <h3 className="text-xs font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">
              2. Primary Guardian Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Guardian Name *</label>
                <input
                  type="text"
                  {...register('guardian_name')}
                  className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                  placeholder="e.g. Chief Emeka Ndu"
                />
                {errors.guardian_name && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.guardian_name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Relationship *</label>
                <input
                  type="text"
                  {...register('guardian_relationship')}
                  className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                  placeholder="e.g. Father, Uncle, Mother"
                />
                {errors.guardian_relationship && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.guardian_relationship.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Guardian Phone *</label>
                <input
                  type="text"
                  {...register('guardian_phone')}
                  className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                  placeholder="e.g. +234 803 999 8888"
                />
                {errors.guardian_phone && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.guardian_phone.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Guardian Email</label>
                <input
                  type="email"
                  {...register('guardian_email')}
                  className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                  placeholder="e.g. emeka@gmail.com"
                />
                {errors.guardian_email && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.guardian_email.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Guardian Physical Address</label>
              <textarea
                rows={2}
                {...register('guardian_address')}
                className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                placeholder="Leave blank if same as patient address"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-brand-cream-dark/45">
            <button
              type="button"
              onClick={() => router.push('/dashboard/patients')}
              className="rounded-full bg-white border border-brand-cream-dark/60 px-6 py-2.5 text-xs font-bold text-brand-charcoal hover:bg-brand-cream/35 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-full bg-brand-accent hover:bg-brand-accent-dark px-6 py-2.5 text-xs font-bold text-white disabled:bg-brand-accent/50 shadow-md shadow-brand-accent/20 transition-all cursor-pointer"
            >
              {mutation.isPending ? 'Registering...' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
