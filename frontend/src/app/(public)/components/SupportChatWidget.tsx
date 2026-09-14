'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  useGuardian,
  useGuardianLogin,
  useGuardianActivate,
  useGuardianLogout,
  useGuardianMessages,
  useSendGuardianMessage,
  useSupportStatus,
  useMarkGuardianMessageRead,
} from '@/lib/guardianAuth';

export default function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'activate'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Activation form state
  const [actEmail, setActEmail] = useState('');
  const [actPatientNum, setActPatientNum] = useState('');
  const [actPassword, setActPassword] = useState('');
  const [actConfirmPassword, setActConfirmPassword] = useState('');
  const [actError, setActError] = useState<string | null>(null);

  // Chat message state
  const [selectedPatientId, setSelectedPatientId] = useState<number | undefined>(undefined);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries & mutations
  const { data: guardian, isLoading: guardianLoading } = useGuardian();
  const { data: supportStatus } = useSupportStatus();
  const loginMutation = useGuardianLogin();
  const activateMutation = useGuardianActivate();
  const logoutMutation = useGuardianLogout();
  const sendMessageMutation = useSendGuardianMessage();
  const markReadMutation = useMarkGuardianMessageRead();

  // Set default selected patient
  useEffect(() => {
    if (guardian && guardian.patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(guardian.patients[0].id);
    }
  }, [guardian, selectedPatientId]);

  const { data: messageData, isLoading: messagesLoading } = useGuardianMessages(selectedPatientId);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen && messageData?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

      // Mark unread staff messages as read
      messageData.messages.forEach((msg) => {
        if (msg.sender_type === 'staff' && !msg.read_at) {
          markReadMutation.mutate(msg.id);
        }
      });
    }
  }, [isOpen, messageData?.messages]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      await loginMutation.mutateAsync({
        email: loginEmail,
        password: loginPassword,
      });
      setLoginPassword('');
    } catch (err: any) {
      setLoginError(err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Login failed. Please check your credentials.');
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActError(null);

    if (actPassword !== actConfirmPassword) {
      setActError('Passwords do not match.');
      return;
    }

    try {
      await activateMutation.mutateAsync({
        email: actEmail,
        patient_number: actPatientNum,
        password: actPassword,
        password_confirmation: actConfirmPassword,
      });
      setActPassword('');
      setActConfirmPassword('');
    } catch (err: any) {
      setActError(
        err.response?.data?.message ||
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.errors?.patient_number?.[0] ||
        'Account activation failed. Please check the patient ID and guardian email.'
      );
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedPatientId || sendMessageMutation.isPending) return;

    const text = messageInput.trim();
    setMessageInput('');
    try {
      await sendMessageMutation.mutateAsync({
        patient_id: selectedPatientId,
        message: text,
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send message.');
    }
  };

  const selectedPatient = guardian?.patients.find((p) => p.id === selectedPatientId) || guardian?.patients[0];

  return (
    <>
      {/* Floating Chat Support Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            id="open-chat-support-btn"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-medium px-4 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="relative">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {supportStatus?.is_online && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full ring-2 ring-teal-700 animate-pulse" />
              )}
            </div>
            <span className="text-sm font-semibold tracking-wide">Chat Support</span>
          </button>
        )}
      </div>

      {/* Chat Window Overlay */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[400px] h-[580px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-800 to-slate-900 text-white p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-teal-600/60 flex items-center justify-center text-teal-100 font-bold text-sm border border-teal-400/30">
                💬
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Guardian Support</h3>
                <div className="flex items-center gap-1.5 text-xs text-teal-200">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      supportStatus?.is_online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  <span>{supportStatus?.is_online ? 'Receptionist Available' : 'Support Offline'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {guardian && (
                <button
                  onClick={() => logoutMutation.mutate()}
                  title="Sign Out"
                  className="text-xs bg-slate-800/60 hover:bg-slate-800 text-teal-200 px-2 py-1 rounded transition cursor-pointer"
                >
                  Sign Out
                </button>
              )}
              <button
                id="close-chat-support-btn"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 flex items-center justify-center text-teal-200 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col">
            {guardianLoading ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mr-2" />
                Loading...
              </div>
            ) : !guardian ? (
              /* Unauthenticated View */
              <div className="p-5 flex flex-col justify-center flex-1">
                <div className="text-center mb-5">
                  <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                    🔒
                  </div>
                  <h4 className="text-base font-bold text-slate-900">Chat with Support</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Please sign in as a guardian to start or continue a conversation with our receptionist.
                  </p>
                </div>

                {/* Auth Mode Tabs */}
                <div className="flex rounded-lg bg-slate-200 p-1 mb-4 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setLoginError(null);
                    }}
                    className={`flex-1 py-1.5 rounded-md transition cursor-pointer ${
                      authMode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Guardian Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('activate');
                      setActError(null);
                    }}
                    className={`flex-1 py-1.5 rounded-md transition cursor-pointer ${
                      authMode === 'activate' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Activate Account
                  </button>
                </div>

                {authMode === 'login' ? (
                  /* Login Form */
                  <form onSubmit={handleLogin} className="space-y-3">
                    {loginError && (
                      <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                        {loginError}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Email</label>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="e.g. jane.doe@example.com"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white text-slate-900"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loginMutation.isPending}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-2.5 rounded-lg transition shadow cursor-pointer disabled:opacity-50"
                    >
                      {loginMutation.isPending ? 'Authenticating...' : 'Sign In to Chat'}
                    </button>
                    <p className="text-[11px] text-slate-500 text-center mt-2">
                      New guardian? Switch to &ldquo;Activate Account&rdquo; above.
                    </p>
                  </form>
                ) : (
                  /* Activation Form */
                  <form onSubmit={handleActivate} className="space-y-2.5">
                    {actError && (
                      <div className="p-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                        {actError}
                      </div>
                    )}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Guardian Email on File
                      </label>
                      <input
                        type="email"
                        required
                        value={actEmail}
                        onChange={(e) => setActEmail(e.target.value)}
                        placeholder="e.g. jane.doe@example.com"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Patient ID Number
                      </label>
                      <input
                        type="text"
                        required
                        value={actPatientNum}
                        onChange={(e) => setActPatientNum(e.target.value)}
                        placeholder="e.g. RC-2026-00001"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Create Password</label>
                      <input
                        type="password"
                        required
                        value={actPassword}
                        onChange={(e) => setActPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Confirm Password</label>
                      <input
                        type="password"
                        required
                        value={actConfirmPassword}
                        onChange={(e) => setActConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white text-slate-900"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={activateMutation.isPending}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold py-2 rounded-lg transition shadow cursor-pointer disabled:opacity-50 mt-1"
                    >
                      {activateMutation.isPending ? 'Activating...' : 'Activate & Sign In'}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* Authenticated Guardian Chat View */
              <>
                {/* Guardian & Patient Context Bar */}
                <div className="bg-slate-100 border-b border-slate-200 p-2.5 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="text-slate-500 font-medium">Guardian: </span>
                      <span className="font-semibold text-slate-800">{guardian.name}</span>
                    </div>
                    <span className="bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded-full text-[11px]">
                      {selectedPatient?.relationship || guardian.relationship}
                    </span>
                  </div>

                  {guardian.patients.length > 1 ? (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Who would you like to contact us about?
                      </label>
                      <select
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-teal-500 focus:outline-none"
                      >
                        {guardian.patients.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.patient_number} — {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : selectedPatient ? (
                    <div className="text-[11px] text-slate-600">
                      <span className="font-medium text-slate-500">Patient: </span>
                      <span className="font-semibold text-slate-800">
                        {selectedPatient.patient_number} — {selectedPatient.name}
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Offline Banner if Receptionist is Offline */}
                {!supportStatus?.is_online && (
                  <div className="bg-amber-50 border-b border-amber-200 p-2.5 text-xs text-amber-800 flex items-start gap-2">
                    <span className="text-amber-600 text-sm">ℹ️</span>
                    <div>
                      <p className="font-medium">
                        Support is currently offline. Leave a message and our receptionist will respond when available.
                      </p>
                      <p className="text-[10px] text-amber-600 mt-0.5">{supportStatus?.working_hours}</p>
                    </div>
                  </div>
                )}

                {/* Message Bubble Feed */}
                <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
                  {messagesLoading ? (
                    <div className="text-center py-6 text-slate-400 text-xs">Loading conversation...</div>
                  ) : messageData?.messages && messageData.messages.length > 0 ? (
                    messageData.messages.map((msg) => {
                      const isGuardian = msg.sender_type === 'guardian';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isGuardian ? 'items-end' : 'items-start'}`}
                        >
                          <div className="text-[10px] text-slate-500 mb-0.5 px-1 font-medium">
                            {isGuardian ? 'You' : `${msg.sender_name} (Receptionist)`}
                          </div>
                          <div
                            className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs shadow-sm ${
                              isGuardian
                                ? 'bg-teal-700 text-white rounded-br-xs'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                            }`}
                          >
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                            <div
                              className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${
                                isGuardian ? 'text-teal-200' : 'text-slate-400'
                              }`}
                            >
                              <span>
                                {new Date(msg.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {isGuardian && (
                                <span>{msg.read_at ? '✓✓' : '✓'}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 px-4">
                      <div className="text-3xl mb-2">💬</div>
                      <p className="text-xs font-semibold text-slate-700">No messages yet</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Send a message below to connect directly with the rehabilitation center&apos;s receptionist.
                      </p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Bar */}
                <form onSubmit={handleSendMessage} className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 text-xs border border-slate-300 rounded-full px-3.5 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none bg-slate-50 text-slate-900"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    className="w-8 h-8 rounded-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center shadow transition disabled:opacity-40 cursor-pointer"
                  >
                    {sendMessageMutation.isPending ? '...' : '➤'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
