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
  patient_id: number;
  patient_number: string;
  patient_name: string;
  patient_status: string;
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
  patient_id: number;
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
    patientId: number;
    guardianId: number;
  } | null>(null);
  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        patientId: conversations[0].patient_id,
        guardianId: conversations[0].guardian_id,
      });
    }
  }, [conversations, selectedConversation]);

  // 2. Fetch active conversation messages
  const { data: conversationDetail, isLoading: messagesLoading } = useQuery<{
    patient: { id: number; patient_number: string; name: string; status: string };
    guardian: { id: number; name: string; email: string | null; phone: string; relationship: string };
    messages: MessageHistoryItem[];
  }>({
    queryKey: ['conversation_detail', selectedConversation?.patientId, selectedConversation?.guardianId],
    queryFn: async () => {
      if (!selectedConversation) return null;
      const res = await api.get(
        `/patients/${selectedConversation.patientId}/messages?guardian_id=${selectedConversation.guardianId}`
      );
      return res.data;
    },
    enabled: !!selectedConversation && !!canAccessMessages,
    refetchInterval: 3000,
  });

  // 3. Mark conversation messages as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (vars: { patientId: number; guardianId: number }) => {
      return (await api.post(`/patients/${vars.patientId}/messages/mark-read`, {
        guardian_id: vars.guardianId,
      })).data;
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
        markReadMutation.mutate({
          patientId: selectedConversation.patientId,
          guardianId: selectedConversation.guardianId,
        });
      }
    }
  }, [selectedConversation, conversationDetail]);

  // Scroll to bottom of message list on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationDetail?.messages]);

  const handleSelectConversation = (patientId: number, guardianId: number) => {
    setSelectedConversation({ patientId, guardianId });
  };

  // 4. Send reply mutation
  const replyMutation = useMutation({
    mutationFn: async (data: { patientId: number; guardianId: number; message: string }) => {
      const res = await api.post(`/patients/${data.patientId}/messages`, {
        guardian_id: data.guardianId,
        message: data.message,
      });
      return res.data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['conversation_detail', vars.patientId, vars.guardianId],
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
        patientId: selectedConversation.patientId,
        guardianId: selectedConversation.guardianId,
        message,
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send reply.');
    }
  };

  const activeConversationItem = conversations.find(
    (c) =>
      c.patient_id === selectedConversation?.patientId &&
      c.guardian_id === selectedConversation?.guardianId
  );

  if (userLoading) {
    return (
      <div className="flex justify-center items-center py-20 bg-white border border-brand-cream-dark/60 rounded-2xl">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-cream-dark/30 border-t-brand-primary" />
      </div>
    );
  }

  if (!canAccessMessages) {
    return (
      <div className="rounded-2xl border border-brand-cream-dark/60 bg-white p-8 text-center max-w-xl mx-auto shadow-sm my-12">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="font-serif text-xl font-bold text-brand-charcoal">Support Inbox Restricted</h2>
        <p className="mt-2 text-xs text-brand-muted leading-relaxed">
          Guardian communications and front-desk support chat are managed exclusively by reception and administration personnel.
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-brand-cream-dark/60">
        <div>
          <h2 className="text-xl font-serif font-bold text-brand-charcoal">Guardian Support Inbox</h2>
          <p className="text-xs text-brand-muted mt-0.5">
            Direct communication channel between verified patient guardians and front-desk receptionists.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-muted bg-white px-3 py-1.5 rounded-full border border-brand-cream-dark/60 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Support Channel</span>
        </div>
      </div>

      {/* Two-Pane WhatsApp-Style Layout */}
      <div className="bg-white rounded-2xl shadow-sm border border-brand-cream-dark/60 overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[calc(100vh-210px)] min-h-[550px]">
        {/* Left Pane: Conversations List (5 Cols) */}
        <div className="md:col-span-5 border-r border-brand-cream-dark/60 flex flex-col bg-brand-cream/30">
          {/* Search bar */}
          <div className="p-3 border-b border-brand-cream-dark/60 bg-white">
            <div className="relative">
              <input
                type="text"
                placeholder="Search guardian or patient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-brand-cream-light/60 border border-brand-cream-dark/60 rounded-xl px-3.5 py-2 pl-9 text-xs text-brand-charcoal placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
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

          {/* List */}
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
                const isSelected =
                  selectedConversation?.patientId === conv.patient_id &&
                  selectedConversation?.guardianId === conv.guardian_id;

                return (
                  <button
                    key={`${conv.guardian_id}-${conv.patient_id}`}
                    onClick={() =>
                      setSelectedConversation({
                        patientId: conv.patient_id,
                        guardianId: conv.guardian_id,
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

                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-semibold text-brand-muted truncate">
                          Patient: {conv.patient_number} — {conv.patient_name}
                        </span>
                        <span className="inline-block text-[9px] font-bold bg-brand-cream-dark/50 text-brand-charcoal px-1.5 py-0.2 rounded-full shrink-0">
                          {conv.relationship}
                        </span>
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
              <div className="p-3.5 border-b border-brand-cream-dark/60 bg-brand-cream/20 flex items-center justify-between">
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
                    <div className="text-xs text-brand-muted flex items-center gap-2 mt-0.5">
                      <span>
                        Patient:{' '}
                        <strong className="text-brand-charcoal">
                          {conversationDetail?.patient?.patient_number || activeConversationItem?.patient_number} —{' '}
                          {conversationDetail?.patient?.name || activeConversationItem?.patient_name}
                        </strong>
                      </span>
                      {activeConversationItem?.guardian_phone && (
                        <span>• Phone: {activeConversationItem.guardian_phone}</span>
                      )}
                    </div>
                  </div>
                </div>

                <Link
                  href={`/dashboard/patients/${selectedConversation.patientId}`}
                  className="text-xs font-semibold text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 px-3 py-1.5 rounded-lg transition"
                >
                  View Patient ↗
                </Link>
              </div>

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
                          {isStaff ? `${msg.sender_name} (Receptionist)` : msg.sender_name}
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
    </div>
  );
}
