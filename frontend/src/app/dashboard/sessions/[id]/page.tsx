'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUser } from '@/lib/auth';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

interface ClinicalNote {
  id: number;
  note_type: string;
  content: string;
  recorded_at: string;
  practitioner?: { name: string };
}

interface Assessment {
  id: number;
  assessment_type: string;
  findings: string;
  recommendation: string;
  recorded_at: string;
  practitioner?: { name: string };
}

interface PrescriptionItem {
  id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
}

interface Prescription {
  id: number;
  notes: string | null;
  prescribed_at: string;
  practitioner?: { name: string };
  items: PrescriptionItem[];
}

interface TreatmentPlan {
  id: number;
  goals: string;
  plan: string;
  review_date: string | null;
  status: string;
  created_at: string;
  practitioner?: { name: string };
}

interface ProgressNote {
  id: number;
  content: string;
  recorded_at: string;
  practitioner?: { name: string };
}

interface Session {
  id: number;
  patient_id: number;
  session_number: number;
  start_date: string;
  expected_end_date: string;
  actual_end_date: string | null;
  status: string;
  recommendation: string | null;
  notes: string | null;
  payment_status: string;
  reassessed_by: number | null;
  reassessed_at: string | null;
  decision_by: number | null;
  decision_at: string | null;
  patient: {
    id: number;
    name: string;
    patient_number: string;
  };
  professional?: { name: string };
  reassessed_user?: { name: string };
  decision_user?: { name: string };
  clinical_notes?: ClinicalNote[];
  assessments?: Assessment[];
  prescriptions?: Prescription[];
  treatment_plans?: TreatmentPlan[];
  progress_notes?: ProgressNote[];
}

export default function SessionWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { data: currentUser } = useUser();
  const queryClient = useQueryClient();
  const id = params.id;

  const [reassRecommendation, setReassRecommendation] = useState<'continue' | 'discharge'>('continue');
  const [reassNotes, setReassNotes] = useState('');

  // Fetch session details
  const { data: session, isLoading, isError } = useQuery<Session>({
    queryKey: ['session-workspace', id],
    queryFn: async () => (await api.get(`/sessions/${id}`)).data,
    enabled: !!id,
  });

  const isClinician = currentUser?.roles.includes('admin') || currentUser?.roles.includes('doctor');

  // Mutation for Reassessment
  const logReassessment = useMutation({
    mutationFn: async () => {
      return api.post(`/sessions/${id}/reassessment`, {
        recommendation: reassRecommendation,
        notes: reassNotes,
      });
    },
    onSuccess: () => {
      setReassNotes('');
      queryClient.invalidateQueries({ queryKey: ['session-workspace', id] });
    },
  });

  // Mutation for Continuation
  const continueTreatment = useMutation({
    mutationFn: async () => {
      return api.post(`/sessions/${id}/continue`);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['session-workspace', id] });
      // Redirect to the newly created session
      const newSessionId = res.data.session.id;
      router.push(`/dashboard/sessions/${newSessionId}`);
    },
  });

  // Mutation for Discharge
  const dischargePatient = useMutation({
    mutationFn: async () => {
      return api.post(`/sessions/${id}/discharge`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-workspace', id] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 bg-white border border-zinc-200 rounded-2xl shadow-sm">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-teal-600" />
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-800">
        Failed to load treatment session details. You may lack access permissions.
      </div>
    );
  }

  const isSessionActive = session.status === 'active';
  const isReassessed = !!session.reassessed_at;

  return (
    <div className="space-y-6">
      {/* Header Profile Dashboard */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-900">
              {session.patient.name} - Session {session.session_number}
            </h2>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
              session.status === 'active'
                ? 'bg-teal-50 text-teal-700 ring-teal-600/10'
                : 'bg-zinc-50 text-zinc-600 ring-zinc-500/10'
            }`}>
              {session.status}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Patient ID: **{session.patient.patient_number}** &bull; Session Duration: {new Date(session.start_date).toLocaleDateString()} to {new Date(session.expected_end_date).toLocaleDateString()}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/dashboard/patients/${session.patient_id}`}
            className="rounded-full bg-white border border-zinc-200 hover:bg-zinc-50 px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm transition-colors text-center"
          >
            &larr; Patient Profile
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Session Meta Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4 text-zinc-700">
            <h3 className="text-sm font-bold text-teal-700 border-b border-zinc-100 pb-2 uppercase tracking-wider">
              Session Parameters
            </h3>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase">Start Date</p>
              <p className="text-sm text-zinc-800 font-semibold mt-0.5">
                {new Date(session.start_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase">Expected End Date</p>
              <p className="text-sm text-zinc-800 font-semibold mt-0.5">
                {new Date(session.expected_end_date).toLocaleDateString()}
              </p>
            </div>
            {session.actual_end_date && (
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Actual End Date</p>
                <p className="text-sm text-zinc-800 font-semibold mt-0.5">
                  {new Date(session.actual_end_date).toLocaleDateString()}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase">Payment Status</p>
              <span className="mt-1 inline-flex items-center rounded bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-800 capitalize">
                {session.payment_status}
              </span>
            </div>
            {session.professional && (
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Assigned Professional</p>
                <p className="text-sm text-zinc-800 mt-0.5">{session.professional.name}</p>
              </div>
            )}
            {session.recommendation && (
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Clinical Recommendation</p>
                <p className="text-sm text-teal-700 font-semibold mt-0.5 capitalize">{session.recommendation} Treatment</p>
              </div>
            )}
            {session.notes && (
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase">Reassessment Findings</p>
                <p className="text-xs text-zinc-500 bg-zinc-50 p-2 border border-zinc-100 rounded leading-relaxed mt-1">
                  {session.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Clinician Workspace Decision Panel */}
        <div className="lg:col-span-2 space-y-6">
          {isSessionActive && isClinician ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-teal-700 border-b border-zinc-100 pb-2 uppercase tracking-wider">
                Clinician Decision workspace
              </h3>

              {/* 1. Log Reassessment findings */}
              {!isReassessed ? (
                <div className="space-y-4">
                  <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Step 1: Perform Professional Reassessment
                  </span>
                  
                  {logReassessment.isError && (
                    <div className="rounded-lg bg-red-50 p-3 text-xs text-red-800 border border-red-200">
                      {((logReassessment.error as any)?.response?.data?.message) || 'Failed to log reassessment.'}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600">Reassessment Recommendation *</label>
                    <select
                      value={reassRecommendation}
                      onChange={(e) => setReassRecommendation(e.target.value as any)}
                      className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm bg-white focus:border-teal-500 focus:outline-none"
                    >
                      <option value="continue">Continue Treatment (Spawns next session)</option>
                      <option value="discharge">Discharge Patient</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600">Findings & Reassessment Notes *</label>
                    <textarea
                      rows={4}
                      value={reassNotes}
                      onChange={(e) => setReassNotes(e.target.value)}
                      placeholder="Detail findings, cognitive progress evaluations, therapy compliance reports..."
                      className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => logReassessment.mutate()}
                    disabled={logReassessment.isPending || !reassNotes}
                    className="rounded-full bg-teal-600 hover:bg-teal-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
                  >
                    {logReassessment.isPending ? 'Logging Reassessment...' : 'Submit Reassessment'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Reassessment recorded information */}
                  <div className="bg-teal-50/20 p-4 border border-teal-600/10 rounded-xl text-sm text-zinc-700">
                    <p className="font-semibold text-teal-800">Professional Reassessment Completed</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Decision Recommendation: <strong className="capitalize">{session.recommendation} Treatment</strong>
                    </p>
                    <p className="mt-2 text-xs text-zinc-600 leading-relaxed italic">
                      &quot;{session.notes}&quot;
                    </p>
                  </div>

                  {/* 2. Execute clinical state transitions */}
                  <div className="space-y-4">
                    <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Step 2: Execute Reassessment Action
                    </span>

                    {session.recommendation === 'continue' ? (
                      <div className="space-y-3">
                        <p className="text-xs text-zinc-400">
                          Reassessment recommends continuing treatment. Confirming this closes the current session as completed and spawns **Session {session.session_number + 1}** starting today.
                        </p>
                        <button
                          onClick={() => continueTreatment.mutate()}
                          disabled={continueTreatment.isPending}
                          className="rounded-full bg-teal-600 hover:bg-teal-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors"
                        >
                          {continueTreatment.isPending ? 'Initiating Next Session...' : 'Confirm Continuation & Start Next Session'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-zinc-400">
                          Reassessment recommends discharging the patient. Confirming this closes the current session as discharged and updates the patient status to discharged.
                        </p>
                        <button
                          onClick={() => dischargePatient.mutate()}
                          disabled={dischargePatient.isPending}
                          className="rounded-full bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors"
                        >
                          {dischargePatient.isPending ? 'Processing Discharge...' : 'Confirm Patient Discharge'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm text-center py-12 text-sm text-zinc-400">
              No active clinical decisions pending. This session is in a finalized state (**{session.status}**).
            </div>
          )}
        </div>

        {/* Bottom Section: Related Clinical Records logged DURING this session */}
        {isClinician && (
          <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-teal-700 border-b border-zinc-100 pb-2 uppercase tracking-wider">
              Clinical Records Recorded During This Session
            </h3>

            <div className="space-y-6 divide-y divide-zinc-100">
              {/* Clinical Notes logs */}
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Clinical Notes</h4>
                <div className="space-y-3">
                  {session.clinical_notes?.map((note) => (
                    <div key={note.id} className="text-sm bg-zinc-50/50 border border-zinc-100 rounded-xl p-4">
                      <p className="text-zinc-700 leading-relaxed">{note.content}</p>
                      <p className="text-[10px] text-zinc-400 mt-2">
                        Type: <span className="font-semibold">{note.note_type}</span> &bull; Practitioner: <strong>{note.practitioner?.name}</strong> &bull; {new Date(note.recorded_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {(!session.clinical_notes || session.clinical_notes.length === 0) && (
                    <p className="text-xs text-zinc-400 italic">No notes logged during this session.</p>
                  )}
                </div>
              </div>

              {/* Progress Notes logs */}
              <div className="pt-6">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Progress Notes</h4>
                <div className="space-y-3">
                  {session.progress_notes?.map((note) => (
                    <div key={note.id} className="text-sm bg-zinc-50/50 border border-zinc-100 rounded-xl p-4">
                      <p className="text-zinc-700 leading-relaxed">{note.content}</p>
                      <p className="text-[10px] text-zinc-400 mt-2">
                        Practitioner: <strong>{note.practitioner?.name}</strong> &bull; {new Date(note.recorded_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {(!session.progress_notes || session.progress_notes.length === 0) && (
                    <p className="text-xs text-zinc-400 italic">No progress notes logged during this session.</p>
                  )}
                </div>
              </div>

              {/* Prescriptions written */}
              <div className="pt-6">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Prescriptions</h4>
                <div className="space-y-3">
                  {session.prescriptions?.map((presc) => (
                    <div key={presc.id} className="text-sm bg-zinc-50/50 border border-zinc-100 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between border-b border-zinc-100 pb-2">
                        <span className="font-bold text-teal-700">Code: #PR-{presc.id}</span>
                        <span className="text-[10px] text-zinc-400">{new Date(presc.prescribed_at).toLocaleDateString()}</span>
                      </div>
                      <ul className="space-y-2">
                        {presc.items?.map((med) => (
                          <li key={med.id} className="text-xs">
                            <strong>{med.medication_name}</strong> - {med.dosage} &bull; {med.frequency} &bull; {med.duration}
                            {med.instructions && <span className="block text-[10px] text-zinc-400 italic mt-0.5">Instructions: {med.instructions}</span>}
                          </li>
                        ))}
                      </ul>
                      <p className="text-[10px] text-zinc-400 text-right">
                        Practitioner: <strong>{presc.practitioner?.name}</strong>
                      </p>
                    </div>
                  ))}
                  {(!session.prescriptions || session.prescriptions.length === 0) && (
                    <p className="text-xs text-zinc-400 italic">No prescriptions written during this session.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
