'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUser } from '@/lib/auth';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  UserCheck,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Pill,
  Clock,
  Calendar,
  Activity,
  History,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  UserPlus
} from 'lucide-react';

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

interface DoctorAssignment {
  id: number;
  patient_id: number;
  doctor_id: number;
  assigned_by: number;
  assigned_at: string;
  unassigned_at: string | null;
  status: 'active' | 'inactive' | 'transferred';
  notes: string | null;
  doctor?: {
    id: number;
    name: string;
    email: string;
  };
  assigned_by_user?: {
    id: number;
    name: string;
  };
}

export interface EmarDoseRecord {
  id: number;
  patient_id?: number;
  prescription_item_id?: number;
  dose_slot?: 'morning' | 'afternoon' | 'evening' | 'night' | null;
  scheduled_at: string;
  status: 'scheduled' | 'given' | 'missed' | 'refused' | 'cancelled';
  administered_at: string | null;
  notes: string | null;
  prescription_item?: {
    id: number;
    medication_name: string;
    dosage: string;
    frequency: string;
    instructions: string | null;
  };
  administering_staff?: {
    id: number;
    name: string;
  } | null;
}

export interface EmarWorkspaceHistoryPagination {
  current_page: number;
  data: EmarDoseRecord[];
  last_page: number;
  per_page: number;
  total: number;
  from?: number | null;
  to?: number | null;
}

export interface PatientMedicationWorkspaceResponse {
  patient: {
    id: number;
    name: string;
    patient_number: string;
  };
  selected_date: string;
  overall_day_status?: 'completed' | 'incomplete' | 'in_progress';
  active_prescriptions: any[];
  today_schedule: any[];
  discontinued_prescriptions: any[];
  history: EmarWorkspaceHistoryPagination;
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
  active_doctor_assignment?: DoctorAssignment | null;
  doctor_assignments?: DoctorAssignment[];
}

export default function PatientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: currentUser } = useUser();
  const queryClient = useQueryClient();
  const id = params.id;

  const [activeTab, setActiveTab] = useState<
    | 'operational'
    | 'history'
    | 'vitals'
    | 'assessments'
    | 'clinical-notes'
    | 'progress-notes'
    | 'prescriptions'
    | 'treatment-plans'
    | 'medications'
    | 'billing'
  >('operational');

  // Doctor assignment state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [showAssignmentHistory, setShowAssignmentHistory] = useState(false);

  // Structured Observations state
  const [observationSeverity, setObservationSeverity] = useState('Normal');

  // Discontinue / Adverse Reaction modal state
  const [discontinueModalOpen, setDiscontinueModalOpen] = useState(false);
  const [discontinuePrescriptionId, setDiscontinuePrescriptionId] = useState<number | null>(null);
  const [discontinueReason, setDiscontinueReason] = useState('Adverse medication reaction');
  const [discontinueNotes, setDiscontinueNotes] = useState('');

  // Phase 11 eMAR workspace state
  const [emarHistoryFilter, setEmarHistoryFilter] = useState<'today' | 'yesterday' | '7_days' | 'all'>('today');
  const [emarHistoryPage, setEmarHistoryPage] = useState<number>(1);
  const [doseActionModalOpen, setDoseActionModalOpen] = useState(false);
  const [selectedAdminRecord, setSelectedAdminRecord] = useState<any | null>(null);
  const [doseActionStatus, setDoseActionStatus] = useState<'given' | 'refused' | 'missed'>('given');
  const [doseActionNotes, setDoseActionNotes] = useState('');

  // Input states for other forms
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
  const isAdmin = currentUser?.roles.includes('admin');
  const isDoctor = currentUser?.roles.includes('doctor');
  const canWrite = currentUser?.roles.includes('admin') || currentUser?.roles.includes('receptionist');

  // Fetch doctors for assignment
  const { data: doctorsRes } = useQuery({
    queryKey: ['available-doctors'],
    queryFn: async () => (await api.get('/doctors')).data,
    enabled: !!isAdmin,
  });
  const availableDoctors = doctorsRes?.data || [];

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

  // Medications & eMAR Workspace queries (Phase 11 Dose-Level eMAR)
  const { data: emarWorkspaceRes, refetch: refetchEmarWorkspace, isLoading: emarLoading } = useQuery<PatientMedicationWorkspaceResponse>({
    queryKey: ['patient-medication-workspace', id, emarHistoryFilter, emarHistoryPage],
    queryFn: async () => (await api.get(`/patients/${id}/medication-workspace?filter=${emarHistoryFilter}&page=${emarHistoryPage}`)).data,
    enabled: !!id && activeTab === 'medications',
  });

  const updateDoseMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      return (await api.patch(`/medication-administrations/${id}`, { status, notes })).data;
    },
    onSuccess: () => {
      setDoseActionModalOpen(false);
      setSelectedAdminRecord(null);
      setDoseActionNotes('');
      refetchEmarWorkspace();
      queryClient.invalidateQueries({ queryKey: ['medications-schedule'] });
    },
  });

  // =========================================================================
  // MUTATIONS
  // =========================================================================
  const assignDoctorMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/patients/${id}/doctor-assignments`, {
        doctor_id: Number(selectedDoctorId),
        notes: assignmentNotes || null,
      });
    },
    onSuccess: () => {
      setIsAssignModalOpen(false);
      setSelectedDoctorId('');
      setAssignmentNotes('');
      queryClient.invalidateQueries({ queryKey: ['patient-profile', id] });
    },
  });

  const discontinuePrescriptionMutation = useMutation({
    mutationFn: async () => {
      return api.patch(`/patients/${id}/prescriptions/${discontinuePrescriptionId}/discontinue`, {
        reason: discontinueReason,
        notes: discontinueNotes || null,
      });
    },
    onSuccess: () => {
      setDiscontinueModalOpen(false);
      setDiscontinuePrescriptionId(null);
      setDiscontinueNotes('');
      refetchPrescriptions();
      queryClient.invalidateQueries({ queryKey: ['patient-prescriptions', id] });
    },
  });

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
      severity: observationSeverity,
    }),
    onSuccess: () => {
      setClinicalNoteContent('');
      setObservationSeverity('Normal');
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

  // Helpers for prescription items
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
      <div className="flex justify-center items-center py-20 bg-white border border-brand-cream-dark/60 rounded-3xl shadow-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-cream-dark/40 border-t-brand-primary" />
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-800">
        Failed to load patient profile details. It may not exist, or you lack access permissions.
      </div>
    );
  }

  const hasActiveAdmission = patient.admissions?.some((adm) => adm.status === 'active');
  const activeAssignment = patient.active_doctor_assignment;
  const assignmentHistory = patient.doctor_assignments || [];

  return (
    <div className="space-y-6">
      {/* Top Header Card - Rexora Soft Style */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-brand-cream-dark/50 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-brand-charcoal tracking-tight">{patient.name}</h2>
            <span className="font-mono text-xs font-bold bg-brand-cream-light text-brand-primary px-3 py-1 rounded-full border border-brand-cream-dark/60">
              {patient.patient_number}
            </span>
          </div>
          <p className="text-xs text-brand-muted mt-1.5 font-medium flex items-center gap-2">
            <span>Enrolled: {new Date(patient.created_at).toLocaleDateString()}</span>
            <span>&bull;</span>
            <span>Phone: {patient.phone ?? 'N/A'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canWrite && !hasActiveAdmission && (
            <Link
              href={`/dashboard/patients/${patient.id}/admit`}
              className="rounded-full bg-brand-accent hover:bg-brand-accent-dark px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all text-center cursor-pointer"
            >
              Admit Patient
            </Link>
          )}
          <button
            onClick={() => router.push('/dashboard/patients')}
            className="rounded-full border border-brand-cream-dark/60 bg-white px-5 py-2.5 text-xs font-bold text-brand-charcoal hover:bg-brand-cream-light transition-colors cursor-pointer"
          >
            &larr; Patient Directory
          </button>
        </div>
      </div>

      {/* PRIMARY CLINICAL CARE TEAM BANNER CARD */}
      <div className="rounded-3xl border border-brand-cream-dark/60 bg-white p-6 shadow-sm overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-brand-cream-light flex items-center justify-center text-brand-primary shrink-0 border border-brand-cream-dark/60">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-bold text-brand-charcoal tracking-tight uppercase">
                  Primary Attending Physician
                </h3>
                {activeAssignment ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                    <CheckCircle className="h-3 w-3" /> Active Assignment
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                    <AlertTriangle className="h-3 w-3" /> No Doctor Assigned
                  </span>
                )}
              </div>

              {activeAssignment ? (
                <div className="mt-1">
                  <p className="text-base font-bold text-brand-primary font-serif">
                    {activeAssignment.doctor?.name ?? 'Dr. Assigned Physician'}
                  </p>
                  <p className="text-xs text-brand-muted font-medium mt-0.5">
                    Assigned on {new Date(activeAssignment.assigned_at).toLocaleDateString()}
                    {activeAssignment.assigned_by_user && ` by ${activeAssignment.assigned_by_user.name}`}
                    {activeAssignment.notes && ` &bull; "${activeAssignment.notes}"`}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-brand-muted mt-1 font-medium">
                  No primary physician currently assigned. Assign a physician to establish clinical responsibility for prescriptions and treatment planning.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="rounded-full bg-brand-primary hover:bg-brand-primary-dark text-white px-4 py-2 text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                {activeAssignment ? 'Reassign Doctor' : 'Assign Doctor'}
              </button>
            )}

            {assignmentHistory.length > 0 && (
              <button
                onClick={() => setShowAssignmentHistory(!showAssignmentHistory)}
                className="rounded-full border border-brand-cream-dark/60 bg-white hover:bg-brand-cream-light text-brand-charcoal px-3.5 py-2 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
              >
                <History className="h-3.5 w-3.5 text-brand-muted" />
                <span>History ({assignmentHistory.length})</span>
                {showAssignmentHistory ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Assignment History Accordion */}
        {showAssignmentHistory && assignmentHistory.length > 0 && (
          <div className="mt-5 pt-4 border-t border-brand-cream-dark/40">
            <h4 className="text-xs font-bold text-brand-charcoal uppercase tracking-wider mb-3">
              Clinical Assignment Audit Trail
            </h4>
            <div className="space-y-2.5">
              {assignmentHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-brand-cream-light/60 border border-brand-cream-dark/40 text-xs gap-2"
                >
                  <div>
                    <span className="font-bold text-brand-charcoal">{item.doctor?.name ?? 'Doctor'}</span>
                    <span className="text-brand-muted ml-2">
                      ({new Date(item.assigned_at).toLocaleDateString()} &rarr; {item.unassigned_at ? new Date(item.unassigned_at).toLocaleDateString() : 'Present'})
                    </span>
                    {item.notes && <p className="text-[11px] text-brand-muted italic mt-0.5">Notes: {item.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {item.status}
                    </span>
                    {item.assigned_by_user && (
                      <span className="text-[10px] text-brand-muted">By {item.assigned_by_user.name}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* TABS LIST - Rexora Rounded Pills */}
      <div className="bg-white rounded-2xl p-2 border border-brand-cream-dark/50 shadow-sm flex gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('operational')}
          className={`py-2 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'operational'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-brand-muted hover:text-brand-charcoal hover:bg-brand-cream-light'
          }`}
        >
          Overview & Demographics
        </button>

        {isClinician && (
          <>
            <button
              onClick={() => setActiveTab('clinical-notes')}
              className={`py-2 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'clinical-notes'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-brand-muted hover:text-brand-charcoal hover:bg-brand-cream-light'
              }`}
            >
              Observations & Notes
            </button>
            <button
              onClick={() => setActiveTab('vitals')}
              className={`py-2 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'vitals'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-brand-muted hover:text-brand-charcoal hover:bg-brand-cream-light'
              }`}
            >
              Vital Signs
            </button>
            <button
              onClick={() => setActiveTab('prescriptions')}
              className={`py-2 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'prescriptions'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-brand-muted hover:text-brand-charcoal hover:bg-brand-cream-light'
              }`}
            >
              Prescriptions
            </button>
            <button
              onClick={() => setActiveTab('assessments')}
              className={`py-2 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'assessments'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-brand-muted hover:text-brand-charcoal hover:bg-brand-cream-light'
              }`}
            >
              Assessments
            </button>
            <button
              onClick={() => setActiveTab('treatment-plans')}
              className={`py-2 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'treatment-plans'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-brand-muted hover:text-brand-charcoal hover:bg-brand-cream-light'
              }`}
            >
              Treatment Plans
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-brand-muted hover:text-brand-charcoal hover:bg-brand-cream-light'
              }`}
            >
              Medical History
            </button>
            <button
              onClick={() => setActiveTab('progress-notes')}
              className={`py-2 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'progress-notes'
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-brand-muted hover:text-brand-charcoal hover:bg-brand-cream-light'
              }`}
            >
              Progress Notes
            </button>
          </>
        )}
        <button
          onClick={() => setActiveTab('medications')}
          className={`py-2 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'medications'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-brand-muted hover:text-brand-charcoal hover:bg-brand-cream-light'
          }`}
        >
          Medications & eMAR
        </button>
        {canWrite && (
          <button
            onClick={() => setActiveTab('billing')}
            className={`py-2 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'billing'
                ? 'bg-brand-primary text-white shadow-sm'
                : 'text-brand-muted hover:text-brand-charcoal hover:bg-brand-cream-light'
            }`}
          >
            Billing & Invoices
          </button>
        )}
      </div>

      {/* TABS CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* OPERATIONAL / GENERAL INFO TAB */}
        {activeTab === 'operational' && (
          <>
            {/* Left Demographics column */}
            <div className="lg:col-span-1 space-y-6">
              <div className="rounded-3xl border border-brand-cream-dark/60 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">
                  Patient Demographics
                </h3>
                <div>
                  <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Physical Address</p>
                  <p className="text-sm text-brand-charcoal mt-1 leading-relaxed font-medium">{patient.address ?? 'None'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Gender</p>
                    <p className="text-sm text-brand-charcoal capitalize mt-1 font-semibold">{patient.gender ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Date of Birth</p>
                    <p className="text-sm text-brand-charcoal mt-1 font-semibold">
                      {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Status</p>
                  <span
                    className={`mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                      hasActiveAdmission
                        ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/20'
                        : 'bg-brand-cream text-brand-charcoal-light ring-brand-cream-dark/45'
                    }`}
                  >
                    {hasActiveAdmission ? 'Active Residential Inpatient' : 'Inactive / Discharged'}
                  </span>
                </div>
              </div>

              {/* Guardians list */}
              <div className="rounded-3xl border border-brand-cream-dark/60 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">
                  Guardians Contact
                </h3>
                {patient.guardians?.map((guardian) => (
                  <div key={guardian.id} className="space-y-1.5 text-sm border-b border-brand-cream-dark/25 last:border-b-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-brand-charcoal">{guardian.name}</p>
                      {guardian.is_primary && (
                        <span className="bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-muted font-medium">Relationship: {guardian.relationship}</p>
                    <p className="text-xs text-brand-charcoal font-medium">Phone: {guardian.phone}</p>
                    {guardian.email && <p className="text-xs text-brand-charcoal font-medium">Email: {guardian.email}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Admissions timeline & sessions column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-3xl border border-brand-cream-dark/60 bg-white p-6 shadow-sm">
                <h3 className="text-xs font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 mb-6 uppercase tracking-wider">
                  Admissions Timeline
                </h3>
                <div className="flow-root">
                  <ul className="-mb-8">
                    <li>
                      <div className="relative pb-8">
                        <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-brand-cream-dark/40" />
                        <div className="relative flex space-x-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary text-sm shadow-sm">
                            <Activity className="h-4 w-4" />
                          </span>
                          <div className="flex min-w-0 flex-1 justify-between gap-4 pt-1.5">
                            <div>
                              <p className="text-sm font-semibold text-brand-charcoal">Registration Logged</p>
                              <p className="text-xs text-brand-muted mt-1 font-medium">Patient profile initialized in the system.</p>
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
                                <Activity className="h-4 w-4" />
                              </span>
                              <div className="flex min-w-0 flex-1 justify-between gap-4 pt-1.5">
                                <div>
                                  <p className="text-sm font-semibold text-brand-charcoal">
                                    Residential Admission - <span className="capitalize text-brand-primary font-bold">{admission.admission_type}</span>
                                  </p>
                                  {admission.notes && (
                                    <p className="text-xs text-brand-charcoal mt-1.5 rounded-xl bg-brand-cream-light p-3 border border-brand-cream-dark/60 leading-relaxed">
                                      <strong>Notes:</strong> {admission.notes}
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

              {/* Sessions */}
              <div className="rounded-3xl border border-brand-cream-dark/60 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider border-b border-brand-cream-dark/45 pb-2.5">
                  Treatment Sessions / Residential Care
                </h3>

                <div className="space-y-3">
                  {sessionsRes?.map((session: any) => (
                    <div key={session.id} className="border border-brand-cream-dark/50 hover:border-brand-primary/40 rounded-2xl p-4.5 text-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-brand-cream-light/30">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-brand-charcoal">Session #{session.session_number}</span>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            session.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : session.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                        <p className="text-xs text-brand-muted font-medium mt-1">
                          Timeline: {new Date(session.start_date).toLocaleDateString()} &rarr; {new Date(session.expected_end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-brand-primary">
                        {session.professional?.name ? `Clinician: ${session.professional.name}` : 'Unassigned'}
                      </span>
                    </div>
                  ))}

                  {(!sessionsRes || sessionsRes.length === 0) && (
                    <p className="text-xs text-brand-muted text-center py-4 italic">No active residential treatment sessions logged.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* CLINICAL NOTES & STRUCTURED OBSERVATIONS TAB */}
        {activeTab === 'clinical-notes' && isClinician && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Create Note / Observation Card */}
            <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-brand-cream-dark/45 pb-2.5">
                <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider">
                  {isAdmin ? 'Log Administrative Observation' : 'Log Clinical Note / Observation'}
                </h4>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                    <ShieldCheck className="h-3 w-3" /> Admin Auth
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                    <Stethoscope className="h-3 w-3" /> Doctor Auth
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-brand-charcoal-light uppercase tracking-wider mb-1">
                    Observation / Note Category
                  </label>
                  <select
                    value={clinicalNoteType}
                    onChange={(e) => setClinicalNoteType(e.target.value)}
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-2.5 text-xs text-brand-charcoal focus:border-brand-primary focus:outline-none focus:bg-white transition-all cursor-pointer font-medium"
                  >
                    <option value="Observation">General Observation</option>
                    <option value="Behaviour">Behaviour & Demeanor</option>
                    <option value="Appetite">Appetite & Nutrition</option>
                    <option value="Sleep">Sleep Patterns</option>
                    <option value="Weight">Weight / Physical Condition</option>
                    <option value="Medication reaction">Medication Reaction</option>
                    <option value="Mood">Mood & Emotional Stability</option>
                    <option value="Participation">Participation & Group Therapy</option>
                    <option value="General wellbeing">General Wellbeing</option>
                    <option value="Clinical Review">Clinical Review</option>
                    <option value="Intake Note">Intake Note</option>
                    <option value="Other">Other Observation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-brand-charcoal-light uppercase tracking-wider mb-1">
                    Clinical Concern / Severity
                  </label>
                  <select
                    value={observationSeverity}
                    onChange={(e) => setObservationSeverity(e.target.value)}
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-2.5 text-xs text-brand-charcoal focus:border-brand-primary focus:outline-none focus:bg-white transition-all cursor-pointer font-medium"
                  >
                    <option value="Normal">Normal / Routine</option>
                    <option value="Mild concern">Mild concern</option>
                    <option value="Moderate concern">Moderate concern</option>
                    <option value="Significant concern">Significant concern / Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-brand-charcoal-light uppercase tracking-wider mb-1">
                    Observation Details
                  </label>
                  <textarea
                    rows={5}
                    value={clinicalNoteContent}
                    onChange={(e) => setClinicalNoteContent(e.target.value)}
                    placeholder="Enter factual observations, behavioral remarks, or clinical concerns..."
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-2.5 text-xs text-brand-charcoal placeholder-brand-muted/70 focus:border-brand-primary focus:outline-none focus:bg-white transition-all font-medium"
                  />
                </div>

                <button
                  onClick={() => postClinicalNote.mutate()}
                  disabled={postClinicalNote.isPending || !clinicalNoteContent.trim()}
                  className="w-full rounded-full bg-brand-primary hover:bg-brand-primary-dark text-white px-5 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:bg-brand-primary/50"
                >
                  {postClinicalNote.isPending ? 'Logging Note...' : 'Record Observation'}
                </button>
              </div>
            </div>

            {/* Note History List */}
            <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">
                Clinical Records & Observation Log
              </h4>

              <div className="space-y-4">
                {clinicalNotesRes?.data?.map((note: any) => {
                  const isDoctorAuthor = note.practitioner?.roles?.some((r: any) => r.name === 'doctor') || (note.note_type !== 'Administrative Observation');
                  const isAdminAuthor = note.note_type === 'Administrative Observation';

                  return (
                    <div
                      key={note.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isAdminAuthor
                          ? 'border-amber-200/80 bg-amber-50/20'
                          : 'border-emerald-200/80 bg-emerald-50/15'
                      }`}
                    >
                      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-brand-cream-dark/30 pb-2.5">
                        <div className="flex items-center gap-2">
                          {isAdminAuthor ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                              <ShieldCheck className="h-3 w-3" /> Administrative Observation
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                              <Stethoscope className="h-3 w-3" /> Clinical Record
                            </span>
                          )}

                          <span className="text-xs font-bold text-brand-charcoal">
                            {note.note_type}
                          </span>

                          {note.severity && note.severity !== 'Normal' && (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              note.severity === 'Significant concern'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {note.severity}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-brand-muted font-medium">
                          {new Date(note.recorded_at).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-xs text-brand-charcoal mt-3 leading-relaxed whitespace-pre-wrap font-medium">
                        {note.content}
                      </p>

                      <div className="flex justify-between items-center pt-2.5 mt-3 border-t border-brand-cream-dark/25 text-[11px] text-brand-muted">
                        <span>
                          Author: <strong className="text-brand-charcoal">{note.practitioner?.name ?? 'Staff Practitioner'}</strong>
                        </span>
                        <span>Record #{note.id}</span>
                      </div>
                    </div>
                  );
                })}

                {(!clinicalNotesRes?.data || clinicalNotesRes.data.length === 0) && (
                  <p className="text-xs text-brand-muted text-center py-8 font-medium">
                    No clinical observations or notes recorded yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PRESCRIPTIONS TAB */}
        {activeTab === 'prescriptions' && isClinician && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Prescribe Medication Card */}
            <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">
                Prescribe Medication
              </h4>

              {isDoctor ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-brand-charcoal-light uppercase tracking-wider mb-1">
                      Clinical Notes / Indications (Optional)
                    </label>
                    <input
                      type="text"
                      value={prescriptionNotes}
                      onChange={(e) => setPrescriptionNotes(e.target.value)}
                      placeholder="e.g. Detoxification taper, vital stabilization"
                      className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-2.5 text-xs text-brand-charcoal placeholder-brand-muted/70 focus:border-brand-primary focus:outline-none focus:bg-white transition-all font-medium"
                    />
                  </div>

                  {/* Multi-item prescription list */}
                  <div className="space-y-3 border-t border-brand-cream-dark/40 pt-3">
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
                      <div key={idx} className="bg-brand-cream-light/60 p-3.5 rounded-2xl border border-brand-cream-dark/50 relative space-y-2.5">
                        {prescriptionItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePrescriptionItem(idx)}
                            className="absolute top-2.5 right-2.5 text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
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
                            placeholder="e.g. Clonidine, Diazepam"
                            className="mt-1 block w-full rounded-lg border border-brand-cream-dark/70 bg-white px-3 py-1.5 text-xs text-brand-charcoal focus:border-brand-primary focus:outline-none font-medium"
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
                              placeholder="0.1mg"
                              className="mt-1 block w-full rounded-lg border border-brand-cream-dark/70 bg-white px-2.5 py-1.5 text-xs text-brand-charcoal focus:border-brand-primary focus:outline-none font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-brand-muted uppercase tracking-wider">Freq</label>
                            <input
                              type="text"
                              required
                              value={item.frequency}
                              onChange={(e) => updatePrescriptionItem(idx, 'frequency', e.target.value)}
                              placeholder="2x daily"
                              className="mt-1 block w-full rounded-lg border border-brand-cream-dark/70 bg-white px-2.5 py-1.5 text-xs text-brand-charcoal focus:border-brand-primary focus:outline-none font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-brand-muted uppercase tracking-wider">Duration</label>
                            <input
                              type="text"
                              required
                              value={item.duration}
                              onChange={(e) => updatePrescriptionItem(idx, 'duration', e.target.value)}
                              placeholder="7 days"
                              className="mt-1 block w-full rounded-lg border border-brand-cream-dark/70 bg-white px-2.5 py-1.5 text-xs text-brand-charcoal focus:border-brand-primary focus:outline-none font-medium"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-brand-muted uppercase tracking-wider">Instructions</label>
                          <input
                            type="text"
                            value={item.instructions}
                            onChange={(e) => updatePrescriptionItem(idx, 'instructions', e.target.value)}
                            placeholder="Take with meals, monitor blood pressure"
                            className="mt-1 block w-full rounded-lg border border-brand-cream-dark/70 bg-white px-3 py-1.5 text-xs text-brand-charcoal focus:border-brand-primary focus:outline-none font-medium"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => postPrescription.mutate()}
                    disabled={postPrescription.isPending || prescriptionItems.some((i) => !i.medication_name || !i.dosage)}
                    className="w-full rounded-full bg-brand-primary hover:bg-brand-primary-dark text-white px-5 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:bg-brand-primary/50"
                  >
                    {postPrescription.isPending ? 'Authorizing Prescription...' : 'Authorize Prescription'}
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-brand-cream-light/60 border border-brand-cream-dark/50 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-brand-charcoal font-bold">
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                    <span>Physician Authority Required</span>
                  </div>
                  <p className="text-brand-muted leading-relaxed">
                    Prescriptions can only be authored by licensed medical doctors. As an administrator, you may view active prescriptions, audit orders, and record medication reactions or discontinuations.
                  </p>
                </div>
              )}
            </div>

            {/* Prescriptions Directory */}
            <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">
                Prescriptions Directory & Reactions
              </h4>

              <div className="space-y-4">
                {prescriptionsRes?.data?.map((presc: any) => {
                  const isDiscontinued = presc.status === 'discontinued';

                  return (
                    <div
                      key={presc.id}
                      className={`border rounded-2xl p-5 text-sm space-y-3.5 transition-all ${
                        isDiscontinued
                          ? 'border-rose-200 bg-rose-50/30'
                          : 'border-brand-cream-dark/50 bg-white shadow-sm'
                      }`}
                    >
                      <div className="flex flex-wrap justify-between items-center border-b border-brand-cream-dark/30 pb-2.5 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-brand-charcoal font-serif">
                            Prescription <span className="font-mono text-brand-primary">#PR-{presc.id}</span>
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isDiscontinued
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {presc.status}
                          </span>
                        </div>
                        <span className="text-xs text-brand-muted font-medium">
                          {new Date(presc.prescribed_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">Medications:</span>
                        <div className="space-y-2">
                          {presc.items?.map((med: any) => (
                            <div key={med.id} className="p-2.5 rounded-xl bg-brand-cream-light/40 border border-brand-cream-dark/30 text-xs">
                              <p className="font-bold text-brand-charcoal">
                                {med.medication_name} &bull; <span className="text-brand-primary font-medium">{med.dosage} ({med.frequency} &bull; {med.duration})</span>
                              </p>
                              {med.instructions && (
                                <p className="text-[11px] text-brand-muted italic mt-0.5">Instructions: {med.instructions}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {presc.notes && (
                        <p className="text-xs text-brand-charcoal-light bg-brand-cream-light/60 p-2.5 rounded-xl border border-brand-cream-dark/40 font-medium">
                          <strong>Notes:</strong> {presc.notes}
                        </p>
                      )}

                      {/* Discontinued banner */}
                      {isDiscontinued && (
                        <div className="p-3 rounded-xl bg-rose-100/60 border border-rose-200 text-xs text-rose-900 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold">
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                            <span>Discontinued on {presc.discontinued_at ? new Date(presc.discontinued_at).toLocaleDateString() : 'Record'}</span>
                          </div>
                          <p className="text-rose-800 font-medium">
                            <strong>Reason:</strong> {presc.discontinuation_reason ?? 'Adverse medication reaction'}
                          </p>
                          {presc.discontinued_notes && (
                            <p className="text-rose-700 italic">Notes: {presc.discontinued_notes}</p>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap justify-between items-center border-t border-brand-cream-dark/30 pt-2.5 text-xs text-brand-muted gap-2">
                        <span>
                          Prescribed by: <strong className="text-brand-charcoal">{presc.practitioner?.name ?? 'Attending Doctor'}</strong>
                        </span>

                        {!isDiscontinued && (
                          <button
                            onClick={() => {
                              setDiscontinuePrescriptionId(presc.id);
                              setDiscontinueModalOpen(true);
                            }}
                            className="rounded-full border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 px-3 py-1 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Discontinue / Adverse Reaction
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {(!prescriptionsRes?.data || prescriptionsRes.data.length === 0) && (
                  <p className="text-xs text-brand-muted text-center py-6 font-medium">No prescriptions written yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VITALS TAB */}
        {activeTab === 'vitals' && isClinician && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">Record Vitals</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-brand-charcoal-light uppercase tracking-wider mb-1">Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vitalsTemp}
                    onChange={(e) => setVitalsTemp(e.target.value)}
                    placeholder="36.8"
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-2 text-xs text-brand-charcoal focus:border-brand-primary focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-brand-charcoal-light uppercase tracking-wider mb-1">Pulse (bpm)</label>
                  <input
                    type="number"
                    value={vitalsPulse}
                    onChange={(e) => setVitalsPulse(e.target.value)}
                    placeholder="72"
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-2 text-xs text-brand-charcoal focus:border-brand-primary focus:outline-none focus:bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-brand-charcoal-light uppercase tracking-wider mb-1">BP (mmHg)</label>
                  <input
                    type="text"
                    value={vitalsBp}
                    onChange={(e) => setVitalsBp(e.target.value)}
                    placeholder="120/80"
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-2 text-xs text-brand-charcoal focus:border-brand-primary focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-brand-charcoal-light uppercase tracking-wider mb-1">RR (bpm)</label>
                  <input
                    type="number"
                    value={vitalsRr}
                    onChange={(e) => setVitalsRr(e.target.value)}
                    placeholder="16"
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-2 text-xs text-brand-charcoal focus:border-brand-primary focus:outline-none focus:bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-charcoal-light uppercase tracking-wider mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={vitalsWeight}
                  onChange={(e) => setVitalsWeight(e.target.value)}
                  placeholder="70.5"
                  className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-2 text-xs text-brand-charcoal focus:border-brand-primary focus:outline-none focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-brand-charcoal-light uppercase tracking-wider mb-1">Observation Notes</label>
                <textarea
                  rows={2}
                  value={vitalsNotes}
                  onChange={(e) => setVitalsNotes(e.target.value)}
                  placeholder="Add optional notes..."
                  className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-2 text-xs text-brand-charcoal focus:border-brand-primary focus:outline-none focus:bg-white"
                />
              </div>
              <button
                onClick={() => postVitals.mutate()}
                disabled={postVitals.isPending}
                className="w-full rounded-full bg-brand-primary hover:bg-brand-primary-dark text-white px-5 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:bg-brand-primary/50"
              >
                {postVitals.isPending ? 'Logging...' : 'Log Vitals'}
              </button>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">Vitals Log</h4>
              <div className="overflow-x-auto rounded-2xl border border-brand-cream-dark/50">
                <table className="min-w-full divide-y divide-brand-cream-dark/35 text-left text-xs text-brand-charcoal font-medium">
                  <thead className="bg-brand-cream/45 text-[10px] font-bold text-brand-charcoal uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Logged Date</th>
                      <th className="px-4 py-3">Temp</th>
                      <th className="px-4 py-3">Pulse</th>
                      <th className="px-4 py-3">BP</th>
                      <th className="px-4 py-3">RR</th>
                      <th className="px-4 py-3">Weight</th>
                      <th className="px-4 py-3">Staff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-cream-dark/30 bg-white">
                    {vitalsRes?.data?.map((sign: any) => (
                      <tr key={sign.id} className="hover:bg-brand-cream/10">
                        <td className="px-4 py-2.5 font-bold text-brand-charcoal">
                          {new Date(sign.recorded_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2.5">{sign.temperature ? `${sign.temperature}°C` : '-'}</td>
                        <td className="px-4 py-2.5">{sign.pulse ? `${sign.pulse} bpm` : '-'}</td>
                        <td className="px-4 py-2.5">{sign.blood_pressure ?? '-'}</td>
                        <td className="px-4 py-2.5">{sign.respiratory_rate ? `${sign.respiratory_rate}/m` : '-'}</td>
                        <td className="px-4 py-2.5">{sign.weight ? `${sign.weight} kg` : '-'}</td>
                        <td className="px-4 py-2.5 text-brand-muted">{sign.recorded_by_user?.name ?? 'Clinician'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ASSESSMENTS TAB */}
        {activeTab === 'assessments' && isClinician && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">Add Assessment</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-brand-charcoal-light uppercase tracking-wider mb-1">Assessment Type</label>
                  <select
                    value={assessmentType}
                    onChange={(e) => setAssessmentType(e.target.value)}
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-2 text-xs text-brand-charcoal bg-white font-medium"
                  >
                    <option value="Psychological">Psychological</option>
                    <option value="Physical Therapy">Physical Therapy</option>
                    <option value="Medical Examination">Medical Examination</option>
                    <option value="Intake Screening">Intake Screening</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-brand-charcoal-light uppercase tracking-wider mb-1">Findings</label>
                  <textarea
                    rows={4}
                    value={assessmentFindings}
                    onChange={(e) => setAssessmentFindings(e.target.value)}
                    placeholder="Enter observation findings..."
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-2 text-xs text-brand-charcoal font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-brand-charcoal-light uppercase tracking-wider mb-1">Recommendations</label>
                  <textarea
                    rows={2}
                    value={assessmentRecs}
                    onChange={(e) => setAssessmentRecs(e.target.value)}
                    placeholder="Clinician instructions or next action steps..."
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-2 text-xs text-brand-charcoal font-medium"
                  />
                </div>
                <button
                  onClick={() => postAssessment.mutate()}
                  disabled={postAssessment.isPending || !assessmentFindings || !assessmentRecs}
                  className="w-full rounded-full bg-brand-primary hover:bg-brand-primary-dark text-white px-5 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:bg-brand-primary/50"
                >
                  {postAssessment.isPending ? 'Saving...' : 'Add Assessment'}
                </button>
              </div>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">Assessment History</h4>
              <div className="space-y-4">
                {assessmentsRes?.data?.map((assessment: any) => (
                  <div key={assessment.id} className="border border-brand-cream-dark/50 rounded-2xl p-5 text-xs space-y-2 bg-white shadow-sm">
                    <div className="flex justify-between items-center border-b border-brand-cream-dark/30 pb-2">
                      <span className="font-bold text-brand-primary uppercase">{assessment.assessment_type}</span>
                      <span className="text-brand-muted">{new Date(assessment.recorded_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-brand-muted uppercase">Findings</p>
                      <p className="text-brand-charcoal leading-relaxed mt-0.5 bg-brand-cream-light/40 p-2.5 rounded-xl border border-brand-cream-dark/40 font-medium">{assessment.findings}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-brand-muted uppercase">Recommendations</p>
                      <p className="text-brand-charcoal mt-0.5 bg-brand-cream-light/20 p-2.5 rounded-xl border border-brand-cream-dark/40 italic font-medium">{assessment.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TREATMENT PLANS TAB */}
        {activeTab === 'treatment-plans' && isClinician && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">Log Treatment Plan</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-brand-charcoal-light uppercase tracking-wider mb-1">Plan Goals *</label>
                  <textarea
                    rows={3}
                    value={planGoals}
                    onChange={(e) => setPlanGoals(e.target.value)}
                    placeholder="e.g. Patient stabilization, recovery targets..."
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-2 text-xs text-brand-charcoal font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-brand-charcoal-light uppercase tracking-wider mb-1">Plan Content *</label>
                  <textarea
                    rows={4}
                    value={planContent}
                    onChange={(e) => setPlanContent(e.target.value)}
                    placeholder="Enter scheduled sessions, therapy tasks..."
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-2 text-xs text-brand-charcoal font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-brand-charcoal-light uppercase tracking-wider mb-1">Review Date</label>
                  <input
                    type="date"
                    value={planReviewDate}
                    onChange={(e) => setPlanReviewDate(e.target.value)}
                    className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-2 text-xs text-brand-charcoal font-medium"
                  />
                </div>
                <button
                  onClick={() => postPlan.mutate()}
                  disabled={postPlan.isPending || !planGoals || !planContent}
                  className="w-full rounded-full bg-brand-primary hover:bg-brand-primary-dark text-white px-5 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:bg-brand-primary/50"
                >
                  {postPlan.isPending ? 'Logging...' : 'Confirm Plan'}
                </button>
              </div>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">Plan Records</h4>
              <div className="space-y-4">
                {plansRes?.data?.map((plan: any) => (
                  <div key={plan.id} className="border border-brand-cream-dark/50 rounded-2xl p-5 text-xs space-y-2.5 bg-white shadow-sm">
                    <div className="flex justify-between items-center border-b border-brand-cream-dark/30 pb-2">
                      <span className="font-bold text-brand-charcoal">Plan #{plan.id}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        plan.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-600'
                      }`}>
                        {plan.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-brand-muted uppercase">Goals</p>
                      <p className="text-brand-charcoal font-semibold mt-0.5">{plan.goals}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-brand-muted uppercase">Plan Details</p>
                      <p className="text-brand-charcoal mt-0.5 leading-relaxed bg-brand-cream-light/30 p-2.5 rounded-xl border border-brand-cream-dark/40 font-medium">{plan.plan}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MEDICAL HISTORY TAB */}
        {activeTab === 'history' && isClinician && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">Log Medical History</h4>
              <textarea
                rows={5}
                value={historyContent}
                onChange={(e) => setHistoryContent(e.target.value)}
                placeholder="Enter past medical conditions, allergies, psychiatric history..."
                className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-2.5 text-xs text-brand-charcoal font-medium"
              />
              <button
                onClick={() => postHistory.mutate()}
                disabled={postHistory.isPending || !historyContent}
                className="w-full rounded-full bg-brand-primary hover:bg-brand-primary-dark text-white px-5 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:bg-brand-primary/50"
              >
                {postHistory.isPending ? 'Saving...' : 'Add Medical History'}
              </button>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">History Records</h4>
              <div className="space-y-3">
                {historyRes?.data?.map((hist: any) => (
                  <div key={hist.id} className="border border-brand-cream-dark/50 rounded-2xl p-4 text-xs space-y-2 bg-white shadow-sm">
                    <p className="text-brand-charcoal font-medium leading-relaxed">{hist.content}</p>
                    <p className="text-[10px] text-brand-muted text-right">Recorded on {new Date(hist.recorded_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PROGRESS NOTES TAB */}
        {activeTab === 'progress-notes' && isClinician && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">Log Progress Note</h4>
              <textarea
                rows={5}
                value={progressNoteContent}
                onChange={(e) => setProgressNoteContent(e.target.value)}
                placeholder="Enter daily progress summaries, response to treatment..."
                className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-2.5 text-xs text-brand-charcoal font-medium"
              />
              <button
                onClick={() => postProgressNote.mutate()}
                disabled={postProgressNote.isPending || !progressNoteContent}
                className="w-full rounded-full bg-brand-primary hover:bg-brand-primary-dark text-white px-5 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:bg-brand-primary/50"
              >
                {postProgressNote.isPending ? 'Logging...' : 'Log Progress'}
              </button>
            </div>

            <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-brand-cream-dark/60 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-brand-primary border-b border-brand-cream-dark/45 pb-2.5 uppercase tracking-wider">Progress Logs</h4>
              <div className="space-y-3">
                {progressNotesRes?.data?.map((note: any) => (
                  <div key={note.id} className="border border-brand-cream-dark/50 rounded-2xl p-4 text-xs space-y-2 bg-white shadow-sm">
                    <p className="text-brand-charcoal leading-relaxed whitespace-pre-wrap font-medium">{note.content}</p>
                    <p className="text-[10px] text-brand-muted text-right">
                      {note.practitioner?.name ?? 'Practitioner'} &bull; {new Date(note.recorded_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MEDICATIONS & eMAR TAB (Phase 11 Dose-Level eMAR) */}
        {activeTab === 'medications' && (
          <div className="lg:col-span-3 space-y-6">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-brand-cream-dark/60 rounded-2xl p-4 shadow-sm">
                <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">Active Regimens</span>
                <span className="text-2xl font-extrabold text-brand-charcoal mt-1 block">
                  {emarWorkspaceRes?.active_prescriptions?.length ?? 0}
                </span>
                <span className="text-[11px] text-brand-muted mt-0.5 block">Under clinician oversight</span>
              </div>
              <div className="bg-white border border-brand-cream-dark/60 rounded-2xl p-4 shadow-sm">
                <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">Today's Scheduled Slots</span>
                <span className="text-2xl font-extrabold text-brand-primary mt-1 block">
                  {emarWorkspaceRes?.today_schedule?.reduce((acc: number, item: any) => {
                    return acc + Object.values(item.slots || {}).filter(Boolean).length;
                  }, 0) ?? 0}
                </span>
                <span className="text-[11px] text-brand-muted mt-0.5 block">Morning, Afternoon, Evening & Night</span>
              </div>
              <div className="bg-white border border-brand-cream-dark/60 rounded-2xl p-4 shadow-sm">
                <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">Today's Overall Status</span>
                <div className="mt-1.5">
                  {(() => {
                    const status = emarWorkspaceRes?.overall_day_status;
                    const schedules = emarWorkspaceRes?.today_schedule || [];
                    if (schedules.length === 0) {
                      return <span className="text-xs font-bold text-brand-muted">No doses scheduled</span>;
                    }
                    if (status === 'incomplete' || schedules.some((s: any) => s.day_status === 'incomplete')) {
                      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Incomplete (Missed/Refused)</span>;
                    }
                    if (status === 'completed' || (schedules.length > 0 && schedules.every((s: any) => s.day_status === 'completed'))) {
                      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">✓ Day Completed</span>;
                    }
                    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">⏳ In Progress</span>;
                  })()}
                </div>
                <span className="text-[11px] text-brand-muted mt-1 block">Dose adherence calculation</span>
              </div>
            </div>

            {/* Today's Dose-Level Schedule Grid */}
            <div className="bg-white border border-brand-cream-dark/60 rounded-3xl shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-cream-dark/45 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider">
                    Today's Dose-Level Administration Schedule
                  </h3>
                  <p className="text-xs text-brand-muted mt-0.5 font-medium">
                    Individual morning, afternoon, evening, and night slots for today. Click any scheduled slot to record administration.
                  </p>
                </div>
                <span className="text-xs font-bold text-brand-charcoal bg-brand-cream/50 px-3 py-1 rounded-full border border-brand-cream-dark/50 self-start sm:self-auto">
                  {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              {emarLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-cream-dark border-t-brand-primary" />
                </div>
              ) : (emarWorkspaceRes?.today_schedule?.length ?? 0) > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-brand-cream-dark/50">
                  <table className="w-full text-left text-xs text-brand-charcoal border-collapse font-medium">
                    <thead>
                      <tr className="bg-brand-cream/45 border-b border-brand-cream-dark/45 text-[10px] font-bold text-brand-charcoal uppercase tracking-wider">
                        <th className="py-3 px-4">Medication & Regimen</th>
                        <th className="py-3 px-3 text-center">Morning<br /><span className="text-[9px] font-normal text-brand-muted">08:00</span></th>
                        <th className="py-3 px-3 text-center">Afternoon<br /><span className="text-[9px] font-normal text-brand-muted">14:00</span></th>
                        <th className="py-3 px-3 text-center">Evening<br /><span className="text-[9px] font-normal text-brand-muted">18:00</span></th>
                        <th className="py-3 px-3 text-center">Night<br /><span className="text-[9px] font-normal text-brand-muted">20:00 / 22:00</span></th>
                        <th className="py-3 px-4 text-center">Day Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-cream-dark/30 bg-white">
                      {emarWorkspaceRes?.today_schedule?.map((item: any, idx: number) => {
                        const slots = ['morning', 'afternoon', 'evening', 'night'];
                        return (
                          <tr key={item.prescription_item_id || idx} className="hover:bg-brand-cream/10 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-bold text-brand-primary block">{item.medication_name}</span>
                              <span className="text-[11px] text-brand-muted block">{item.dosage} &bull; {item.frequency}</span>
                              {item.instructions && (
                                <span className="text-[10px] text-brand-charcoal-light italic block mt-0.5">
                                  {item.instructions}
                                </span>
                              )}
                            </td>

                            {slots.map((slotKey) => {
                              const dose = item.slots?.[slotKey];
                              if (!dose) {
                                return (
                                  <td key={slotKey} className="py-3 px-3 text-center text-zinc-300 font-mono">
                                    —
                                  </td>
                                );
                              }

                              const isGiven = dose.status === 'given';
                              const isRefused = dose.status === 'refused';
                              const isMissed = dose.status === 'missed';
                              const isScheduled = dose.status === 'scheduled';

                              return (
                                <td key={slotKey} className="py-3 px-3 text-center">
                                  <button
                                    onClick={() => {
                                      setSelectedAdminRecord({ ...dose, medication_name: item.medication_name, dosage: item.dosage });
                                      setDoseActionStatus(dose.status === 'scheduled' ? 'given' : dose.status);
                                      setDoseActionNotes(dose.notes || '');
                                      setDoseActionModalOpen(true);
                                    }}
                                    title="Click to record or update dose administration"
                                    className={`inline-flex flex-col items-center justify-center px-2.5 py-1.5 rounded-xl border text-[10px] font-bold transition-all shadow-xs cursor-pointer ${
                                      isGiven
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                                        : isRefused
                                        ? 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
                                        : isMissed
                                        ? 'bg-red-100 border-red-300 text-red-900 hover:bg-red-200'
                                        : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100 ring-1 ring-amber-400/30'
                                    }`}
                                  >
                                    <span>
                                      {isGiven ? '✓ Given' : isRefused ? '✕ Refused' : isMissed ? '✕ Missed' : '⏳ Due'}
                                    </span>
                                    {dose.administering_staff && (
                                      <span className="text-[8px] font-normal opacity-80 mt-0.5">
                                        {dose.administering_staff.name?.split(' ')[0]}
                                      </span>
                                    )}
                                  </button>
                                </td>
                              );
                            })}

                            <td className="py-3 px-4 text-center">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                item.day_status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.day_status === 'incomplete'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {item.day_status === 'completed'
                                  ? 'Completed'
                                  : item.day_status === 'incomplete'
                                  ? 'Incomplete'
                                  : 'In Progress'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center bg-brand-cream-light/20 rounded-2xl border border-dashed border-brand-cream-dark/50">
                  <p className="text-xs text-brand-muted font-medium italic">
                    No medication administration events scheduled for today.
                  </p>
                </div>
              )}
            </div>

            {/* Active Prescriptions card */}
            <div className="bg-white border border-brand-cream-dark/60 rounded-3xl shadow-sm p-6 space-y-4">
              <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider border-b border-brand-cream-dark/45 pb-2.5">
                Active Prescriptions & Medication Items
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {emarWorkspaceRes?.active_prescriptions?.map((presc: any) => (
                  <div key={presc.id} className="border border-brand-cream-dark/50 rounded-2xl p-5 text-xs bg-brand-cream-light/20 space-y-3">
                    <div className="flex justify-between items-center border-b border-brand-cream-dark/30 pb-2">
                      <span className="font-bold text-brand-charcoal">Prescription #PR-{presc.id}</span>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          {presc.status}
                        </span>
                        {isClinician && (
                          <button
                            onClick={() => {
                              setDiscontinuePrescriptionId(presc.id);
                              setDiscontinueModalOpen(true);
                            }}
                            className="text-[10px] font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
                          >
                            Discontinue
                          </button>
                        )}
                      </div>
                    </div>
                    <ul className="space-y-2">
                      {presc.items?.map((med: any) => (
                        <li key={med.id} className="text-xs">
                          <strong className="text-brand-primary font-bold">{med.medication_name}</strong> - {med.dosage} &bull; {med.frequency} &bull; {med.duration}
                          {med.instructions && <span className="block text-[10px] text-brand-muted mt-0.5 italic">Instructions: {med.instructions}</span>}
                        </li>
                      ))}
                    </ul>
                    <p className="text-[10px] text-brand-muted font-medium pt-2 border-t border-brand-cream-dark/30">
                      Prescribed by: <strong>{presc.practitioner?.name}</strong> on {new Date(presc.prescribed_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}

                {(!emarWorkspaceRes?.active_prescriptions || emarWorkspaceRes.active_prescriptions.length === 0) && (
                  <p className="text-xs text-brand-muted italic py-4 col-span-2 text-center font-medium">
                    No active prescriptions logged.
                  </p>
                )}
              </div>
            </div>

            {/* Discontinued Medications card */}
            {((emarWorkspaceRes?.discontinued_prescriptions?.length ?? 0) > 0) && (
              <div className="bg-rose-50/40 border border-rose-200/70 rounded-3xl shadow-sm p-6 space-y-4">
                <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wider border-b border-rose-200/60 pb-2.5">
                  Discontinued Medications & Adverse Reaction History
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {emarWorkspaceRes?.discontinued_prescriptions?.map((dis: any) => (
                    <div key={dis.id} className="bg-white border border-rose-200 rounded-2xl p-4 text-xs space-y-2 shadow-xs">
                      <div className="flex justify-between items-center border-b border-rose-100 pb-2">
                        <span className="font-bold text-rose-900">#PR-{dis.id} Discontinued</span>
                        <span className="text-[10px] font-semibold text-rose-700">
                          {dis.discontinued_at ? new Date(dis.discontinued_at).toLocaleDateString() : '-'}
                        </span>
                      </div>
                      <div>
                        {dis.items?.map((item: any) => (
                          <div key={item.id} className="font-semibold text-brand-charcoal">
                            {item.medication_name} ({item.dosage})
                          </div>
                        ))}
                      </div>
                      <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100 space-y-1">
                        <p className="text-[10px] font-bold text-rose-800 uppercase">Reason for Discontinuation</p>
                        <p className="text-brand-charcoal font-medium">{dis.discontinue_reason || 'Adverse reaction'}</p>
                        {dis.notes && (
                          <p className="text-[10px] text-brand-muted italic mt-1">Clinical details: {dis.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Administration History card with Filters */}
            <div className="bg-white border border-brand-cream-dark/60 rounded-3xl shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-cream-dark/45 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider">
                    Medication Administration History (eMAR Logs)
                  </h3>
                  <p className="text-xs text-brand-muted mt-0.5 font-medium">
                    Verified record of every administered, refused, or missed dose.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 bg-brand-cream/40 p-1 rounded-full border border-brand-cream-dark/50">
                  {(['today', 'yesterday', '7_days', 'all'] as const).map((filterKey) => (
                    <button
                      key={filterKey}
                      onClick={() => {
                        setEmarHistoryFilter(filterKey);
                        setEmarHistoryPage(1);
                      }}
                      className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all cursor-pointer ${
                        emarHistoryFilter === filterKey
                          ? 'bg-brand-primary text-white shadow-xs'
                          : 'text-brand-charcoal hover:bg-brand-cream/60'
                      }`}
                    >
                      {filterKey === 'today'
                        ? 'Today'
                        : filterKey === 'yesterday'
                        ? 'Yesterday'
                        : filterKey === '7_days'
                        ? 'Past 7 Days'
                        : 'All History'}
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const historyItems: EmarDoseRecord[] = Array.isArray(emarWorkspaceRes?.history?.data)
                  ? emarWorkspaceRes.history.data
                  : [];
                const historyMeta: EmarWorkspaceHistoryPagination | null = emarWorkspaceRes?.history ?? null;

                return (
                  <div className="rounded-2xl border border-brand-cream-dark/50 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-brand-charcoal border-collapse font-medium">
                        <thead>
                          <tr className="bg-brand-cream/45 border-b border-brand-cream-dark/45 text-[10px] font-bold text-brand-charcoal uppercase tracking-wider">
                            <th className="py-3 px-4">Medication</th>
                            <th className="py-3 px-3">Slot</th>
                            <th className="py-3 px-4">Scheduled Time</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-4">Administered By</th>
                            <th className="py-3 px-4">Actual Time</th>
                            <th className="py-3 px-4">Notes / Reaction</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-cream-dark/30 bg-white">
                          {historyItems.map((admin: EmarDoseRecord) => (
                            <tr key={admin.id} className="hover:bg-brand-cream/10 transition-colors">
                              <td className="py-3 px-4">
                                <span className="font-bold text-brand-charcoal">{admin.prescription_item?.medication_name}</span>
                                <span className="text-brand-muted ml-1">({admin.prescription_item?.dosage})</span>
                              </td>
                              <td className="py-3 px-3">
                                <span className="capitalize font-semibold text-brand-primary text-[11px]">
                                  {admin.dose_slot || 'Standard'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-brand-muted">
                                {new Date(admin.scheduled_at).toLocaleString()}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                                  admin.status === 'given'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : admin.status === 'scheduled'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {admin.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-bold text-brand-charcoal">
                                {admin.administering_staff?.name ?? '-'}
                              </td>
                              <td className="py-3 px-4 text-brand-muted">
                                {admin.administered_at ? new Date(admin.administered_at).toLocaleString() : '-'}
                              </td>
                              <td className="py-3 px-4 text-brand-muted italic">
                                {admin.notes ?? '-'}
                              </td>
                            </tr>
                          ))}

                          {historyItems.length === 0 && (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-brand-muted font-medium italic bg-white">
                                No administration history recorded for this period.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {historyMeta && historyMeta.last_page > 1 && (
                      <div className="flex items-center justify-between px-4 py-2.5 border-t border-brand-cream-dark/40 bg-brand-cream/20">
                        <p className="text-xs text-brand-muted">
                          Showing page <span className="font-bold text-brand-charcoal">{historyMeta.current_page}</span> of{' '}
                          <span className="font-bold text-brand-charcoal">{historyMeta.last_page}</span> ({historyMeta.total} records)
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEmarHistoryPage((p) => Math.max(1, p - 1))}
                            disabled={historyMeta.current_page <= 1}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-brand-cream-dark/60 bg-white text-brand-charcoal disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-cream/40 transition-colors cursor-pointer"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setEmarHistoryPage((p) => Math.min(historyMeta.last_page, p + 1))}
                            disabled={historyMeta.current_page >= historyMeta.last_page}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-brand-cream-dark/60 bg-white text-brand-charcoal disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-cream/40 transition-colors cursor-pointer"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Dose Administration Action Modal */}
            {doseActionModalOpen && selectedAdminRecord && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                <div className="bg-white rounded-3xl border border-brand-cream-dark/60 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex justify-between items-center border-b border-brand-cream-dark/45 pb-3">
                    <h4 className="text-sm font-bold text-brand-charcoal">Record Dose Administration</h4>
                    <button
                      onClick={() => setDoseActionModalOpen(false)}
                      className="text-brand-muted hover:text-brand-charcoal text-lg font-bold cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>

                  <div className="bg-brand-cream-light/30 p-3.5 rounded-2xl border border-brand-cream-dark/40 text-xs space-y-1">
                    <p className="font-bold text-brand-primary text-sm">{selectedAdminRecord.medication_name}</p>
                    <p className="text-brand-charcoal">Dosage: <strong>{selectedAdminRecord.dosage}</strong></p>
                    <p className="text-brand-muted capitalize">Slot: <strong>{selectedAdminRecord.dose_slot}</strong> &bull; Scheduled: {new Date(selectedAdminRecord.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-brand-charcoal-light uppercase tracking-wider mb-1.5">
                        Administration Status *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { val: 'given', label: '✓ Given', color: 'border-emerald-400 bg-emerald-50 text-emerald-800' },
                          { val: 'refused', label: '✕ Refused', color: 'border-rose-400 bg-rose-50 text-rose-800' },
                          { val: 'missed', label: '✕ Missed', color: 'border-red-400 bg-red-50 text-red-900' },
                        ].map((btn) => (
                          <button
                            key={btn.val}
                            type="button"
                            onClick={() => setDoseActionStatus(btn.val as any)}
                            className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              doseActionStatus === btn.val
                                ? `${btn.color} ring-2 ring-brand-primary`
                                : 'bg-white border-brand-cream-dark/60 text-brand-charcoal hover:bg-brand-cream/30'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-brand-charcoal-light uppercase tracking-wider mb-1">
                        Clinical Observation / Reason Notes
                      </label>
                      <textarea
                        rows={3}
                        value={doseActionNotes}
                        onChange={(e) => setDoseActionNotes(e.target.value)}
                        placeholder="e.g. Patient ingested dose with breakfast; no immediate adverse signs..."
                        className="block w-full rounded-xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-3 py-2 text-xs text-brand-charcoal font-medium"
                      />
                    </div>

                    <div className="text-[10px] text-brand-muted bg-brand-cream/30 p-2.5 rounded-xl border border-brand-cream-dark/30">
                      Logged staff: <strong>{currentUser?.name}</strong> &bull; Exact administration timestamp will be recorded automatically upon saving.
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-2 border-t border-brand-cream-dark/45">
                    <button
                      onClick={() => setDoseActionModalOpen(false)}
                      className="rounded-full px-4 py-2 text-xs font-bold text-brand-muted hover:text-brand-charcoal hover:bg-brand-cream/40 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        updateDoseMutation.mutate({
                          id: selectedAdminRecord.id,
                          status: doseActionStatus,
                          notes: doseActionNotes,
                        });
                      }}
                      disabled={updateDoseMutation.isPending}
                      className="rounded-full bg-brand-primary hover:bg-brand-primary-dark text-white px-5 py-2 text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {updateDoseMutation.isPending ? 'Saving...' : 'Save Administration'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BILLING TAB */}
        {activeTab === 'billing' && canWrite && (
          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-3xl border border-brand-cream-dark/60 bg-white p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-cream-dark/45 pb-4">
                <div>
                  <h3 className="text-xs font-bold text-brand-primary uppercase tracking-wider">
                    Client Invoices & Settlements
                  </h3>
                  <p className="text-xs text-brand-muted mt-0.5">
                    Residential session invoices and payment histories for {patient?.name}.
                  </p>
                </div>
                <Link
                  href="/dashboard/billing"
                  className="rounded-full bg-brand-primary hover:bg-brand-primary-dark text-white px-4 py-2 text-xs font-bold shadow-sm transition text-center cursor-pointer"
                >
                  Go to Billing Workspace ↗
                </Link>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-brand-cream-dark/60">
                <table className="w-full text-left text-xs text-brand-charcoal font-medium">
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
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'partially_paid'
                              ? 'bg-blue-100 text-blue-800'
                              : inv.status === 'overdue'
                              ? 'bg-rose-100 text-rose-800'
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

      {/* ASSIGN / REASSIGN DOCTOR MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-brand-cream-dark/60 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-brand-cream-dark/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-brand-cream-light text-brand-primary">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-charcoal">
                    {activeAssignment ? 'Reassign Primary Physician' : 'Assign Primary Physician'}
                  </h3>
                  <p className="text-xs text-brand-muted">
                    Assign clinical responsibility for {patient.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-brand-muted hover:text-brand-charcoal p-1.5 rounded-full hover:bg-brand-cream-light cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-charcoal uppercase tracking-wider mb-1.5">
                  Select Attending Physician *
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="block w-full rounded-2xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-3 text-sm text-brand-charcoal focus:border-brand-primary focus:outline-none focus:bg-white transition-all cursor-pointer font-medium"
                >
                  <option value="">-- Choose a licensed doctor --</option>
                  {availableDoctors.map((doc: any) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-charcoal uppercase tracking-wider mb-1.5">
                  Assignment Notes / Clinical Instructions (Optional)
                </label>
                <textarea
                  rows={3}
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="e.g. Lead physician for cognitive recovery program, 3-month residential track"
                  className="block w-full rounded-2xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-3 text-sm text-brand-charcoal placeholder-brand-muted/70 focus:border-brand-primary focus:outline-none focus:bg-white transition-all font-medium"
                />
              </div>

              {activeAssignment && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <p>
                    Reassigning will close current assignment for <strong>{activeAssignment.doctor?.name}</strong> and mark them as inactive in the audit log.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-brand-cream-dark/40">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="rounded-full border border-brand-cream-dark/60 bg-white px-5 py-2.5 text-xs font-bold text-brand-charcoal hover:bg-brand-cream-light cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedDoctorId || assignDoctorMutation.isPending}
                onClick={() => assignDoctorMutation.mutate()}
                className="rounded-full bg-brand-primary hover:bg-brand-primary-dark text-white px-6 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer disabled:bg-brand-primary/50"
              >
                {assignDoctorMutation.isPending ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISCONTINUE / RECORD ADVERSE REACTION MODAL */}
      {discontinueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-brand-cream-dark/60 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-brand-cream-dark/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-700">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-charcoal">
                    Discontinue Prescription #PR-{discontinuePrescriptionId}
                  </h3>
                  <p className="text-xs text-brand-muted">
                    Record adverse reactions, allergies, or clinical changes
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDiscontinueModalOpen(false)}
                className="text-brand-muted hover:text-brand-charcoal p-1.5 rounded-full hover:bg-brand-cream-light cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-charcoal uppercase tracking-wider mb-1.5">
                  Discontinuation Reason *
                </label>
                <select
                  value={discontinueReason}
                  onChange={(e) => setDiscontinueReason(e.target.value)}
                  className="block w-full rounded-2xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-3 text-sm text-brand-charcoal focus:border-brand-primary focus:outline-none focus:bg-white transition-all cursor-pointer font-medium"
                >
                  <option value="Adverse medication reaction">Adverse medication reaction</option>
                  <option value="Allergic symptoms or rash">Allergic symptoms or rash</option>
                  <option value="Severe drowsiness or sedation">Severe drowsiness or sedation</option>
                  <option value="Elevated blood pressure / tachycardia">Elevated blood pressure / tachycardia</option>
                  <option value="Gastrointestinal distress / nausea">Gastrointestinal distress / nausea</option>
                  <option value="Prescription replaced by alternate therapy">Prescription replaced by alternate therapy</option>
                  <option value="Treatment completed successfully">Treatment completed successfully</option>
                  <option value="Patient refusal / non-compliance">Patient refusal / non-compliance</option>
                  <option value="Other clinical rationale">Other clinical rationale</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-charcoal uppercase tracking-wider mb-1.5">
                  Clinical Reaction Notes & Details
                </label>
                <textarea
                  rows={4}
                  value={discontinueNotes}
                  onChange={(e) => setDiscontinueNotes(e.target.value)}
                  placeholder="Describe patient symptoms, onset time, severity, and immediate corrective steps..."
                  className="block w-full rounded-2xl border border-brand-cream-dark/80 bg-brand-cream-light/35 px-4 py-3 text-sm text-brand-charcoal placeholder-brand-muted/70 focus:border-brand-primary focus:outline-none focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-brand-cream-dark/40">
              <button
                type="button"
                onClick={() => setDiscontinueModalOpen(false)}
                className="rounded-full border border-brand-cream-dark/60 bg-white px-5 py-2.5 text-xs font-bold text-brand-charcoal hover:bg-brand-cream-light cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={discontinuePrescriptionMutation.isPending}
                onClick={() => discontinuePrescriptionMutation.mutate()}
                className="rounded-full bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer disabled:bg-rose-400"
              >
                {discontinuePrescriptionMutation.isPending ? 'Discontinuing...' : 'Discontinue Medication'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
