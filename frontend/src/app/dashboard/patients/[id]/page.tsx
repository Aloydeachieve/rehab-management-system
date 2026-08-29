'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUser } from '@/lib/auth';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

interface Guardian {
  id: number;
  name: string;
  relationship: string;
  phone: string;
  email: string | null;
  address: string | null;
  is_primary: boolean;
}

interface Admission {
  id: number;
  admission_date: string;
  admission_type: string;
  status: string;
  notes: string | null;
  admitted_by?: {
    name: string;
  };
}

interface Patient {
  id: number;
  patient_number: string;
  name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  created_at: string;
  guardians: Guardian[];
  admissions: Admission[];
}

export default function PatientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: currentUser } = useUser();
  const queryClient = useQueryClient();
  const id = params.id;

  const [activeTab, setActiveTab] = useState<'operational' | 'history' | 'vitals' | 'assessments' | 'clinical-notes' | 'progress-notes' | 'prescriptions' | 'treatment-plans' | 'medications'>('operational');

  // Input states for various forms
  const [historyContent, setHistoryContent] = useState('');
  
  const [vitalsTemp, setVitalsTemp] = useState('');
  const [vitalsPulse, setVitalsPulse] = useState('');
  const [vitalsBp, setVitalsBp] = useState('');
  const [vitalsRr, setVitalsRr] = useState('');
  const [vitalsWeight, setVitalsWeight] = useState('');
  const [vitalsNotes, setVitalsNotes] = useState('');

  const [assessmentType, setAssessmentType] = useState('Psychological');
  const [assessmentFindings, setAssessmentFindings] = useState('');
  const [assessmentRecs, setAssessmentRecs] = useState('');

  const [clinicalNoteType, setClinicalNoteType] = useState('Observation');
  const [clinicalNoteContent, setClinicalNoteContent] = useState('');

  const [progressNoteContent, setProgressNoteContent] = useState('');

  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [prescriptionItems, setPrescriptionItems] = useState([
    { medication_name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);

  const [planGoals, setPlanGoals] = useState('');
  const [planContent, setPlanContent] = useState('');
  const [planReviewDate, setPlanReviewDate] = useState('');

  // Fetch patient profile details
  const { data: profileRes, isLoading, isError } = useQuery({
    queryKey: ['patient-profile', id],
    queryFn: async () => (await api.get(`/patients/${id}`)).data,
    enabled: !!id,
  });

  const patient: Patient | null = profileRes?.patient ?? null;

  // Fetch patient sessions
  const { data: sessionsRes } = useQuery({
    queryKey: ['patient-sessions', id],
    queryFn: async () => (await api.get(`/patients/${id}/sessions`)).data,
    enabled: !!id,
  });

  const isClinician = currentUser?.roles.includes('admin') || currentUser?.roles.includes('doctor');
  const canWrite = currentUser?.roles.includes('admin') || currentUser?.roles.includes('receptionist');

  // =========================================================================
  // CLINICAL QUERIES
  // =========================================================================
  const { data: historyRes, refetch: refetchHistory } = useQuery({
    queryKey: ['medical-history', id],
    queryFn: async () => (await api.get(`/patients/${id}/medical-history`)).data,
    enabled: !!id && isClinician && activeTab === 'history',
  });

  const { data: vitalsRes, refetch: refetchVitals } = useQuery({
    queryKey: ['vital-signs', id],
    queryFn: async () => (await api.get(`/patients/${id}/vital-signs`)).data,
    enabled: !!id && isClinician && activeTab === 'vitals',
  });

  const { data: assessmentsRes, refetch: refetchAssessments } = useQuery({
    queryKey: ['assessments', id],
    queryFn: async () => (await api.get(`/patients/${id}/assessments`)).data,
    enabled: !!id && isClinician && activeTab === 'assessments',
  });

  const { data: clinicalNotesRes, refetch: refetchClinicalNotes } = useQuery({
    queryKey: ['clinical-notes', id],
    queryFn: async () => (await api.get(`/patients/${id}/clinical-notes`)).data,
    enabled: !!id && isClinician && activeTab === 'clinical-notes',
  });

  const { data: progressNotesRes, refetch: refetchProgressNotes } = useQuery({
    queryKey: ['progress-notes', id],
    queryFn: async () => (await api.get(`/patients/${id}/progress-notes`)).data,
    enabled: !!id && isClinician && activeTab === 'progress-notes',
  });

  const { data: prescriptionsRes, refetch: refetchPrescriptions } = useQuery({
    queryKey: ['prescriptions', id],
    queryFn: async () => (await api.get(`/patients/${id}/prescriptions`)).data,
    enabled: !!id && isClinician && activeTab === 'prescriptions',
  });

  const { data: plansRes, refetch: refetchPlans } = useQuery({
    queryKey: ['treatment-plans', id],
    queryFn: async () => (await api.get(`/patients/${id}/treatment-plans`)).data,
    enabled: !!id && isClinician && activeTab === 'treatment-plans',
  });

  // Medications queries (Phase 6)
  const { data: patientPrescriptionsRes } = useQuery({
    queryKey: ['patient-prescriptions', id],
    queryFn: async () => (await api.get(`/patients/${id}/prescriptions`)).data,
    enabled: !!id && activeTab === 'medications',
  });

  const { data: patientAdminsRes } = useQuery({
    queryKey: ['patient-medications', id],
    queryFn: async () => (await api.get(`/patients/${id}/medication-administrations`)).data,
    enabled: !!id && activeTab === 'medications',
  });

  // =========================================================================
  // FORM MUTATIONS
  // =========================================================================
  const postHistory = useMutation({
    mutationFn: async () => api.post(`/patients/${id}/medical-history`, { content: historyContent }),
    onSuccess: () => {
      setHistoryContent('');
      refetchHistory();
    }
  });

  const postVitals = useMutation({
    mutationFn: async () => {
      const payload: any = {};
      if (vitalsTemp) payload.temperature = parseFloat(vitalsTemp);
      if (vitalsPulse) payload.pulse = parseInt(vitalsPulse, 10);
      if (vitalsBp) payload.blood_pressure = vitalsBp;
      if (vitalsRr) payload.respiratory_rate = parseInt(vitalsRr, 10);
      if (vitalsWeight) payload.weight = parseFloat(vitalsWeight);
      if (vitalsNotes) payload.notes = vitalsNotes;
      return api.post(`/patients/${id}/vital-signs`, payload);
    },
    onSuccess: () => {
      setVitalsTemp('');
      setVitalsPulse('');
      setVitalsBp('');
      setVitalsRr('');
      setVitalsWeight('');
      setVitalsNotes('');
      refetchVitals();
    }
  });

  const postAssessment = useMutation({
    mutationFn: async () => api.post(`/patients/${id}/assessments`, {
      assessment_type: assessmentType,
      findings: assessmentFindings,
      recommendation: assessmentRecs,
    }),
    onSuccess: () => {
      setAssessmentFindings('');
      setAssessmentRecs('');
      refetchAssessments();
    }
  });

  const postClinicalNote = useMutation({
    mutationFn: async () => api.post(`/patients/${id}/clinical-notes`, {
      note_type: clinicalNoteType,
      content: clinicalNoteContent,
    }),
    onSuccess: () => {
      setClinicalNoteContent('');
      refetchClinicalNotes();
    }
  });

  const postProgressNote = useMutation({
    mutationFn: async () => api.post(`/patients/${id}/progress-notes`, {
      content: progressNoteContent,
    }),
    onSuccess: () => {
      setProgressNoteContent('');
      refetchProgressNotes();
    }
  });

  const postPrescription = useMutation({
    mutationFn: async () => api.post(`/patients/${id}/prescriptions`, {
      notes: prescriptionNotes || null,
      items: prescriptionItems,
    }),
    onSuccess: () => {
      setPrescriptionNotes('');
      setPrescriptionItems([{ medication_name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
      refetchPrescriptions();
    }
  });

  const postPlan = useMutation({
    mutationFn: async () => api.post(`/patients/${id}/treatment-plans`, {
      goals: planGoals,
      plan: planContent,
      review_date: planReviewDate || null,
    }),
    onSuccess: () => {
      setPlanGoals('');
      setPlanContent('');
      setPlanReviewDate('');
      refetchPlans();
    }
  });

  // Helper functions for prescription multi-item list
  const addPrescriptionItem = () => {
    setPrescriptionItems([...prescriptionItems, { medication_name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };
  const removePrescriptionItem = (index: number) => {
    if (prescriptionItems.length > 1) {
      setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
    }
  };
  const updatePrescriptionItem = (index: number, field: string, value: string) => {
    const updated = [...prescriptionItems];
    updated[index] = { ...updated[index], [field]: value };
    setPrescriptionItems(updated);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 bg-white border border-zinc-200 rounded-2xl shadow-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-teal-600" />
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-800">
        Failed to load patient profile details. It may not exist, or you lack access permissions.
      </div>
    );
  }

  const hasActiveAdmission = patient.admissions?.some((adm) => adm.status === 'active');

  return (
    <div className="space-y-6">
      {/* Header Profile Dashboard */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-900">{patient.name}</h2>
            <span className="font-mono text-xs font-semibold bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">
              {patient.patient_number}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Registered: {new Date(patient.created_at).toLocaleDateString()} &bull; Phone: {patient.phone ?? 'N/A'}
          </p>
        </div>

        <div className="flex gap-2">
          {canWrite && !hasActiveAdmission && (
            <Link
              href={`/dashboard/patients/${patient.id}/admit`}
              className="rounded-full bg-teal-600 hover:bg-teal-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors text-center"
            >
              Admit Patient
            </Link>
          )}
          <button
            onClick={() => router.push('/dashboard/patients')}
            className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Back to Directory
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="border-b border-zinc-200 bg-white rounded-t-xl px-4 flex gap-6 overflow-x-auto shadow-sm">
        <button
          onClick={() => setActiveTab('operational')}
          className={`py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'operational'
              ? 'border-teal-600 text-teal-600 font-bold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Operational Timeline
        </button>

        {isClinician && (
          <>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'history'
                  ? 'border-teal-600 text-teal-600 font-bold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Medical History
            </button>
            <button
              onClick={() => setActiveTab('vitals')}
              className={`py-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'vitals'
                  ? 'border-teal-600 text-teal-600 font-bold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Vital Signs
            </button>
            <button
              onClick={() => setActiveTab('assessments')}
              className={`py-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'assessments'
                  ? 'border-teal-600 text-teal-600 font-bold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Assessments
            </button>
            <button
              onClick={() => setActiveTab('clinical-notes')}
              className={`py-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'clinical-notes'
                  ? 'border-teal-600 text-teal-600 font-bold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Clinical Notes
            </button>
            <button
              onClick={() => setActiveTab('progress-notes')}
              className={`py-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'progress-notes'
                  ? 'border-teal-600 text-teal-600 font-bold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Progress Notes
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`py-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'prescriptions'
                  ? 'border-teal-600 text-teal-600 font-bold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Prescriptions
            </button>
            <button
              onClick={() => setActiveTab('treatment-plans')}
              className={`py-3 text-xs font-semibold border-b-2 transition-all ${
                activeTab === 'treatment-plans'
                  ? 'border-teal-600 text-teal-600 font-bold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Treatment Plans
            </button>
          </>
        )}
        <button
          onClick={() => setActiveTab('medications')}
          className={`py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'medications'
              ? 'border-teal-600 text-teal-600 font-bold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Medications & eMAR
        </button>
      </div>

      {/* Tabs Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* OPERATIONAL / GENERAL INFO TAB */}
        {activeTab === 'operational' && (
          <>
            {/* Left Demographics column */}
            <div className="lg:col-span-1 space-y-6">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-teal-700 border-b border-zinc-100 pb-2 uppercase tracking-wider">
                  Patient Demographics
                </h3>
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase">Physical Address</p>
                  <p className="text-sm text-zinc-600 mt-0.5 leading-relaxed">{patient.address ?? 'None'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-zinc-400 uppercase">Gender</p>
                    <p className="text-sm text-zinc-700 capitalize mt-0.5">{patient.gender ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-400 uppercase">Date of Birth</p>
                    <p className="text-sm text-zinc-700 mt-0.5">
                      {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase">Status</p>
                  <span
                    className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                      hasActiveAdmission
                        ? 'bg-teal-50 text-teal-800 ring-teal-600/20'
                        : 'bg-zinc-50 text-zinc-800 ring-zinc-600/20'
                    }`}
                  >
                    {hasActiveAdmission ? 'Active Residential' : 'Inactive / Discharged'}
                  </span>
                </div>
              </div>

              {/* Guardians list */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-teal-700 border-b border-zinc-100 pb-2 uppercase tracking-wider">
                  Guardians Contact
                </h3>
                {patient.guardians?.map((guardian) => (
                  <div key={guardian.id} className="space-y-2 text-sm border-b border-zinc-50 last:border-b-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-zinc-800">{guardian.name}</p>
                      {guardian.is_primary && (
                        <span className="bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400">Relationship: {guardian.relationship}</p>
                    <p className="text-xs text-zinc-700">Phone: {guardian.phone}</p>
                    {guardian.email && <p className="text-xs text-zinc-700">Email: {guardian.email}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Admissions timeline column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold text-teal-700 border-b border-zinc-100 pb-2 mb-6 uppercase tracking-wider">
                  Admissions timeline
                </h3>
                <div className="flow-root">
                  <ul className="-mb-8">
                    <li>
                      <div className="relative pb-8">
                        <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-zinc-200" />
                        <div className="relative flex space-x-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-600 text-sm">
                            👤
                          </span>
                          <div className="flex min-w-0 flex-1 justify-between gap-4 pt-1.5">
                            <div>
                              <p className="text-sm font-semibold text-zinc-800">Registration logged</p>
                              <p className="text-xs text-zinc-400 mt-0.5">Demographics and guardian information configured.</p>
                            </div>
                            <div className="whitespace-nowrap text-right text-xs text-zinc-400">
                              {new Date(patient.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>

                    {patient.admissions?.map((admission, idx) => {
                      const isLast = idx === patient.admissions.length - 1;
                      return (
                        <li key={admission.id}>
                          <div className="relative pb-8">
                            {!isLast && <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-zinc-200" />}
                            <div className="relative flex space-x-3">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-600 text-sm">
                                🏥
                              </span>
                              <div className="flex min-w-0 flex-1 justify-between gap-4 pt-1.5">
                                <div>
                                  <p className="text-sm font-semibold text-zinc-800">
                                    Residential Admission - <span className="capitalize text-teal-600 font-bold">{admission.admission_type}</span>
                                  </p>
                                  {admission.notes && (
                                    <p className="text-xs text-zinc-500 mt-1 rounded bg-zinc-50 p-2 border border-zinc-100">
                                      <strong>Notes:</strong> {admission.notes}
                                    </p>
                                  )}
                                </div>
                                <div className="whitespace-nowrap text-right text-xs text-zinc-400">
                                  {new Date(admission.admission_date).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              {/* Treatment Sessions Section */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                  <h3 className="text-sm font-bold text-teal-700 uppercase tracking-wider">
                    Treatment Sessions / Residential Care
                  </h3>
                </div>

                <div className="space-y-4">
                  {sessionsRes?.map((session: any) => (
                    <div key={session.id} className="border border-zinc-150 rounded-xl p-4 text-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-teal-600/30 transition-colors bg-zinc-50/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-800">Session {session.session_number}</span>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                            session.status === 'active'
                              ? 'bg-teal-50 text-teal-700 ring-teal-600/10'
                              : session.status === 'completed'
                              ? 'bg-blue-50 text-blue-700 ring-blue-600/10'
                              : session.status === 'discharged'
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10'
                              : 'bg-zinc-50 text-zinc-600 ring-zinc-500/10'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">
                          Duration: {new Date(session.start_date).toLocaleDateString()} &rarr; {new Date(session.expected_end_date).toLocaleDateString()}
                        </p>
                        {session.professional && (
                          <p className="text-xs text-zinc-500 mt-1">
                            Clinician: <strong>{session.professional.name}</strong>
                          </p>
                        )}
                        {session.recommendation && (
                          <p className="text-xs text-teal-700 font-semibold mt-1">
                            Recommendation: <span className="capitalize">{session.recommendation} treatment</span>
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                        <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 px-2 py-1 rounded">
                          Pay Status: <span className="capitalize">{session.payment_status}</span>
                        </span>
                        <Link
                          href={`/dashboard/sessions/${session.id}`}
                          className="w-full sm:w-auto text-center rounded-full bg-white border border-zinc-200 hover:bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-700 shadow-sm transition-colors"
                        >
                          View Details &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}

                  {(!sessionsRes || sessionsRes.length === 0) && (
                    <p className="text-xs text-zinc-400 text-center py-6">No treatment sessions initiated.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* MEDICAL HISTORY TAB */}
        {activeTab === 'history' && isClinician && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider">Log Medical History</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500">History description</label>
                  <textarea
                    rows={4}
                    value={historyContent}
                    onChange={(e) => setHistoryContent(e.target.value)}
                    placeholder="Enter patient previous conditions, family history, details of past rehabilitation entries..."
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => postHistory.mutate()}
                  disabled={postHistory.isPending || !historyContent}
                  className="w-full rounded-full bg-teal-600 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:bg-teal-400 transition-colors"
                >
                  {postHistory.isPending ? 'Saving...' : 'Add Medical History'}
                </button>
              </div>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider">Historical History Logs</h4>
              <div className="space-y-4 divide-y divide-zinc-100">
                {historyRes?.data?.map((item: any) => (
                  <div key={item.id} className="pt-4 first:pt-0 text-sm">
                    <p className="text-zinc-700 leading-relaxed">{item.content}</p>
                    <p className="text-xs text-zinc-400 mt-2">
                      Recorded by: <strong>{item.recorded_by_user?.name ?? item.recorded_by?.name ?? 'Clinical Staff'}</strong> &bull; {new Date(item.recorded_at).toLocaleString()}
                    </p>
                  </div>
                ))}
                {(!historyRes?.data || historyRes.data.length === 0) && (
                  <p className="text-xs text-zinc-400 text-center py-6">No history logs recorded.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VITAL SIGNS TAB */}
        {activeTab === 'vitals' && isClinician && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider">Log Vitals</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500">Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitalsTemp}
                    onChange={(e) => setVitalsTemp(e.target.value)}
                    placeholder="36.5"
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500">Pulse (bpm)</label>
                  <input
                    type="number"
                    value={vitalsPulse}
                    onChange={(e) => setVitalsPulse(e.target.value)}
                    placeholder="72"
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500">BP (mmHg)</label>
                  <input
                    type="text"
                    value={vitalsBp}
                    onChange={(e) => setVitalsBp(e.target.value)}
                    placeholder="120/80"
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500">RR (bpm)</label>
                  <input
                    type="number"
                    value={vitalsRr}
                    onChange={(e) => setVitalsRr(e.target.value)}
                    placeholder="16"
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={vitalsWeight}
                  onChange={(e) => setVitalsWeight(e.target.value)}
                  placeholder="70.5"
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500">Observation Notes</label>
                <textarea
                  rows={2}
                  value={vitalsNotes}
                  onChange={(e) => setVitalsNotes(e.target.value)}
                  placeholder="Add optional notes..."
                  className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
              <button
                onClick={() => postVitals.mutate()}
                disabled={postVitals.isPending}
                className="w-full rounded-full bg-teal-600 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:bg-teal-400 transition-colors"
              >
                {postVitals.isPending ? 'Logging...' : 'Log Vitals'}
              </button>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider">Vitals logs</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200 text-left text-sm text-zinc-500">
                  <thead className="bg-zinc-50 text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Logged Date</th>
                      <th className="px-4 py-3">Temp</th>
                      <th className="px-4 py-3">Pulse</th>
                      <th className="px-4 py-3">BP</th>
                      <th className="px-4 py-3">RR</th>
                      <th className="px-4 py-3">Weight</th>
                      <th className="px-4 py-3">Notes</th>
                      <th className="px-4 py-3">Logged By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150">
                    {vitalsRes?.data?.map((sign: any) => (
                      <tr key={sign.id} className="hover:bg-zinc-50/50">
                        <td className="px-4 py-3 font-semibold text-zinc-700">
                          {new Date(sign.recorded_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">{sign.temperature ? `${sign.temperature}°C` : '-'}</td>
                        <td className="px-4 py-3">{sign.pulse ? `${sign.pulse} bpm` : '-'}</td>
                        <td className="px-4 py-3">{sign.blood_pressure ?? '-'}</td>
                        <td className="px-4 py-3">{sign.respiratory_rate ? `${sign.respiratory_rate}/m` : '-'}</td>
                        <td className="px-4 py-3">{sign.weight ? `${sign.weight} kg` : '-'}</td>
                        <td className="px-4 py-3 text-xs italic">{sign.notes ?? '-'}</td>
                        <td className="px-4 py-3 text-xs">
                          {sign.recorded_by_user?.name ?? sign.recorded_by?.name ?? 'Staff'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!vitalsRes?.data || vitalsRes.data.length === 0) && (
                  <p className="text-xs text-zinc-400 text-center py-6">No vitals registered yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ASSESSMENTS TAB */}
        {activeTab === 'assessments' && isClinician && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider">Add Assessment</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500">Assessment Type</label>
                  <select
                    value={assessmentType}
                    onChange={(e) => setAssessmentType(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white focus:border-teal-500 focus:outline-none"
                  >
                    <option value="Psychological">Psychological</option>
                    <option value="Physical Therapy">Physical Therapy</option>
                    <option value="Medical Examination">Medical Examination</option>
                    <option value="Intake Screening">Intake Screening</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500">Findings</label>
                  <textarea
                    rows={4}
                    value={assessmentFindings}
                    onChange={(e) => setAssessmentFindings(e.target.value)}
                    placeholder="Enter observation findings, client state details..."
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500">Recommendations</label>
                  <textarea
                    rows={2}
                    value={assessmentRecs}
                    onChange={(e) => setAssessmentRecs(e.target.value)}
                    placeholder="Clinician instructions or next action steps..."
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => postAssessment.mutate()}
                  disabled={postAssessment.isPending || !assessmentFindings || !assessmentRecs}
                  className="w-full rounded-full bg-teal-600 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:bg-teal-400 transition-colors"
                >
                  {postAssessment.isPending ? 'Saving...' : 'Add Assessment'}
                </button>
              </div>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider">Assessment History</h4>
              <div className="space-y-4">
                {assessmentsRes?.data?.map((assessment: any) => (
                  <div key={assessment.id} className="border border-zinc-150 rounded-xl p-4 text-sm space-y-2">
                    <div className="flex justify-between items-center border-b border-zinc-50 pb-2">
                      <span className="font-bold text-teal-700 capitalize">{assessment.assessment_type}</span>
                      <span className="text-xs text-zinc-400">
                        {new Date(assessment.recorded_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-400 uppercase">Findings</p>
                      <p className="text-zinc-700 mt-0.5 bg-zinc-50/50 p-2 rounded border border-zinc-100">{assessment.findings}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-400 uppercase">Recommendations</p>
                      <p className="text-zinc-700 mt-0.5 bg-teal-50/20 p-2 rounded border border-teal-600/10 italic">{assessment.recommendation}</p>
                    </div>
                    <p className="text-xs text-zinc-400 text-right">
                      Evaluated by: <strong>{assessment.practitioner?.name ?? 'Clinical Practitioner'}</strong>
                    </p>
                  </div>
                ))}
                {(!assessmentsRes?.data || assessmentsRes.data.length === 0) && (
                  <p className="text-xs text-zinc-400 text-center py-6">No assessments logged.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CLINICAL NOTES TAB */}
        {activeTab === 'clinical-notes' && isClinician && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider">Create Clinical Note</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500">Note Type</label>
                  <select
                    value={clinicalNoteType}
                    onChange={(e) => setClinicalNoteType(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white focus:border-teal-500 focus:outline-none"
                  >
                    <option value="Observation">Observation</option>
                    <option value="Clinical Review">Clinical Review</option>
                    <option value="Intake Note">Intake Note</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500">Content</label>
                  <textarea
                    rows={5}
                    value={clinicalNoteContent}
                    onChange={(e) => setClinicalNoteContent(e.target.value)}
                    placeholder="Enter clinical notes, behavioral details..."
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => postClinicalNote.mutate()}
                  disabled={postClinicalNote.isPending || !clinicalNoteContent}
                  className="w-full rounded-full bg-teal-600 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:bg-teal-400 transition-colors"
                >
                  {postClinicalNote.isPending ? 'Saving...' : 'Add Note'}
                </button>
              </div>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider">Note History</h4>
              <div className="space-y-4 divide-y divide-zinc-100">
                {clinicalNotesRes?.data?.map((note: any) => (
                  <div key={note.id} className="pt-4 first:pt-0 text-sm space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">
                        {note.note_type}
                      </span>
                      <span className="text-xs text-zinc-400">{new Date(note.recorded_at).toLocaleString()}</span>
                    </div>
                    <p className="text-zinc-700 mt-1 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                    <p className="text-xs text-zinc-400 text-right">
                      Author: <strong>{note.practitioner?.name ?? 'Clinical Practitioner'}</strong>
                    </p>
                  </div>
                ))}
                {(!clinicalNotesRes?.data || clinicalNotesRes.data.length === 0) && (
                  <p className="text-xs text-zinc-400 text-center py-6">No clinical notes recorded.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PROGRESS NOTES TAB */}
        {activeTab === 'progress-notes' && isClinician && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider">Log Progress Note</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500">Progress Report / Activities</label>
                  <textarea
                    rows={5}
                    value={progressNoteContent}
                    onChange={(e) => setProgressNoteContent(e.target.value)}
                    placeholder="Enter daily progress summaries, response to treatment, therapy interactions..."
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => postProgressNote.mutate()}
                  disabled={postProgressNote.isPending || !progressNoteContent}
                  className="w-full rounded-full bg-teal-600 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:bg-teal-400 transition-colors"
                >
                  {postProgressNote.isPending ? 'Logging...' : 'Log Progress'}
                </button>
              </div>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider">Progress Logs</h4>
              <div className="space-y-4 divide-y divide-zinc-100">
                {progressNotesRes?.data?.map((note: any) => (
                  <div key={note.id} className="pt-4 first:pt-0 text-sm space-y-1">
                    <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                    <p className="text-xs text-zinc-400 text-right">
                      Practitioner: <strong>{note.practitioner?.name ?? 'Clinical Practitioner'}</strong> &bull; {new Date(note.recorded_at).toLocaleString()}
                    </p>
                  </div>
                ))}
                {(!progressNotesRes?.data || progressNotesRes.data.length === 0) && (
                  <p className="text-xs text-zinc-400 text-center py-6">No progress logs recorded.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PRESCRIPTIONS TAB */}
        {activeTab === 'prescriptions' && isClinician && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider">Write Prescription</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500">Instructions / Notes (Optional)</label>
                  <input
                    type="text"
                    value={prescriptionNotes}
                    onChange={(e) => setPrescriptionNotes(e.target.value)}
                    placeholder="General prescription notes..."
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>

                {/* Medication items builder */}
                <div className="space-y-4 border-t border-zinc-100 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-teal-600">Medications List</span>
                    <button
                      type="button"
                      onClick={addPrescriptionItem}
                      className="text-xs font-bold text-teal-600 hover:underline"
                    >
                      + Add Item
                    </button>
                  </div>

                  {prescriptionItems.map((item, idx) => (
                    <div key={idx} className="bg-zinc-50/50 p-3 rounded-lg border border-zinc-200 relative space-y-2">
                      {prescriptionItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePrescriptionItem(idx)}
                          className="absolute top-2 right-2 text-xs font-bold text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase">Medication Name</label>
                        <input
                          type="text"
                          required
                          value={item.medication_name}
                          onChange={(e) => updatePrescriptionItem(idx, 'medication_name', e.target.value)}
                          placeholder="e.g. Clonidine"
                          className="mt-0.5 block w-full rounded border border-zinc-300 px-2 py-1 text-xs focus:border-teal-500 focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase">Dosage</label>
                          <input
                            type="text"
                            required
                            value={item.dosage}
                            onChange={(e) => updatePrescriptionItem(idx, 'dosage', e.target.value)}
                            placeholder="e.g. 0.1mg"
                            className="mt-0.5 block w-full rounded border border-zinc-300 px-2 py-1 text-xs focus:border-teal-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase">Freq</label>
                          <input
                            type="text"
                            required
                            value={item.frequency}
                            onChange={(e) => updatePrescriptionItem(idx, 'frequency', e.target.value)}
                            placeholder="e.g. 2x Daily"
                            className="mt-0.5 block w-full rounded border border-zinc-300 px-2 py-1 text-xs focus:border-teal-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase">Dur</label>
                          <input
                            type="text"
                            required
                            value={item.duration}
                            onChange={(e) => updatePrescriptionItem(idx, 'duration', e.target.value)}
                            placeholder="e.g. 7 days"
                            className="mt-0.5 block w-full rounded border border-zinc-300 px-2 py-1 text-xs focus:border-teal-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase">Instructions</label>
                        <input
                          type="text"
                          value={item.instructions}
                          onChange={(e) => updatePrescriptionItem(idx, 'instructions', e.target.value)}
                          placeholder="e.g. Take with water"
                          className="mt-0.5 block w-full rounded border border-zinc-300 px-2 py-1 text-xs focus:border-teal-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => postPrescription.mutate()}
                  disabled={postPrescription.isPending || prescriptionItems.some(i => !i.medication_name || !i.dosage)}
                  className="w-full rounded-full bg-teal-600 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:bg-teal-400 transition-colors shadow-sm"
                >
                  {postPrescription.isPending ? 'Creating...' : 'Prescribe Medications'}
                </button>
              </div>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider">Prescriptions Directory</h4>
              <div className="space-y-4">
                {prescriptionsRes?.data?.map((presc: any) => (
                  <div key={presc.id} className="border border-zinc-150 rounded-xl p-4 text-sm space-y-3">
                    <div className="flex justify-between items-center border-b border-zinc-50 pb-2">
                      <span className="font-bold text-zinc-800">
                        Prescription Code: <span className="font-mono text-teal-700">#PR-{presc.id}</span>
                      </span>
                      <span className="text-xs text-zinc-400">
                        {new Date(presc.prescribed_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-zinc-400 uppercase block">Medications:</span>
                      <ul className="space-y-2 divide-y divide-zinc-50">
                        {presc.items?.map((med: any) => (
                          <div key={med.id} className="pt-2 first:pt-0">
                            <p className="font-semibold text-zinc-800">
                              {med.medication_name} &bull; <span className="text-xs text-zinc-500">{med.dosage} &bull; {med.frequency} ({med.duration})</span>
                            </p>
                            {med.instructions && (
                              <p className="text-xs text-zinc-400 italic mt-0.5">Instructions: {med.instructions}</p>
                            )}
                          </div>
                        ))}
                      </ul>
                    </div>

                    {presc.notes && (
                      <p className="text-xs text-zinc-500 mt-2 bg-zinc-50 p-2 rounded border border-zinc-100">
                        <strong>Notes:</strong> {presc.notes}
                      </p>
                    )}

                    <p className="text-xs text-zinc-400 text-right border-t border-zinc-50 pt-2">
                      Prescribed by: <strong>{presc.practitioner?.name ?? 'Clinical Staff'}</strong>
                    </p>
                  </div>
                ))}
                {(!prescriptionsRes?.data || prescriptionsRes.data.length === 0) && (
                  <p className="text-xs text-zinc-400 text-center py-6">No prescriptions written yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TREATMENT PLANS TAB */}
        {activeTab === 'treatment-plans' && isClinician && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider">Log Treatment Plan</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500">Plan Goals *</label>
                  <textarea
                    rows={3}
                    value={planGoals}
                    onChange={(e) => setPlanGoals(e.target.value)}
                    placeholder="e.g. Patient stabilization, cognitive recovery targets..."
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500">Plan Content *</label>
                  <textarea
                    rows={4}
                    value={planContent}
                    onChange={(e) => setPlanContent(e.target.value)}
                    placeholder="Enter scheduled sessions, cognitive therapy tasks, medication coordination plans..."
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500">Review Date</label>
                  <input
                    type="date"
                    value={planReviewDate}
                    onChange={(e) => setPlanReviewDate(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-500 focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => postPlan.mutate()}
                  disabled={postPlan.isPending || !planGoals || !planContent}
                  className="w-full rounded-full bg-teal-600 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:bg-teal-400 transition-colors"
                >
                  {postPlan.isPending ? 'Logging...' : 'Confirm Plan'}
                </button>
              </div>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-teal-700 uppercase tracking-wider">Plan Records</h4>
              <div className="space-y-4">
                {plansRes?.data?.map((plan: any) => (
                  <div
                    key={plan.id}
                    className={`border rounded-xl p-4 text-sm space-y-2 ${
                      plan.status === 'active'
                        ? 'border-teal-600 bg-teal-50/10 shadow-sm'
                        : 'border-zinc-200 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-800">Plan ID: #{plan.id}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ring-inset ${
                            plan.status === 'active'
                              ? 'bg-teal-50 text-teal-700 ring-teal-600/20'
                              : 'bg-zinc-50 text-zinc-500 ring-zinc-500/20'
                          }`}
                        >
                          {plan.status}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400">
                        {new Date(plan.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-zinc-400 uppercase">Goals</p>
                      <p className="text-zinc-700 mt-0.5">{plan.goals}</p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-zinc-400 uppercase">Treatment Details</p>
                      <p className="text-zinc-700 mt-0.5 leading-relaxed">{plan.plan}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between pt-2 border-t border-zinc-50 text-xs text-zinc-400 gap-1">
                      <span>Review Date: {plan.review_date ? new Date(plan.review_date).toLocaleDateString() : 'N/A'}</span>
                      <span>Recorded by: <strong>{plan.practitioner?.name ?? 'Practitioner'}</strong></span>
                    </div>
                  </div>
                ))}
                {(!plansRes?.data || plansRes.data.length === 0) && (
                  <p className="text-xs text-zinc-400 text-center py-6">No treatment plans recorded.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MEDICATIONS & eMAR TAB */}
        {activeTab === 'medications' && (
          <div className="lg:col-span-3 space-y-6">
            {/* Active Prescriptions card */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-teal-700 uppercase tracking-wider border-b border-zinc-100 pb-2">
                Active Prescriptions & Medication Items
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patientPrescriptionsRes?.map((presc: any) => (
                  <div key={presc.id} className="border border-zinc-150 rounded-xl p-4 text-sm bg-zinc-50/50 space-y-2">
                    <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
                      <span className="font-bold text-zinc-800">Prescription #PR-{presc.id}</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                        presc.status === 'active'
                          ? 'bg-teal-50 text-teal-700 ring-teal-600/10'
                          : 'bg-zinc-50 text-zinc-600 ring-zinc-500/10'
                      }`}>
                        {presc.status}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {presc.items?.map((med: any) => (
                        <li key={med.id} className="text-xs">
                          <strong className="text-teal-700">{med.medication_name}</strong> - {med.dosage} &bull; {med.frequency} &bull; {med.duration}
                          {med.instructions && <span className="block text-[10px] text-zinc-400 mt-0.5 italic">Instructions: {med.instructions}</span>}
                        </li>
                      ))}
                    </ul>
                    <p className="text-[10px] text-zinc-400 pt-2 border-t border-zinc-100/50">
                      Prescribed by: <strong>{presc.practitioner?.name}</strong> on {new Date(presc.prescribed_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}

                {(!patientPrescriptionsRes || patientPrescriptionsRes.length === 0) && (
                  <p className="text-xs text-zinc-400 italic py-4 col-span-2 text-center">No active prescriptions logged.</p>
                )}
              </div>
            </div>

            {/* Administration History card */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-teal-700 uppercase tracking-wider border-b border-zinc-100 pb-2">
                Medication Administration History (eMAR)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-600 border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Medication / Dosage</th>
                      <th className="py-2.5 px-4">Scheduled Time</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Administered By</th>
                      <th className="py-2.5 px-4">Actual Admin Time</th>
                      <th className="py-2.5 px-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-xs">
                    {patientAdminsRes?.data?.map((admin: any) => (
                      <tr key={admin.id} className="hover:bg-zinc-50/50">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-zinc-800">{admin.prescription_item?.medication_name}</span>
                          <span className="text-zinc-400 ml-1">({admin.prescription_item?.dosage})</span>
                        </td>
                        <td className="py-3 px-4 text-zinc-500">
                          {new Date(admin.scheduled_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${
                            admin.status === 'scheduled'
                              ? 'bg-amber-50 text-amber-700 ring-amber-600/10'
                              : admin.status === 'given'
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/10'
                              : admin.status === 'missed'
                              ? 'bg-rose-50 text-rose-700 ring-rose-600/10'
                              : admin.status === 'refused'
                              ? 'bg-purple-50 text-purple-700 ring-purple-600/10'
                              : 'bg-zinc-50 text-zinc-600 ring-zinc-500/10'
                          }`}>
                            {admin.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-zinc-700">
                          {admin.administering_staff?.name ?? '-'}
                        </td>
                        <td className="py-3 px-4 text-zinc-500">
                          {admin.administered_at ? new Date(admin.administered_at).toLocaleString() : '-'}
                        </td>
                        <td className="py-3 px-4 text-zinc-400 italic">
                          {admin.notes ?? '-'}
                        </td>
                      </tr>
                    ))}

                    {(!patientAdminsRes?.data || patientAdminsRes.data.length === 0) && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-zinc-400 italic">
                          No administration history recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
