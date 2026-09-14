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

  const [activeTab, setActiveTab] = useState<'operational' | 'history' | 'vitals' | 'assessments' | 'clinical-notes' | 'progress-notes' | 'prescriptions' | 'treatment-plans' | 'medications' | 'billing'>('operational');

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

  // Fetch patient invoices (Billing)
  const { data: invoicesRes } = useQuery({
    queryKey: ['patient-invoices', id],
    queryFn: async () => (await api.get(`/invoices?patient_id=${id}`)).data,
    enabled: !!id && canWrite,
  });
  const patientInvoices = invoicesRes?.data || [];

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
    enabled: !!id && isClinician && activeTab === 'medications',
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
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-brand-cream-dark/60 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif text-xl font-bold text-brand-charcoal">{patient.name}</h2>
            <span className="font-mono text-xs font-bold bg-brand-cream text-brand-primary px-2.5 py-0.5 rounded-lg border border-brand-cream-dark/50">
              {patient.patient_number}
            </span>
          </div>
          <p className="text-xs text-brand-muted mt-1.5 font-medium">
            Registered: {new Date(patient.created_at).toLocaleDateString()} &bull; Phone: {patient.phone ?? 'N/A'}
          </p>
        </div>

        <div className="flex gap-2">
          {canWrite && !hasActiveAdmission && (
            <Link
              href={`/dashboard/patients/${patient.id}/admit`}
              className="rounded-full bg-brand-accent hover:bg-brand-accent-dark px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-accent/20 transition-all duration-300 text-center cursor-pointer"
            >
              Admit Patient
            </Link>
          )}
          <button
            onClick={() => router.push('/dashboard/patients')}
            className="rounded-full border border-brand-cream-dark/60 bg-white px-5 py-2.5 text-xs font-bold text-brand-charcoal hover:bg-brand-cream/35 transition-colors cursor-pointer"
          >
            Back to Directory
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="border-b border-brand-cream-dark/60 bg-white rounded-t-xl px-4 flex gap-6 overflow-x-auto shadow-sm">
        <button
          onClick={() => setActiveTab('operational')}
          className={`py-3.5 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'operational'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-brand-muted hover:text-brand-charcoal'
          }`}
        >
          Operational Timeline
        </button>

        {isClinician && (
          <>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3.5 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-brand-muted hover:text-brand-charcoal'
              }`}
            >
              Medical History
            </button>
            <button
              onClick={() => setActiveTab('vitals')}
              className={`py-3.5 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'vitals'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-brand-muted hover:text-brand-charcoal'
              }`}
            >
              Vital Signs
            </button>
            <button
              onClick={() => setActiveTab('assessments')}
              className={`py-3.5 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'assessments'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-brand-muted hover:text-brand-charcoal'
              }`}
            >
              Assessments
            </button>
            <button
              onClick={() => setActiveTab('clinical-notes')}
              className={`py-3.5 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'clinical-notes'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-brand-muted hover:text-brand-charcoal'
              }`}
            >
              Clinical Notes
            </button>
            <button
              onClick={() => setActiveTab('progress-notes')}
              className={`py-3.5 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'progress-notes'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-brand-muted hover:text-brand-charcoal'
              }`}
            >
              Progress Notes
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`py-3.5 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'prescriptions'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-brand-muted hover:text-brand-charcoal'
              }`}
            >
              Prescriptions
            </button>
            <button
              onClick={() => setActiveTab('treatment-plans')}
              className={`py-3.5 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'treatment-plans'
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-brand-muted hover:text-brand-charcoal'
              }`}
            >
              Treatment Plans
            </button>
          </>
        )}
        <button
          onClick={() => setActiveTab('medications')}
          className={`py-3.5 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'medications'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-brand-muted hover:text-brand-charcoal'
          }`}
        >
          Medications & eMAR
        </button>
        {canWrite && (
          <button
            onClick={() => setActiveTab('billing')}
            className={`py-3.5 px-1 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'billing'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-brand-muted hover:text-brand-charcoal'
            }`}
          >
            Billing & Invoices
          </button>
        )}
      </div>

      {/* Tabs Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* OPERATIONAL / GENERAL INFO TAB */}
        {activeTab === 'operational' && (
          <>
            {/* Left Demographics column */}
            <div className="lg:col-span-1 space-y-6">
              <div className="rounded-2xl border border-brand-cream-dark/60 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">
                  Patient Demographics
                </h3>
                <div>
                  <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Physical Address</p>
                  <p className="text-sm text-brand-charcoal mt-1.5 leading-relaxed">{patient.address ?? 'None'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Gender</p>
                    <p className="text-sm text-brand-charcoal capitalize mt-1.5 font-medium">{patient.gender ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Date of Birth</p>
                    <p className="text-sm text-brand-charcoal mt-1.5 font-medium">
                      {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Status</p>
                  <span
                    className={`mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                      hasActiveAdmission
                        ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/20'
                        : 'bg-brand-cream text-brand-charcoal-light ring-brand-cream-dark/45'
                    }`}
                  >
                    {hasActiveAdmission ? 'Active Residential' : 'Inactive / Discharged'}
                  </span>
                </div>
              </div>

              {/* Guardians list */}
              <div className="rounded-2xl border border-brand-cream-dark/60 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">
                  Guardians Contact
                </h3>
                {patient.guardians?.map((guardian) => (
                  <div key={guardian.id} className="space-y-2 text-sm border-b border-brand-cream-dark/25 last:border-b-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-brand-charcoal">{guardian.name}</p>
                      {guardian.is_primary && (
                        <span className="bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-wide uppercase">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-muted font-medium">Relationship: {guardian.relationship}</p>
                    <p className="text-xs text-brand-charcoal-light font-medium">Phone: {guardian.phone}</p>
                    {guardian.email && <p className="text-xs text-brand-charcoal-light font-medium">Email: {guardian.email}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Admissions timeline column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl border border-brand-cream-dark/60 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 mb-6 uppercase tracking-wider">
                  Admissions timeline
                </h3>
                <div className="flow-root">
                  <ul className="-mb-8">
                    <li>
                      <div className="relative pb-8">
                        <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-brand-cream-dark/40" />
                        <div className="relative flex space-x-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary text-sm shadow-sm">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                          </span>
                          <div className="flex min-w-0 flex-1 justify-between gap-4 pt-1.5">
                            <div>
                              <p className="text-sm font-semibold text-brand-charcoal">Registration logged</p>
                              <p className="text-xs text-brand-muted mt-1 font-medium">Demographics and guardian information configured.</p>
                            </div>
                            <div className="whitespace-nowrap text-right text-xs text-brand-muted font-medium">
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
                            {!isLast && <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-brand-cream-dark/40" />}
                            <div className="relative flex space-x-3">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent text-sm shadow-sm">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h18v3H3V3z" />
                                </svg>
                              </span>
                              <div className="flex min-w-0 flex-1 justify-between gap-4 pt-1.5">
                                <div>
                                  <p className="text-sm font-semibold text-brand-charcoal">
                                    Residential Admission - <span className="capitalize text-brand-primary font-bold">{admission.admission_type}</span>
                                  </p>
                                  {admission.notes && (
                                    <p className="text-xs text-brand-charcoal-light mt-1.5 rounded-xl bg-brand-cream-light p-3 border border-brand-cream-dark/60 leading-relaxed">
                                      <strong className="text-brand-charcoal">Notes:</strong> {admission.notes}
                                    </p>
                                  )}
                                </div>
                                <div className="whitespace-nowrap text-right text-xs text-brand-muted font-medium">
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
              <div className="rounded-2xl border border-brand-cream-dark/60 bg-white p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-brand-cream-dark/45 pb-2.5">
                  <h3 className="text-sm font-bold text-brand-primary uppercase tracking-wider">
                    Treatment Sessions / Residential Care
                  </h3>
                </div>

                <div className="space-y-4">
                  {sessionsRes?.map((session: any) => (
                    <div key={session.id} className="border border-brand-cream-dark/50 hover:border-brand-primary/45 rounded-xl p-4.5 text-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-brand-cream/10 transition-all duration-200 bg-white shadow-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-brand-charcoal">Session {session.session_number}</span>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ring-1 ring-inset ${
                            session.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/20'
                              : session.status === 'completed'
                              ? 'bg-blue-50 text-blue-800 ring-blue-600/20'
                              : session.status === 'discharged'
                              ? 'bg-brand-cream text-brand-charcoal-light ring-brand-cream-dark/40'
                              : 'bg-brand-cream text-brand-charcoal-light ring-brand-cream-dark/40'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                        <p className="text-xs text-brand-muted font-medium mt-1">
                          Duration: {new Date(session.start_date).toLocaleDateString()} &rarr; {new Date(session.expected_end_date).toLocaleDateString()}
                        </p>
                        {session.professional && (
                          <p className="text-xs text-brand-charcoal-light font-medium mt-1">
                            Clinician: <strong>{session.professional.name}</strong>
                          </p>
                        )}
                        {session.recommendation && (
                          <p className="text-xs text-brand-accent font-semibold mt-1">
                            Recommendation: <span className="capitalize">{session.recommendation} treatment</span>
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-2.5 w-full sm:w-auto">
                        <span className="text-xs font-semibold text-brand-charcoal-light bg-brand-cream px-2.5 py-1 rounded-lg border border-brand-cream-dark/60">
                          Pay Status: <span className="capitalize">{session.payment_status}</span>
                        </span>
                        <Link
                          href={`/dashboard/sessions/${session.id}`}
                          className="w-full sm:w-auto text-center rounded-full bg-white border border-brand-cream-dark/60 hover:border-brand-primary px-4.5 py-1.5 text-xs font-bold text-brand-charcoal shadow-sm transition-all duration-200 cursor-pointer"
                        >
                          View Details &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}

                  {(!sessionsRes || sessionsRes.length === 0) && (
                    <p className="text-xs text-brand-muted text-center py-6">No treatment sessions initiated.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* MEDICAL HISTORY TAB */}
        {activeTab === 'history' && isClinician && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">Log Medical History</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">History description</label>
                  <textarea
                    rows={4}
                    value={historyContent}
                    onChange={(e) => setHistoryContent(e.target.value)}
                    placeholder="Enter patient previous conditions, family history, details of past rehabilitation entries..."
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                  />
                </div>
                <button
                  onClick={() => postHistory.mutate()}
                  disabled={postHistory.isPending || !historyContent}
                  className="w-full rounded-full bg-brand-accent hover:bg-brand-accent-dark text-white px-5 py-2.5 text-xs font-bold transition-all shadow-md shadow-brand-accent/20 cursor-pointer disabled:bg-brand-accent/50"
                >
                  {postHistory.isPending ? 'Saving...' : 'Add Medical History'}
                </button>
              </div>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">Historical History Logs</h4>
              <div className="space-y-4 divide-y divide-brand-cream-dark/30">
                {historyRes?.data?.map((item: any) => (
                  <div key={item.id} className="pt-4 first:pt-0 text-sm">
                    <p className="text-brand-charcoal leading-relaxed">{item.content}</p>
                    <p className="text-xs text-brand-muted mt-2 font-medium">
                      Recorded by: <strong>{item.recorded_by_user?.name ?? item.recorded_by?.name ?? 'Clinical Staff'}</strong> &bull; {new Date(item.recorded_at).toLocaleString()}
                    </p>
                  </div>
                ))}
                {(!historyRes?.data || historyRes.data.length === 0) && (
                  <p className="text-xs text-brand-muted text-center py-6 font-medium">No history logs recorded.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VITAL SIGNS TAB */}
        {activeTab === 'vitals' && isClinician && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">Log Vitals</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitalsTemp}
                    onChange={(e) => setVitalsTemp(e.target.value)}
                    placeholder="36.5"
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Pulse (bpm)</label>
                  <input
                    type="number"
                    value={vitalsPulse}
                    onChange={(e) => setVitalsPulse(e.target.value)}
                    placeholder="72"
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">BP (mmHg)</label>
                  <input
                    type="text"
                    value={vitalsBp}
                    onChange={(e) => setVitalsBp(e.target.value)}
                    placeholder="120/80"
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">RR (bpm)</label>
                  <input
                    type="number"
                    value={vitalsRr}
                    onChange={(e) => setVitalsRr(e.target.value)}
                    placeholder="16"
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={vitalsWeight}
                  onChange={(e) => setVitalsWeight(e.target.value)}
                  placeholder="70.5"
                  className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Observation Notes</label>
                <textarea
                  rows={2}
                  value={vitalsNotes}
                  onChange={(e) => setVitalsNotes(e.target.value)}
                  placeholder="Add optional notes..."
                  className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                />
              </div>
              <button
                onClick={() => postVitals.mutate()}
                disabled={postVitals.isPending}
                className="w-full rounded-full bg-brand-accent hover:bg-brand-accent-dark text-white px-5 py-2.5 text-xs font-bold transition-all shadow-md shadow-brand-accent/20 cursor-pointer disabled:bg-brand-accent/50"
              >
                {postVitals.isPending ? 'Logging...' : 'Log Vitals'}
              </button>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">Vitals logs</h4>
              <div className="overflow-x-auto rounded-xl border border-brand-cream-dark/50">
                <table className="min-w-full divide-y divide-brand-cream-dark/35 text-left text-sm text-brand-charcoal-light">
                  <thead className="bg-brand-cream/45 text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">Logged Date</th>
                      <th className="px-4 py-3.5">Temp</th>
                      <th className="px-4 py-3.5">Pulse</th>
                      <th className="px-4 py-3.5">BP</th>
                      <th className="px-4 py-3.5">RR</th>
                      <th className="px-4 py-3.5">Weight</th>
                      <th className="px-4 py-3.5">Notes</th>
                      <th className="px-4 py-3.5">Logged By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-cream-dark/30 bg-white">
                    {vitalsRes?.data?.map((sign: any) => (
                      <tr key={sign.id} className="hover:bg-brand-cream/10 transition-colors">
                        <td className="px-4 py-3 font-semibold text-brand-charcoal">
                          {new Date(sign.recorded_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 font-medium">{sign.temperature ? `${sign.temperature}°C` : '-'}</td>
                        <td className="px-4 py-3 font-medium">{sign.pulse ? `${sign.pulse} bpm` : '-'}</td>
                        <td className="px-4 py-3 font-medium">{sign.blood_pressure ?? '-'}</td>
                        <td className="px-4 py-3 font-medium">{sign.respiratory_rate ? `${sign.respiratory_rate}/m` : '-'}</td>
                        <td className="px-4 py-3 font-medium">{sign.weight ? `${sign.weight} kg` : '-'}</td>
                        <td className="px-4 py-3 text-xs italic font-medium text-brand-charcoal-light">{sign.notes ?? '-'}</td>
                        <td className="px-4 py-3 text-xs font-medium">
                          {sign.recorded_by_user?.name ?? sign.recorded_by?.name ?? 'Staff'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!vitalsRes?.data || vitalsRes.data.length === 0) && (
                  <p className="text-xs text-brand-muted text-center py-6 font-medium bg-white">No vitals registered yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ASSESSMENTS TAB */}
        {activeTab === 'assessments' && isClinician && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">Add Assessment</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Assessment Type</label>
                  <select
                    value={assessmentType}
                    onChange={(e) => setAssessmentType(e.target.value)}
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal-light bg-white focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="Psychological">Psychological</option>
                    <option value="Physical Therapy">Physical Therapy</option>
                    <option value="Medical Examination">Medical Examination</option>
                    <option value="Intake Screening">Intake Screening</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Findings</label>
                  <textarea
                    rows={4}
                    value={assessmentFindings}
                    onChange={(e) => setAssessmentFindings(e.target.value)}
                    placeholder="Enter observation findings, client state details..."
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Recommendations</label>
                  <textarea
                    rows={2}
                    value={assessmentRecs}
                    onChange={(e) => setAssessmentRecs(e.target.value)}
                    placeholder="Clinician instructions or next action steps..."
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                  />
                </div>
                <button
                  onClick={() => postAssessment.mutate()}
                  disabled={postAssessment.isPending || !assessmentFindings || !assessmentRecs}
                  className="w-full rounded-full bg-brand-accent hover:bg-brand-accent-dark text-white px-5 py-2.5 text-xs font-bold transition-all shadow-md shadow-brand-accent/20 cursor-pointer disabled:bg-brand-accent/50"
                >
                  {postAssessment.isPending ? 'Saving...' : 'Add Assessment'}
                </button>
              </div>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">Assessment History</h4>
              <div className="space-y-4">
                {assessmentsRes?.data?.map((assessment: any) => (
                  <div key={assessment.id} className="border border-brand-cream-dark/50 rounded-2xl p-5 text-sm space-y-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center border-b border-brand-cream-dark/30 pb-2.5">
                      <span className="font-bold text-brand-primary font-serif capitalize">{assessment.assessment_type}</span>
                      <span className="text-xs text-brand-muted font-medium">
                        {new Date(assessment.recorded_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1">Findings</p>
                      <p className="text-brand-charcoal leading-relaxed mt-0.5 bg-brand-cream-light/40 p-3 rounded-xl border border-brand-cream-dark/55">{assessment.findings}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1">Recommendations</p>
                      <p className="text-brand-charcoal mt-0.5 bg-brand-cream/15 p-3 rounded-xl border border-brand-cream-dark/50 italic font-medium">{assessment.recommendation}</p>
                    </div>
                    <p className="text-xs text-brand-muted text-right font-medium">
                      Evaluated by: <strong>{assessment.practitioner?.name ?? 'Clinical Practitioner'}</strong>
                    </p>
                  </div>
                ))}
                {(!assessmentsRes?.data || assessmentsRes.data.length === 0) && (
                  <p className="text-xs text-brand-muted text-center py-6 font-medium">No assessments logged.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CLINICAL NOTES TAB */}
        {activeTab === 'clinical-notes' && isClinician && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">Create Clinical Note</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Note Type</label>
                  <select
                    value={clinicalNoteType}
                    onChange={(e) => setClinicalNoteType(e.target.value)}
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal-light bg-white focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="Observation">Observation</option>
                    <option value="Clinical Review">Clinical Review</option>
                    <option value="Intake Note">Intake Note</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Content</label>
                  <textarea
                    rows={5}
                    value={clinicalNoteContent}
                    onChange={(e) => setClinicalNoteContent(e.target.value)}
                    placeholder="Enter clinical notes, behavioral details..."
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                  />
                </div>
                <button
                  onClick={() => postClinicalNote.mutate()}
                  disabled={postClinicalNote.isPending || !clinicalNoteContent}
                  className="w-full rounded-full bg-brand-accent hover:bg-brand-accent-dark text-white px-5 py-2.5 text-xs font-bold transition-all shadow-md shadow-brand-accent/20 cursor-pointer disabled:bg-brand-accent/50"
                >
                  {postClinicalNote.isPending ? 'Saving...' : 'Add Note'}
                </button>
              </div>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">Note History</h4>
              <div className="space-y-4 divide-y divide-brand-cream-dark/30">
                {clinicalNotesRes?.data?.map((note: any) => (
                  <div key={note.id} className="pt-4 first:pt-0 text-sm space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="inline-flex items-center rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-xs font-bold text-brand-primary tracking-wide uppercase">
                        {note.note_type}
                      </span>
                      <span className="text-xs text-brand-muted font-medium">{new Date(note.recorded_at).toLocaleString()}</span>
                    </div>
                    <p className="text-brand-charcoal mt-2.5 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                    <p className="text-xs text-brand-muted text-right font-medium">
                      Author: <strong>{note.practitioner?.name ?? 'Clinical Practitioner'}</strong>
                    </p>
                  </div>
                ))}
                {(!clinicalNotesRes?.data || clinicalNotesRes.data.length === 0) && (
                  <p className="text-xs text-brand-muted text-center py-6 font-medium">No clinical notes recorded.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PROGRESS NOTES TAB */}
        {activeTab === 'progress-notes' && isClinician && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">Log Progress Note</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Progress Report / Activities</label>
                  <textarea
                    rows={5}
                    value={progressNoteContent}
                    onChange={(e) => setProgressNoteContent(e.target.value)}
                    placeholder="Enter daily progress summaries, response to treatment, therapy interactions..."
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                  />
                </div>
                <button
                  onClick={() => postProgressNote.mutate()}
                  disabled={postProgressNote.isPending || !progressNoteContent}
                  className="w-full rounded-full bg-brand-accent hover:bg-brand-accent-dark text-white px-5 py-2.5 text-xs font-bold transition-all shadow-md shadow-brand-accent/20 cursor-pointer disabled:bg-brand-accent/50"
                >
                  {postProgressNote.isPending ? 'Logging...' : 'Log Progress'}
                </button>
              </div>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">Progress Logs</h4>
              <div className="space-y-4 divide-y divide-brand-cream-dark/30">
                {progressNotesRes?.data?.map((note: any) => (
                  <div key={note.id} className="pt-4 first:pt-0 text-sm space-y-2.5">
                    <p className="text-brand-charcoal leading-relaxed whitespace-pre-wrap">{note.content}</p>
                    <p className="text-xs text-brand-muted text-right font-medium">
                      Practitioner: <strong>{note.practitioner?.name ?? 'Clinical Practitioner'}</strong> &bull; {new Date(note.recorded_at).toLocaleString()}
                    </p>
                  </div>
                ))}
                {(!progressNotesRes?.data || progressNotesRes.data.length === 0) && (
                  <p className="text-xs text-brand-muted text-center py-6 font-medium">No progress logs recorded.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PRESCRIPTIONS TAB */}
        {activeTab === 'prescriptions' && isClinician && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">Write Prescription</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Instructions / Notes (Optional)</label>
                  <input
                    type="text"
                    value={prescriptionNotes}
                    onChange={(e) => setPrescriptionNotes(e.target.value)}
                    placeholder="General prescription notes..."
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                  />
                </div>

                {/* Medication items builder */}
                <div className="space-y-4 border-t border-brand-cream-dark/40 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">Medications List</span>
                    <button
                      type="button"
                      onClick={addPrescriptionItem}
                      className="text-xs font-bold text-brand-accent hover:underline cursor-pointer"
                    >
                      + Add Item
                    </button>
                  </div>

                  {prescriptionItems.map((item, idx) => (
                    <div key={idx} className="bg-brand-cream-light p-3.5 rounded-xl border border-brand-cream-dark/60 relative space-y-2.5 shadow-sm">
                      {prescriptionItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePrescriptionItem(idx)}
                          className="absolute top-2.5 right-2.5 text-xs font-bold text-red-600 hover:text-red-800 cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                      <div>
                        <label className="block text-[9px] font-bold text-brand-muted uppercase tracking-wider">Medication Name</label>
                        <input
                          type="text"
                          required
                          value={item.medication_name}
                          onChange={(e) => updatePrescriptionItem(idx, 'medication_name', e.target.value)}
                          placeholder="e.g. Clonidine"
                          className="mt-1 block w-full rounded-lg border border-brand-cream-dark/80 bg-white px-3 py-1.5 text-xs focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-brand-muted uppercase tracking-wider">Dosage</label>
                          <input
                            type="text"
                            required
                            value={item.dosage}
                            onChange={(e) => updatePrescriptionItem(idx, 'dosage', e.target.value)}
                            placeholder="e.g. 0.1mg"
                            className="mt-1 block w-full rounded-lg border border-brand-cream-dark/80 bg-white px-3 py-1.5 text-xs focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-brand-muted uppercase tracking-wider">Freq</label>
                          <input
                            type="text"
                            required
                            value={item.frequency}
                            onChange={(e) => updatePrescriptionItem(idx, 'frequency', e.target.value)}
                            placeholder="e.g. 2x Daily"
                            className="mt-1 block w-full rounded-lg border border-brand-cream-dark/80 bg-white px-3 py-1.5 text-xs focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-brand-muted uppercase tracking-wider">Dur</label>
                          <input
                            type="text"
                            required
                            value={item.duration}
                            onChange={(e) => updatePrescriptionItem(idx, 'duration', e.target.value)}
                            placeholder="e.g. 7 days"
                            className="mt-1 block w-full rounded-lg border border-brand-cream-dark/80 bg-white px-3 py-1.5 text-xs focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-brand-muted uppercase tracking-wider">Instructions</label>
                        <input
                          type="text"
                          value={item.instructions}
                          onChange={(e) => updatePrescriptionItem(idx, 'instructions', e.target.value)}
                          placeholder="e.g. Take with water"
                          className="mt-1 block w-full rounded-lg border border-brand-cream-dark/80 bg-white px-3 py-1.5 text-xs focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => postPrescription.mutate()}
                  disabled={postPrescription.isPending || prescriptionItems.some(i => !i.medication_name || !i.dosage)}
                  className="w-full rounded-full bg-brand-accent hover:bg-brand-accent-dark text-white px-5 py-2.5 text-xs font-bold transition-all shadow-md shadow-brand-accent/20 cursor-pointer disabled:bg-brand-accent/50"
                >
                  {postPrescription.isPending ? 'Creating...' : 'Prescribe Medications'}
                </button>
              </div>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">Prescriptions Directory</h4>
              <div className="space-y-4">
                {prescriptionsRes?.data?.map((presc: any) => (
                  <div key={presc.id} className="border border-brand-cream-dark/50 rounded-2xl p-5 text-sm space-y-3.5 bg-white shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-center border-b border-brand-cream-dark/30 pb-2.5">
                      <span className="font-bold text-brand-charcoal font-serif">
                        Prescription Code: <span className="font-mono text-brand-primary">#PR-{presc.id}</span>
                      </span>
                      <span className="text-xs text-brand-muted font-medium">
                        {new Date(presc.prescribed_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">Medications:</span>
                      <ul className="space-y-2 divide-y divide-brand-cream-dark/30">
                        {presc.items?.map((med: any) => (
                          <div key={med.id} className="pt-2 first:pt-0">
                            <p className="font-semibold text-brand-charcoal">
                              {med.medication_name} &bull; <span className="text-xs text-brand-charcoal-light font-medium">{med.dosage} &bull; {med.frequency} ({med.duration})</span>
                            </p>
                            {med.instructions && (
                              <p className="text-xs text-brand-muted font-medium italic mt-0.5">Instructions: {med.instructions}</p>
                            )}
                          </div>
                        ))}
                      </ul>
                    </div>

                    {presc.notes && (
                      <p className="text-xs text-brand-charcoal-light mt-2 bg-brand-cream-light p-3 rounded-xl border border-brand-cream-dark/60">
                        <strong className="text-brand-charcoal">Notes:</strong> {presc.notes}
                      </p>
                    )}

                    <p className="text-xs text-brand-muted text-right font-medium border-t border-brand-cream-dark/30 pt-2.5">
                      Prescribed by: <strong>{presc.practitioner?.name ?? 'Clinical Staff'}</strong>
                    </p>
                  </div>
                ))}
                {(!prescriptionsRes?.data || prescriptionsRes.data.length === 0) && (
                  <p className="text-xs text-brand-muted text-center py-6 font-medium">No prescriptions written yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TREATMENT PLANS TAB */}
        {activeTab === 'treatment-plans' && isClinician && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">Log Treatment Plan</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Plan Goals *</label>
                  <textarea
                    rows={3}
                    value={planGoals}
                    onChange={(e) => setPlanGoals(e.target.value)}
                    placeholder="e.g. Patient stabilization, cognitive recovery targets..."
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Plan Content *</label>
                  <textarea
                    rows={4}
                    value={planContent}
                    onChange={(e) => setPlanContent(e.target.value)}
                    placeholder="Enter scheduled sessions, cognitive therapy tasks, medication coordination plans..."
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal-light uppercase tracking-wider mb-1.5">Review Date</label>
                  <input
                    type="date"
                    value={planReviewDate}
                    onChange={(e) => setPlanReviewDate(e.target.value)}
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4.5 py-2.5 text-sm text-brand-charcoal placeholder-brand-muted/70 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary focus:bg-white transition-all"
                  />
                </div>
                <button
                  onClick={() => postPlan.mutate()}
                  disabled={postPlan.isPending || !planGoals || !planContent}
                  className="w-full rounded-full bg-brand-accent hover:bg-brand-accent-dark text-white px-5 py-2.5 text-xs font-bold transition-all shadow-md shadow-brand-accent/20 cursor-pointer disabled:bg-brand-accent/50"
                >
                  {postPlan.isPending ? 'Logging...' : 'Confirm Plan'}
                </button>
              </div>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">Plan Records</h4>
              <div className="space-y-4">
                {plansRes?.data?.map((plan: any) => (
                  <div
                    key={plan.id}
                    className={`border rounded-2xl p-5 text-sm space-y-3.5 shadow-sm transition-all ${
                      plan.status === 'active'
                        ? 'border-brand-primary bg-brand-cream/10'
                        : 'border-brand-cream-dark/60 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-center border-b border-brand-cream-dark/30 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-brand-charcoal">Plan ID: #{plan.id}</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase ring-1 ring-inset ${
                            plan.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/20'
                              : 'bg-brand-cream text-brand-charcoal-light ring-brand-cream-dark/40'
                          }`}
                        >
                          {plan.status}
                        </span>
                      </div>
                      <span className="text-xs text-brand-muted font-medium">
                        {new Date(plan.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1">Goals</p>
                      <p className="text-brand-charcoal font-medium">{plan.goals}</p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-1">Treatment Details</p>
                      <p className="text-brand-charcoal mt-0.5 leading-relaxed bg-white p-3 rounded-xl border border-brand-cream-dark/50">{plan.plan}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between pt-2.5 border-t border-brand-cream-dark/30 text-xs text-brand-muted font-medium gap-1">
                      <span>Review Date: {plan.review_date ? new Date(plan.review_date).toLocaleDateString() : 'N/A'}</span>
                      <span>Recorded by: <strong>{plan.practitioner?.name ?? 'Practitioner'}</strong></span>
                    </div>
                  </div>
                ))}
                {(!plansRes?.data || plansRes.data.length === 0) && (
                  <p className="text-xs text-brand-muted text-center py-6 font-medium">No treatment plans recorded.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MEDICATIONS & eMAR TAB */}
        {activeTab === 'medications' && (
          <div className="lg:col-span-3 space-y-6">
            {/* Active Prescriptions card */}
            <div className="bg-white border border-brand-cream-dark/60 rounded-2xl shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-brand-primary uppercase tracking-wider border-b border-brand-cream-dark/45 pb-2.5">
                Active Prescriptions & Medication Items
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patientPrescriptionsRes?.data?.map((presc: any) => (
                  <div key={presc.id} className="border border-brand-cream-dark/50 rounded-2xl p-5 text-sm bg-brand-cream/10 space-y-3">
                    <div className="flex justify-between items-center border-b border-brand-cream-dark/30 pb-2">
                      <span className="font-bold text-brand-charcoal">Prescription #PR-{presc.id}</span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase ring-1 ring-inset ${
                        presc.status === 'active'
                          ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/20'
                          : 'bg-brand-cream text-brand-charcoal-light ring-brand-cream-dark/45'
                      }`}>
                        {presc.status}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {presc.items?.map((med: any) => (
                        <li key={med.id} className="text-xs">
                          <strong className="text-brand-primary">{med.medication_name}</strong> - {med.dosage} &bull; {med.frequency} &bull; {med.duration}
                          {med.instructions && <span className="block text-[10px] text-brand-muted mt-0.5 italic">Instructions: {med.instructions}</span>}
                        </li>
                      ))}
                    </ul>
                    <p className="text-[10px] text-brand-muted font-medium pt-2 border-t border-brand-cream-dark/30">
                      Prescribed by: <strong>{presc.practitioner?.name}</strong> on {new Date(presc.prescribed_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}

                {(!patientPrescriptionsRes?.data || patientPrescriptionsRes.data.length === 0) && (
                  <p className="text-xs text-brand-muted italic py-4 col-span-2 text-center font-medium">
                    {isClinician ? 'No active prescriptions logged.' : 'Active prescription details are restricted to clinical staff.'}
                  </p>
                )}
              </div>
            </div>

            {/* Administration History card */}
            <div className="bg-white border border-brand-cream-dark/60 rounded-2xl shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-brand-primary uppercase tracking-wider border-b border-brand-cream-dark/45 pb-2.5">
                Medication Administration History (eMAR)
              </h3>

              <div className="overflow-x-auto rounded-xl border border-brand-cream-dark/50">
                <table className="w-full text-left text-sm text-brand-charcoal-light border-collapse">
                  <thead>
                    <tr className="bg-brand-cream/45 border-b border-brand-cream-dark/45 text-xs font-bold text-brand-charcoal uppercase tracking-wider">
                      <th className="py-3 px-4">Medication / Dosage</th>
                      <th className="py-3 px-4">Scheduled Time</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Administered By</th>
                      <th className="py-3 px-4">Actual Admin Time</th>
                      <th className="py-3 px-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-cream-dark/30 bg-white text-xs">
                    {patientAdminsRes?.data?.map((admin: any) => (
                      <tr key={admin.id} className="hover:bg-brand-cream/10 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-brand-charcoal">{admin.prescription_item?.medication_name}</span>
                          <span className="text-brand-muted ml-1">({admin.prescription_item?.dosage})</span>
                        </td>
                        <td className="py-3.5 px-4 text-brand-charcoal-light font-medium">
                          {new Date(admin.scheduled_at).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ring-inset ${
                            admin.status === 'scheduled'
                              ? 'bg-amber-50 text-amber-800 ring-amber-600/20'
                              : admin.status === 'given'
                              ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/20'
                              : admin.status === 'missed'
                              ? 'bg-red-50 text-red-800 ring-red-600/20'
                              : admin.status === 'refused'
                              ? 'bg-purple-50 text-purple-800 ring-purple-600/20'
                              : 'bg-brand-cream text-brand-charcoal-light ring-brand-cream-dark/45'
                          }`}>
                            {admin.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-brand-charcoal">
                          {admin.administering_staff?.name ?? '-'}
                        </td>
                        <td className="py-3.5 px-4 text-brand-charcoal-light font-medium">
                          {admin.administered_at ? new Date(admin.administered_at).toLocaleString() : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-brand-muted italic font-medium">
                          {admin.notes ?? '-'}
                        </td>
                      </tr>
                    ))}

                    {(!patientAdminsRes?.data || patientAdminsRes.data.length === 0) && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-brand-muted font-medium italic bg-white">
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

        {/* BILLING & INVOICES TAB */}
        {activeTab === 'billing' && canWrite && (
          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-2xl border border-brand-cream-dark/60 bg-white p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-cream-dark/45 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-brand-primary uppercase tracking-wider">
                    Client Invoices & Settlements
                  </h3>
                  <p className="text-xs text-brand-muted mt-0.5">
                    Residential session invoices and payment histories for {patient?.name}.
                  </p>
                </div>
                <Link
                  href="/dashboard/billing"
                  className="rounded-full bg-brand-primary hover:bg-brand-primary-dark text-white px-4 py-2 text-xs font-bold shadow-sm transition text-center"
                >
                  Go to Billing Workspace ↗
                </Link>
              </div>

              {/* Invoices List */}
              <div className="overflow-x-auto rounded-xl border border-brand-cream-dark/60">
                <table className="w-full text-left text-xs text-brand-charcoal">
                  <thead className="bg-brand-cream/40 text-brand-muted text-[10px] uppercase font-bold border-b border-brand-cream-dark/60">
                    <tr>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Session</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4">Paid</th>
                      <th className="py-3 px-4">Balance</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-cream-dark/40">
                    {patientInvoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-brand-cream/20 transition">
                        <td className="py-3 px-4 font-bold text-brand-primary">{inv.invoice_number}</td>
                        <td className="py-3 px-4">
                          {inv.treatment_session ? (
                            <span className="font-semibold text-brand-charcoal text-[11px]">
                              Session #{inv.treatment_session.session_number}
                            </span>
                          ) : (
                            <span className="text-brand-muted">General</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          ₦{parseFloat(inv.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-emerald-700 font-semibold">
                          ₦{parseFloat(inv.amount_paid).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 font-bold text-amber-800">
                          ₦{parseFloat(inv.balance).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-brand-muted">
                          {new Date(inv.due_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'partially_paid'
                              ? 'bg-blue-100 text-blue-800'
                              : inv.status === 'overdue'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inv.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {(!patientInvoices || patientInvoices.length === 0) && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-brand-muted italic">
                          No invoices generated for this client yet.
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
