import type {
  ClientFile,
  ClientInvoice,
  ClientMessage,
  ClientNotification,
  ClientProjectPayload,
  ClientProjectStatus,
  ClientSupportRequest,
  ClientTimelineEntry,
} from "@workspace/api-client-react";

export const placeholderProjectStatus: ClientProjectStatus[] = [
  {
    id: "placeholder-project-1",
    projectName: "Books and Brews Digital Platform",
    status: "In Review",
    progressPercent: 82,
    phase: "Refinement and launch prep",
    nextMilestone: "Approve final launch checklist",
    targetDate: "2026-04-26T16:00:00.000Z",
  },
];

export const placeholderTimeline: ClientTimelineEntry[] = [
  {
    id: "placeholder-timeline-1",
    projectId: "placeholder-project-1",
    type: "Milestone",
    title: "Design system signed off",
    description: "All component states approved and locked for launch handoff.",
    occurredAt: "2026-04-09T18:15:00.000Z",
  },
  {
    id: "placeholder-timeline-2",
    projectId: "placeholder-project-1",
    type: "Update",
    title: "Homepage copy polished",
    description: "Messaging updated to emphasize premium craft and service clarity.",
    occurredAt: "2026-04-11T14:40:00.000Z",
  },
  {
    id: "placeholder-timeline-3",
    projectId: "placeholder-project-1",
    type: "Delivery",
    title: "Staging walkthrough delivered",
    description: "A private preview link was shared for final review and QA.",
    occurredAt: "2026-04-12T10:20:00.000Z",
  },
];

export const placeholderProjectPayload: ClientProjectPayload = {
  project: placeholderProjectStatus[0],
  timeline: placeholderTimeline,
};

export const placeholderNotifications: ClientNotification[] = [
  {
    id: "placeholder-notification-1",
    type: "message",
    title: "Launch checklist is ready",
    description: "Your launch checklist is now in the portal and ready for sign-off.",
    occurredAt: "2026-04-13T11:30:00.000Z",
    isUnread: true,
    actionLabel: "Open message",
    relatedId: "placeholder-message-1",
  },
  {
    id: "placeholder-notification-2",
    type: "file",
    title: "Launch checklist.pdf",
    description: "Deliverable file added to your shared workspace.",
    occurredAt: "2026-04-13T11:20:00.000Z",
    isUnread: false,
    actionLabel: "View files",
    relatedId: "placeholder-file-1",
  },
  {
    id: "placeholder-notification-3",
    type: "invoice",
    title: "Invoice BB-2026-052 sent",
    description: "Amount due: $2,750.00",
    occurredAt: "2026-04-12T09:15:00.000Z",
    isUnread: true,
    actionLabel: "Review invoice",
    relatedId: "placeholder-invoice-2",
  },
];

export const placeholderMessages: ClientMessage[] = [
  {
    id: "placeholder-message-1",
    subject: "Launch checklist is ready",
    preview: "Your launch checklist is now in the portal and ready for sign-off.",
    senderRole: "studio",
    isRead: false,
    sentAt: "2026-04-13T11:30:00.000Z",
  },
  {
    id: "placeholder-message-2",
    subject: "Asset package confirmed",
    preview: "Thanks for confirming the latest logo and photography set.",
    senderRole: "studio",
    isRead: true,
    sentAt: "2026-04-11T15:45:00.000Z",
  },
];

export const placeholderInvoices: ClientInvoice[] = [
  {
    id: "placeholder-invoice-1",
    invoiceNumber: "BB-2026-041",
    amountCents: 325000,
    status: "Paid",
    dueDate: "2026-04-05T17:00:00.000Z",
    issuedAt: "2026-03-28T13:00:00.000Z",
    paidAt: "2026-04-03T14:20:00.000Z",
    downloadUrl: "https://portal.booksandbrews.app/invoices/BB-2026-041.pdf",
  },
  {
    id: "placeholder-invoice-2",
    invoiceNumber: "BB-2026-052",
    amountCents: 275000,
    status: "Sent",
    dueDate: "2026-04-22T17:00:00.000Z",
    issuedAt: "2026-04-12T09:15:00.000Z",
    paidAt: null,
    downloadUrl: "https://portal.booksandbrews.app/invoices/BB-2026-052.pdf",
  },
];

export const placeholderFiles: ClientFile[] = [
  {
    id: "placeholder-file-1",
    projectId: "placeholder-project-1",
    name: "Launch checklist.pdf",
    category: "Deliverable",
    sizeBytes: 246120,
    uploadedAt: "2026-04-13T11:20:00.000Z",
    downloadUrl: "https://portal.booksandbrews.app/files/launch-checklist.pdf",
  },
  {
    id: "placeholder-file-2",
    projectId: "placeholder-project-1",
    name: "Brand asset pack.zip",
    category: "Asset",
    sizeBytes: 4823190,
    uploadedAt: "2026-04-10T18:40:00.000Z",
    downloadUrl: "https://portal.booksandbrews.app/files/brand-asset-pack.zip",
  },
];

export const placeholderSupportTickets: ClientSupportRequest[] = [
  {
    id: "support-1",
    projectId: "placeholder-project-1",
    subject: "Final domain switch plan",
    message: "Please confirm the final production cutover plan and rollback workflow.",
    priority: "normal",
    status: "In Progress",
    createdAt: "2026-04-11T09:10:00.000Z",
    updatedAt: "2026-04-13T10:10:00.000Z",
  },
  {
    id: "support-2",
    projectId: null,
    subject: "Analytics dashboard access",
    message: "Need access granted for our marketing lead before launch.",
    priority: "high",
    status: "Open",
    createdAt: "2026-04-12T14:35:00.000Z",
    updatedAt: "2026-04-12T15:35:00.000Z",
  },
];
