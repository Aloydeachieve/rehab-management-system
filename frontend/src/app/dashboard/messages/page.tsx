'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useUser } from '@/lib/auth';
import Link from 'next/link';

interface ConversationItem {
  guardian_id: number;
  guardian_name: string;
  guardian_email: string | null;
  guardian_phone: string;
  relationship: string;
  is_linked?: boolean;
  patient_id: number | null;
  patient_number: string | null;
  patient_name: string;
  patient_status: string | null;
  unread_count: number;
  latest_activity_at: string;
  latest_message: {
    id: number;
    message: string;
    sender_type: 'guardian' | 'staff';
    read_at: string | null;
    created_at: string;
  } | null;
}

interface MessageHistoryItem {
  id: number;
  patient_id: number | null;
  guardian_id: number;
  sender_user_id: number | null;
  sender_type: 'guardian' | 'staff';
  sender_name: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

export default function ReceptionistMessagesPage() {
  const { data: currentUser, isLoading: userLoading } = useUser();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<{
    guardianId: number;
    patientId?: number | null;
  } | null>(null);
  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Linking modal state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedPatientToLink, setSelectedPatientToLink] = useState<{ id: number; name: string; patient_number: string } | null>(null);
  const [linkRelationship, setLinkRelationship] = useState('Parent');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);

  const canAccessMessages = currentUser?.roles?.some((r) => r === 'admin' || r === 'receptionist');

  // 1. Fetch conversations list with live polling
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery<{
    conversations: ConversationItem[];
  }>({
    queryKey: ['staff_conversations', searchTerm],
    queryFn: async () => {
      const url = searchTerm ? `/messages?search=${encodeURIComponent(searchTerm)}` : '/messages';
      const res = await api.get(url);
      return res.data;
    },
    enabled: !!canAccessMessages,
    refetchInterval: 4000, // live polling every 4 seconds
  });

  const conversations = conversationsData?.conversations || [];

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!selectedConversation && conversations.length > 0) {
      setSelectedConversation({
        guardianId: conversations[0].guardian_id,
        patientId: conversations[0].patient_id,
      });
    }
  }, [conversations, selectedConversation]);

  // 2. Fetch active conversation messages (supports linked and unlinked guardians)
  const { data: conversationDetail, isLoading: messagesLoading } = useQuery<{
    patient: { id: number; patient_number: string; name: string; status: string } | null;
    guardian: { id: number; name: string; email: string | null; phone: string; relationship: string; is_linked: boolean };
    messages: MessageHistoryItem[];
  }>({
    queryKey: ['guardian_conversation', selectedConversation?.guardianId],
    queryFn: async () => {
      if (!selectedConversation) return null;
      const res = await api.get(`/staff/guardians/${selectedConversation.guardianId}/conversation`);
      return res.data;
    },
    enabled: !!selectedConversation && !!canAccessMessages,
    refetchInterval: 3000,
  });

  // Query patients for linking modal
  const { data: patientsSearchResult, isLoading: patientsSearchLoading } = useQuery({
    queryKey: ['patients_search_linking', patientSearchTerm],
    queryFn: async () => {
      const url = patientSearchTerm ? `/patients?search=${encodeURIComponent(patientSearchTerm)}&per_page=10` : '/patients?per_page=10';
      const res = await api.get(url);
      return res.data;
    },
    enabled: isLinkModalOpen,
  });

  const searchedPatients = patientsSearchResult?.data || [];

  // 3. Mark conversation messages as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (guardianId: number) => {
      return (await api.post(`/staff/guardians/${guardianId}/mark-read`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff_conversations'] });
    },
  });

  // Auto mark as read when opening conversation with unread items
  useEffect(() => {
    if (selectedConversation && conversationDetail) {
      const hasUnread = conversationDetail.messages.some(
        (m) => m.sender_type === 'guardian' && !m.read_at
      );
      if (hasUnread && !markReadMutation.isPending) {
        markReadMutation.mutate(selectedConversation.guardianId);
      }
    }
  }, [selectedConversation, conversationDetail]);

  // Scroll to bottom of message list on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationDetail?.messages]);

  // 4. Send reply mutation
  const replyMutation = useMutation({
    mutationFn: async (data: { guardianId: number; message: string }) => {
      const res = await api.post(`/staff/guardians/${data.guardianId}/reply`, {
        message: data.message,
      });
      return res.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['guardian_conversation', vars.guardianId],
      });
      queryClient.invalidateQueries({ queryKey: ['staff_conversations'] });
    },
  });

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConversation || replyMutation.isPending) return;

    const message = replyText.trim();
    setReplyText('');
    try {
      await replyMutation.mutateAsync({
        guardianId: selectedConversation.guardianId,
        message,
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send reply.');
      setReplyText(message);
    }
  };

  // 5. Link Patient mutation
  const linkPatientMutation = useMutation({
    mutationFn: async (data: { guardianId: number; patientId: number; relationship: string }) => {
      return (await api.post(`/staff/guardians/${data.guardianId}/link-patient`, {
        patient_id: data.patientId,
        relationship: data.relationship,
      })).data;
    },
    onSuccess: (data) => {
      setIsLinkModalOpen(false);
      setSelectedPatientToLink(null);
      queryClient.invalidateQueries({ queryKey: ['staff_conversations'] });
      if (selectedConversation) {
        queryClient.invalidateQueries({ queryKey: ['guardian_conversation', selectedConversation.guardianId] });
      }
      alert(data.message || 'Patient successfully linked to guardian.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to link patient.');
    },
  });

  // 6. Unlink Patient mutation
  const unlinkPatientMutation = useMutation({
    mutationFn: async (guardianId: number) => {
      return (await api.post(`/staff/guardians/${guardianId}/unlink-patient`)).data;
    },
    onSuccess: (data) => {
      setIsActionsMenuOpen(false);
      queryClient.invalidateQueries({ queryKey: ['staff_conversations'] });
      if (selectedConversation) {
        queryClient.invalidateQueries({ queryKey: ['guardian_conversation', selectedConversation.guardianId] });
      }
      alert(data.message || 'Guardian unlinked from patient.');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to unlink guardian.');
    },
  });

  const handleConfirmLink = () => {
    if (!selectedConversation || !selectedPatientToLink) return;
    linkPatientMutation.mutate({
      guardianId: selectedConversation.guardianId,
      patientId: selectedPatientToLink.id,
      relationship: linkRelationship,
    });
  };

  const handleConfirmUnlink = () => {
    if (!selectedConversation) return;
    if (confirm('Are you sure you want to unlink this guardian from their patient? Conversation history will be preserved.')) {
      unlinkPatientMutation.mutate(selectedConversation.guardianId);
    }
  };

  const activeConversationItem = conversations.find(
    (c) => c.guardian_id === selectedConversation?.guardianId
  );

  const isCurrentLinked = conversationDetail?.guardian?.is_linked ?? activeConversationItem?.is_linked ?? false;

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
      </div>
    );
  }

  if (!canAccessMessages) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center">
        <h3 className="font-bold text-base mb-1">Access Restricted</h3>
        <p className="text-sm">
          You do not have permission to view guardian support messages. This section is restricted to
          receptionists and administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-brand-cream-dark/60 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-serif font-bold text-brand-charcoal">Guardian Support Center</h2>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
              Receptionist Inbox
            </span>
          </div>
          <p className="text-xs text-brand-muted mt-1">
            Real-time inquiries from family guardians. Link unlinked guardians to patient records, review recovery updates, and maintain prompt support.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-brand-charcoal bg-brand-cream-light/40 border border-brand-cream-dark/50 px-4 py-2 rounded-full self-start md:self-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold">Live Support Active</span>
          <span className="text-brand-muted">({conversations.length} total threads)</span>
        </div>
      </div>

      {/* Main Grid: Inbox Master-Detail Layout */}
      <div className="bg-white border border-brand-cream-dark/60 rounded-3xl shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[620px] max-h-[780px]">
        {/* Left Pane: Conversation Threads (5 Cols) */}
        <div className="md:col-span-5 border-r border-brand-cream-dark/60 flex flex-col bg-brand-cream-light/10">
          {/* Search bar */}
          <div className="p-3.5 border-b border-brand-cream-dark/60 bg-white">
            <div className="relative">
              <input
                type="text"
                placeholder="Search guardian or patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs border border-brand-cream-dark/60 rounded-full pl-9 pr-4 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none bg-brand-cream-light/30 text-brand-charcoal placeholder-brand-muted/70"
              />
              <svg
                className="w-4 h-4 text-brand-muted absolute left-3 top-2.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* List of Conversations */}
          <div className="flex-1 overflow-y-auto divide-y divide-brand-cream-dark/40">
            {conversationsLoading ? (
              <div className="p-6 text-center text-xs text-brand-muted">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary mx-auto mb-2" />
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-brand-muted">
                <div className="text-3xl mb-2">📬</div>
                <p className="font-semibold text-brand-charcoal">No conversations yet</p>
                <p className="text-[11px] text-brand-muted mt-1">
                  When guardians send support inquiries, conversations will appear here.
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedConversation?.guardianId === conv.guardian_id;
                const isLinked = conv.is_linked && conv.patient_id !== null;

                return (
                  <button
                    key={`${conv.guardian_id}-${conv.patient_id ?? 'unlinked'}`}
                    onClick={() =>
                      setSelectedConversation({
                        guardianId: conv.guardian_id,
                        patientId: conv.patient_id,
                      })
                    }
                    className={`w-full text-left p-3.5 transition flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-brand-primary/10 border-l-4 border-brand-primary'
                        : 'hover:bg-brand-cream/60'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {conv.guardian_name.charAt(0)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-xs font-bold text-brand-charcoal truncate">
                          {conv.guardian_name}
                        </h4>
                        <span className="text-[10px] text-brand-muted shrink-0">
                          {conv.latest_activity_at
                            ? new Date(conv.latest_activity_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        {isLinked ? (
                          <>
                            <span className="text-[10px] font-semibold text-brand-muted truncate">
                              Patient: {conv.patient_number} — {conv.patient_name}
                            </span>
                            <span className="inline-block text-[9px] font-bold bg-brand-cream-dark/50 text-brand-charcoal px-1.5 py-0.2 rounded-full shrink-0">
                              {conv.relationship}
                            </span>
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                            <span>⚠️</span> Patient not yet linked
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-brand-muted truncate">
                          {conv.latest_message
                            ? `${conv.latest_message.sender_type === 'staff' ? 'You: ' : ''}${
                                conv.latest_message.message
                              }`
                            : 'No messages yet'}
                        </p>
                        {conv.unread_count > 0 && (
                          <span className="shrink-0 bg-brand-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                            {conv.unread_count} unread
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Active Conversation View (7 Cols) */}
        <div className="md:col-span-7 flex flex-col bg-white">
          {!selectedConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-brand-muted">
              <div className="text-4xl mb-3">💬</div>
              <h3 className="text-sm font-bold text-brand-charcoal">Select a conversation</h3>
              <p className="text-xs max-w-sm mt-1">
                Choose a conversation from the left to view message history and respond to the guardian.
              </p>
            </div>
          ) : (
            <>
              {/* Conversation Header */}
              <div className="p-3.5 border-b border-brand-cream-dark/60 bg-brand-cream/20 flex items-center justify-between relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-sm">
                    {conversationDetail?.guardian?.name?.charAt(0) ||
                      activeConversationItem?.guardian_name?.charAt(0) ||
                      'G'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-brand-charcoal">
                        {conversationDetail?.guardian?.name || activeConversationItem?.guardian_name}
                      </h3>
                      <span className="text-[10px] font-bold bg-brand-primary/15 text-brand-primary px-2 py-0.5 rounded-full">
                        {conversationDetail?.guardian?.relationship || activeConversationItem?.relationship}
                      </span>
                    </div>
                    <div className="text-xs text-brand-muted flex items-center gap-2 mt-0.5 flex-wrap">
                      {isCurrentLinked && conversationDetail?.patient ? (
                        <span>
                          Patient:{' '}
                          <strong className="text-brand-charcoal">
                            {conversationDetail.patient.patient_number} — {conversationDetail.patient.name}
                          </strong>
                        </span>
                      ) : (
                        <span className="text-amber-800 font-semibold">
                          ⚠️ Patient not yet linked
                        </span>
                      )}
                      {conversationDetail?.guardian?.phone && (
                        <span>• Phone: {conversationDetail.guardian.phone}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Header Actions Menu (⋮) */}
                <div className="relative">
                  <div className="flex items-center gap-2">
                    {isCurrentLinked && conversationDetail?.patient && (
                      <Link
                        href={`/dashboard/patients/${conversationDetail.patient.id}`}
                        className="text-xs font-semibold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 px-3 py-1.5 rounded-full transition hidden sm:inline-block"
                      >
                        View Patient ↗
                      </Link>
                    )}

                    <button
                      onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
                      className="w-8 h-8 rounded-full border border-brand-cream-dark/60 flex items-center justify-center text-brand-charcoal hover:bg-brand-cream/50 transition cursor-pointer font-bold text-base"
                      title="More Options"
                    >
                      &#8942;
                    </button>
                  </div>

                  {/* Dropdown Menu */}
                  {isActionsMenuOpen && (
                    <div className="absolute right-0 top-10 z-40 bg-white border border-brand-cream-dark/60 rounded-2xl shadow-xl py-1.5 w-56 text-xs animate-in fade-in duration-100">
                      <button
                        onClick={() => {
                          setIsActionsMenuOpen(false);
                          setIsLinkModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-brand-cream/40 font-semibold text-brand-primary flex items-center gap-2 cursor-pointer"
                      >
                        <span>🔗</span> {isCurrentLinked ? 'Re-link / Change Patient' : 'Link to Patient Record'}
                      </button>

                      {isCurrentLinked && (
                        <>
                          <button
                            onClick={handleConfirmUnlink}
                            disabled={unlinkPatientMutation.isPending}
                            className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-700 font-semibold flex items-center gap-2 cursor-pointer border-t border-brand-cream-dark/40"
                          >
                            <span>✕</span> {unlinkPatientMutation.isPending ? 'Unlinking...' : 'Unlink from Patient'}
                          </button>
                          {conversationDetail?.patient && (
                            <Link
                              href={`/dashboard/patients/${conversationDetail.patient.id}`}
                              className="block px-4 py-2 hover:bg-brand-cream/40 text-brand-charcoal font-medium border-t border-brand-cream-dark/40"
                            >
                              Open Patient Chart ↗
                            </Link>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Notice Banner for Unlinked Guardian */}
              {!isCurrentLinked && (
                <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2.5 flex items-center justify-between text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚠️</span>
                    <span>
                      This guardian is not yet linked to a patient. Messages are isolated for patient confidentiality.
                    </span>
                  </div>
                  <button
                    onClick={() => setIsLinkModalOpen(true)}
                    className="shrink-0 font-bold underline hover:text-amber-950 cursor-pointer ml-3"
                  >
                    Link Patient Now &rarr;
                  </button>
                </div>
              )}

              {/* Message History Feed */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-brand-cream-light/30">
                {messagesLoading ? (
                  <div className="text-center py-10 text-xs text-brand-muted">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary mx-auto mb-2" />
                    Loading message history...
                  </div>
                ) : conversationDetail?.messages && conversationDetail.messages.length > 0 ? (
                  conversationDetail.messages.map((msg) => {
                    const isStaff = msg.sender_type === 'staff';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                      >
                        <div className="text-[10px] text-brand-muted mb-0.5 px-1 font-medium">
                          {isStaff ? `${msg.sender_name} (Staff)` : msg.sender_name}
                        </div>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-xs ${
                            isStaff
                              ? 'bg-brand-primary text-white rounded-br-xs'
                              : 'bg-white border border-brand-cream-dark/60 text-brand-charcoal rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                          <div
                            className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${
                              isStaff ? 'text-brand-cream-light/80' : 'text-brand-muted'
                            }`}
                          >
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isStaff && (
                              <span>{msg.read_at ? '✓✓' : '✓'}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-xs text-brand-muted">
                    <div className="text-3xl mb-2">💬</div>
                    <p className="font-semibold text-brand-charcoal">No message history</p>
                    <p className="text-[11px] text-brand-muted mt-1">
                      Type a response below to initiate conversation with the guardian.
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Box */}
              <form
                onSubmit={handleSendReply}
                className="p-3 bg-white border-t border-brand-cream-dark/60 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Type a reply to ${
                    conversationDetail?.guardian?.name || activeConversationItem?.guardian_name || 'guardian'
                  }...`}
                  className="flex-1 text-xs border border-brand-cream-dark/60 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-primary focus:outline-none bg-brand-cream-light/40 text-brand-charcoal"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || replyMutation.isPending}
                  className="inline-flex items-center gap-1.5 bg-brand-primary hover:bg-brand-primary-dark text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition disabled:opacity-40 cursor-pointer"
                >
                  <span>{replyMutation.isPending ? 'Sending...' : 'Send Reply'}</span>
                  <span>➤</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Patient Linking Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/45 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border border-brand-cream-dark/60 rounded-3xl p-6 shadow-xl space-y-4 text-brand-charcoal">
            <div className="flex justify-between items-center border-b border-brand-cream-dark/45 pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-brand-charcoal">
                  Link Guardian to Patient
                </h3>
                <p className="text-xs text-brand-muted mt-0.5">
                  Guardian: <strong>{conversationDetail?.guardian?.name || activeConversationItem?.guardian_name}</strong>
                </p>
              </div>
              <button
                onClick={() => {
                  setIsLinkModalOpen(false);
                  setSelectedPatientToLink(null);
                }}
                className="text-brand-muted hover:text-brand-charcoal text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Patient Search Input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-brand-charcoal-light uppercase tracking-wider">
                Search Patient (Name or Reg #) *
              </label>
              <input
                type="text"
                value={patientSearchTerm}
                onChange={(e) => setPatientSearchTerm(e.target.value)}
                placeholder="e.g. John Doe or RC-..."
                className="w-full text-xs border border-brand-cream-dark/80 rounded-xl px-3.5 py-2 bg-brand-cream-light/35 focus:ring-1 focus:ring-brand-primary focus:outline-none"
              />
            </div>

            {/* Patient Search Results */}
            <div className="max-h-40 overflow-y-auto border border-brand-cream-dark/60 rounded-xl divide-y divide-brand-cream-dark/40 bg-brand-cream-light/20">
              {patientsSearchLoading ? (
                <div className="p-4 text-center text-xs text-brand-muted">Searching patients...</div>
              ) : searchedPatients.length === 0 ? (
                <div className="p-4 text-center text-xs text-brand-muted">No patients found.</div>
              ) : (
                searchedPatients.map((pt: any) => {
                  const isSelected = selectedPatientToLink?.id === pt.id;
                  return (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => setSelectedPatientToLink(pt)}
                      className={`w-full text-left p-2.5 text-xs flex justify-between items-center transition cursor-pointer ${
                        isSelected ? 'bg-brand-primary/15 font-bold text-brand-primary' : 'hover:bg-brand-cream/60'
                      }`}
                    >
                      <div>
                        <span className="block font-semibold">{pt.name}</span>
                        <span className="text-[10px] text-brand-muted font-mono">{pt.patient_number}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-brand-muted">{pt.status}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Relationship Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-brand-charcoal-light uppercase tracking-wider">
                Guardian Relationship *
              </label>
              <select
                value={linkRelationship}
                onChange={(e) => setLinkRelationship(e.target.value)}
                className="w-full text-xs border border-brand-cream-dark/80 rounded-xl px-3.5 py-2 bg-white focus:ring-1 focus:ring-brand-primary focus:outline-none cursor-pointer"
              >
                <option value="Parent">Parent (Father / Mother)</option>
                <option value="Spouse">Spouse (Husband / Wife)</option>
                <option value="Sibling">Sibling (Brother / Sister)</option>
                <option value="Child">Child (Son / Daughter)</option>
                <option value="Legal Guardian">Legal Guardian</option>
                <option value="Relative">Relative</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-brand-cream-dark/45">
              <button
                type="button"
                onClick={() => {
                  setIsLinkModalOpen(false);
                  setSelectedPatientToLink(null);
                }}
                className="rounded-full px-4 py-2 text-xs font-bold text-brand-muted hover:text-brand-charcoal hover:bg-brand-cream/40 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLink}
                disabled={!selectedPatientToLink || linkPatientMutation.isPending}
                className="rounded-full bg-brand-primary hover:bg-brand-primary-dark text-white px-5 py-2 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {linkPatientMutation.isPending ? 'Linking...' : 'Confirm Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
