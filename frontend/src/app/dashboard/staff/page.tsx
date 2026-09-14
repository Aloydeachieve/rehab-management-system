'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUser } from '@/lib/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useState } from 'react';
import Link from 'next/link';

interface StaffUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  roles: string[];
  staff_profile: {
    profession: string | null;
    license_number: string | null;
    status: string;
  } | null;
  last_login_at: string | null;
  created_at: string;
}

const staffSchema = zod.object({
  name: zod.string().min(1, 'Name is required').max(100),
  email: zod.string().email('Invalid email address'),
  phone: zod.string().max(25).optional().or(zod.literal('')),
  password: zod.string().min(8, 'Password must be at least 8 characters').or(zod.literal('')),
  role: zod.enum(['admin', 'doctor', 'receptionist']),
  profession: zod.string().optional().or(zod.literal('')),
  license_number: zod.string().optional().or(zod.literal('')),
  status: zod.enum(['active', 'inactive']).optional(),
});

type StaffFormValues = zod.infer<typeof staffSchema>;

export default function StaffPage() {
  const { data: currentUser, isLoading: userLoading } = useUser();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);

  const isAdmin = currentUser?.roles?.includes('admin');

  // Fetch staff users
  const { data: staffRes, isLoading, isError } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => (await api.get('/users')).data,
    enabled: !!isAdmin,
  });

  const staffList: StaffUser[] = staffRes?.users ?? [];

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'receptionist',
      profession: '',
      license_number: '',
      status: 'active',
    },
  });

  const selectedRole = watch('role');

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: StaffFormValues) => {
      const payload = {
        ...data,
        phone: data.phone || null,
        profession: data.profession || null,
        license_number: data.license_number || null,
      };
      return (await api.post('/users', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      handleCloseModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: StaffFormValues }) => {
      const payload = {
        ...data,
        phone: data.phone || null,
        password: data.password || null, // send null if not changing password
        profession: data.profession || null,
        license_number: data.license_number || null,
      };
      return (await api.patch(`/users/${id}`, payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      handleCloseModal();
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (id: number) => {
      return (await api.delete(`/users/${id}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const handleOpenCreateModal = () => {
    setEditingStaff(null);
    reset({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'receptionist',
      profession: '',
      license_number: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (staff: StaffUser) => {
    setEditingStaff(staff);
    reset({
      name: staff.name,
      email: staff.email,
      phone: staff.phone ?? '',
      password: '', // blank password unless changing it
      role: (staff.roles[0] as any) ?? 'receptionist',
      profession: staff.staff_profile?.profession ?? '',
      license_number: staff.staff_profile?.license_number ?? '',
      status: (staff.status as any) ?? 'active',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
    reset();
  };

  const onSubmit = (data: StaffFormValues) => {
    if (editingStaff) {
      updateMutation.mutate({ id: editingStaff.id, data });
    } else {
      // For creation, password is required
      if (!data.password) {
        alert('Password is required for new accounts');
        return;
      }
      createMutation.mutate(data);
    }
  };

  const handleToggleStatus = (id: number, name: string) => {
    if (confirm(`Are you sure you want to toggle the active status of ${name}?`)) {
      toggleStatusMutation.mutate(id);
    }
  };

  if (userLoading) {
    return (
      <div className="flex justify-center items-center py-20 bg-white border border-brand-cream-dark/60 rounded-2xl">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-cream-dark/30 border-t-brand-primary" />
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
          Staff account administration and credential provisioning can only be performed by System Administrators.
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
    <div className="space-y-6 text-brand-charcoal-light">
      {/* Header action */}
      <div className="flex justify-between items-center bg-white p-4.5 rounded-2xl border border-brand-cream-dark/60 shadow-sm">
        <div>
          <h2 className="font-serif text-base font-bold text-brand-charcoal">Manage Staff Accounts</h2>
          <p className="text-xs text-brand-muted font-medium mt-0.5">Add, update, or deactivate accounts for doctors, receptionists, and admins.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="rounded-full bg-brand-accent hover:bg-brand-accent-dark px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-accent/20 transition-all cursor-pointer"
        >
          + Add Staff Account
        </button>
      </div>

      {/* Staff Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20 bg-white border border-brand-cream-dark/60 rounded-2xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-cream-dark/30 border-t-brand-primary" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-800 border-red-200/50">
          An error occurred while fetching staff directory.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-brand-cream-dark/60 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-brand-cream-dark/35 text-left text-sm text-brand-charcoal-light">
            <thead className="bg-brand-cream/45 text-xs font-bold text-brand-charcoal uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-cream-dark/30 bg-white">
              {staffList.map((staff) => (
                <tr key={staff.id} className="hover:bg-brand-cream/10 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-brand-charcoal">{staff.name}</p>
                    {staff.staff_profile?.profession && (
                      <p className="text-xs text-brand-muted font-semibold mt-0.5">
                        {staff.staff_profile.profession}
                        {staff.staff_profile.license_number && ` (Lic: ${staff.staff_profile.license_number})`}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-brand-charcoal font-semibold">{staff.email}</p>
                    {staff.phone && <p className="text-xs text-brand-muted font-semibold mt-0.5">{staff.phone}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-lg bg-brand-cream border border-brand-cream-dark/65 px-2.5 py-0.5 text-xs font-bold text-brand-charcoal-light uppercase">
                      {staff.roles.join(', ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ring-1 ring-inset ${
                        staff.status === 'active'
                          ? 'bg-brand-primary/10 text-brand-primary ring-brand-primary/20'
                          : 'bg-red-50 text-red-800 ring-red-600/20'
                      }`}
                    >
                      {staff.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-brand-muted font-medium">
                    {staff.last_login_at ? new Date(staff.last_login_at).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => handleOpenEditModal(staff)}
                      className="rounded-full bg-white border border-brand-cream-dark/60 px-3 py-1.5 text-xs font-bold text-brand-charcoal hover:bg-brand-cream/35 transition-all cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(staff.id, staff.name)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                        staff.status === 'active'
                          ? 'bg-red-50 text-red-600 hover:bg-red-100/60'
                          : 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20'
                      }`}
                    >
                      {staff.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-charcoal/45 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-brand-cream-dark/60 bg-white p-6 shadow-xl space-y-6 text-brand-charcoal-light">
            <div>
              <h3 className="font-serif text-lg font-bold text-brand-charcoal">
                {editingStaff ? 'Edit Staff Account' : 'Add New Staff Account'}
              </h3>
              <p className="mt-1 text-xs text-brand-muted font-medium">
                {editingStaff ? 'Modify existing staff credentials and configurations.' : 'Register a new employee into the system.'}
              </p>
            </div>

            {/* Error notifications */}
            {(createMutation.isError || updateMutation.isError) && (
              <div className="rounded-xl bg-red-50 p-4 text-xs text-red-800 border border-red-200/50">
                {((createMutation.error || updateMutation.error) as any)?.response?.data?.message || 'Submission failed.'}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-brand-charcoal-light">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Full Name *</label>
                <input
                  type="text"
                  {...register('name')}
                  className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                  placeholder="e.g. Dr. Ngozi Ezenwa"
                />
                {errors.name && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.name.message}</p>}
              </div>

              {/* Email & Phone grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    {...register('email')}
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                    placeholder="e.g. ngozi@rehabcenter.local"
                  />
                  {errors.email && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    {...register('phone')}
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                    placeholder="e.g. +234 803 123 4567"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">
                  Password {editingStaff ? '(Leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  {...register('password')}
                  className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                  placeholder={editingStaff ? '••••••••' : 'Minimum 8 characters'}
                />
                {errors.password && <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.password.message}</p>}
              </div>

              {/* Role & Status grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">System Role *</label>
                  <select
                    {...register('role')}
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal-light bg-white focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="receptionist">Receptionist</option>
                    <option value="doctor">Doctor / Professional</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Account Status *</label>
                  <select
                    {...register('status')}
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal-light bg-white focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Doctor / Receptionist specific profile fields */}
              {(selectedRole === 'doctor' || selectedRole === 'receptionist') && (
                <div className="grid grid-cols-2 gap-4 border-t border-brand-cream-dark/45 pt-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Profession / Title</label>
                    <input
                      type="text"
                      {...register('profession')}
                      className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                      placeholder={selectedRole === 'doctor' ? 'e.g. Psychiatrist' : 'e.g. Front Desk Lead'}
                    />
                  </div>
                  {selectedRole === 'doctor' && (
                    <div>
                      <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">License Number</label>
                      <input
                        type="text"
                        {...register('license_number')}
                        className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                        placeholder="e.g. MD-98765-NGR"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-brand-cream-dark/45">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-full bg-white border border-brand-cream-dark/60 px-5 py-2.5 text-xs font-bold text-brand-charcoal hover:bg-brand-cream/35 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="rounded-full bg-brand-accent hover:bg-brand-accent-dark px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-accent/20 transition-all disabled:bg-brand-accent/50 cursor-pointer"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
