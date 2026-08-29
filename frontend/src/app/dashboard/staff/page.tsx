'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useState } from 'react';

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
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);

  // Fetch staff users
  const { data: staffRes, isLoading, isError } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => (await api.get('/users')).data,
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

  return (
    <div className="space-y-6">
      {/* Header action */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Manage Staff Accounts</h2>
          <p className="text-xs text-zinc-400">Add, update, or deactivate accounts for doctors, receptionists, and admins.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="rounded-full bg-teal-600 hover:bg-teal-700 px-4 py-2 text-xs font-semibold text-white shadow-sm"
        >
          + Add Staff Account
        </button>
      </div>

      {/* Staff Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20 bg-white border border-zinc-200 rounded-2xl">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-teal-600" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-800">
          An error occurred while fetching staff directory.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-zinc-200 text-left text-sm text-zinc-500">
            <thead className="bg-zinc-50 text-xs font-semibold text-zinc-700 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {staffList.map((staff) => (
                <tr key={staff.id} className="hover:bg-zinc-50/50">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-zinc-800">{staff.name}</p>
                    {staff.staff_profile?.profession && (
                      <p className="text-xs text-zinc-400">
                        {staff.staff_profile.profession}
                        {staff.staff_profile.license_number && ` (Lic: ${staff.staff_profile.license_number})`}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-zinc-700 font-medium">{staff.email}</p>
                    {staff.phone && <p className="text-xs text-zinc-400">{staff.phone}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-800 ring-1 ring-inset ring-teal-600/20 uppercase">
                      {staff.roles.join(', ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                        staff.status === 'active'
                          ? 'bg-teal-50 text-teal-800 ring-teal-600/20'
                          : 'bg-red-50 text-red-800 ring-red-600/20'
                      }`}
                    >
                      {staff.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-400">
                    {staff.last_login_at ? new Date(staff.last_login_at).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => handleOpenEditModal(staff)}
                      className="rounded-full bg-white border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(staff.id, staff.name)}
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        staff.status === 'active'
                          ? 'bg-red-50 text-red-600 hover:bg-red-100/50'
                          : 'bg-teal-50 text-teal-700 hover:bg-teal-100/50'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-950">
                {editingStaff ? 'Edit Staff Account' : 'Add New Staff Account'}
              </h3>
              <p className="mt-1 text-xs text-zinc-400">
                {editingStaff ? 'Modify existing staff credentials and configurations.' : 'Register a new employee into the system.'}
              </p>
            </div>

            {/* Error notifications */}
            {(createMutation.isError || updateMutation.isError) && (
              <div className="rounded-lg bg-red-50 p-4 text-xs text-red-800 border border-red-200">
                {((createMutation.error || updateMutation.error) as any)?.response?.data?.message || 'Submission failed.'}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-zinc-700">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700">Full Name *</label>
                <input
                  type="text"
                  {...register('name')}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="e.g. Dr. Ngozi Ezenwa"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
              </div>

              {/* Email & Phone grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700">Email Address *</label>
                  <input
                    type="email"
                    {...register('email')}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="e.g. ngozi@rehabcenter.local"
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700">Phone Number</label>
                  <input
                    type="text"
                    {...register('phone')}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="e.g. +234 803 123 4567"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700">
                  Password {editingStaff ? '(Leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  {...register('password')}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder={editingStaff ? '••••••••' : 'Minimum 8 characters'}
                />
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
              </div>

              {/* Role & Status grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700">System Role *</label>
                  <select
                    {...register('role')}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 bg-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="receptionist">Receptionist</option>
                    <option value="doctor">Doctor / Professional</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700">Account Status *</label>
                  <select
                    {...register('status')}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 bg-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Doctor / Receptionist specific profile fields */}
              {(selectedRole === 'doctor' || selectedRole === 'receptionist') && (
                <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700">Profession / Title</label>
                    <input
                      type="text"
                      {...register('profession')}
                      className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      placeholder={selectedRole === 'doctor' ? 'e.g. Psychiatrist' : 'e.g. Front Desk Lead'}
                    />
                  </div>
                  {selectedRole === 'doctor' && (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700">License Number</label>
                      <input
                        type="text"
                        {...register('license_number')}
                        className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        placeholder="e.g. MD-98765-NGR"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-full bg-white border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="rounded-full bg-teal-600 px-6 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:bg-teal-400"
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
