import {
  clientFilesTable,
  clientInvoicesTable,
  clientMessagesTable,
  clientProjectsTable,
  clientSupportRequestsTable,
  clientTimelineItemsTable,
  db,
  usersTable,
} from "@workspace/db";
import { randomBytes, scryptSync } from "node:crypto";

type DemoUser = {
  id: string;
  email: string;
  name: string;
  role: "client" | "admin";
  password: string;
};

const DEMO_USERS: DemoUser[] = [
  {
    id: "user-client-100",
    email: "client@booksandbrews.app",
    name: "Morgan Reader",
    role: "client",
    password: "brew-client-2026",
  },
  {
    id: "user-admin-100",
    email: "admin@booksandbrews.app",
    name: "Rowan Harper",
    role: "admin",
    password: "admin123",
  },
];

const CLIENT_USER_ID = "user-client-100";

const CLIENT_PROJECTS = [
  {
    id: "project-bb-client-website",
    clientUserId: CLIENT_USER_ID,
    projectName: "Books and Brews Website Platform",
    status: "In Review" as const,
    progressPercent: 84,
    phase: "Final QA",
    nextMilestone: "Approve launch checklist",
    targetDate: new Date("2026-04-26T16:00:00.000Z"),
    updatedAt: new Date("2026-04-13T14:10:00.000Z"),
  },
];

const CLIENT_TIMELINE = [
  {
    id: "timeline-bb-1",
    clientUserId: CLIENT_USER_ID,
    projectId: "project-bb-client-website",
    type: "Milestone" as const,
    title: "Design handoff approved",
    description: "Brand visuals and page system approved for final implementation.",
    occurredAt: new Date("2026-04-10T17:20:00.000Z"),
  },
  {
    id: "timeline-bb-2",
    clientUserId: CLIENT_USER_ID,
    projectId: "project-bb-client-website",
    type: "Update" as const,
    title: "Copy refinements delivered",
    description: "Homepage and services copy updated based on client feedback.",
    occurredAt: new Date("2026-04-12T13:05:00.000Z"),
  },
  {
    id: "timeline-bb-3",
    clientUserId: CLIENT_USER_ID,
    projectId: "project-bb-client-website",
    type: "Delivery" as const,
    title: "Staging review link shared",
    description: "Preview environment delivered for launch-readiness review.",
    occurredAt: new Date("2026-04-13T09:45:00.000Z"),
  },
];

const CLIENT_MESSAGES = [
  {
    id: "message-bb-1",
    clientUserId: CLIENT_USER_ID,
    subject: "Launch checklist ready",
    preview: "We uploaded the final launch checklist and are ready for your sign-off.",
    senderRole: "studio" as const,
    isRead: false,
    sentAt: new Date("2026-04-13T11:30:00.000Z"),
  },
  {
    id: "message-bb-2",
    clientUserId: CLIENT_USER_ID,
    subject: "Logo variant confirmation",
    preview: "Confirmed. Please proceed with the cream-on-mocha header logo treatment.",
    senderRole: "client" as const,
    isRead: true,
    sentAt: new Date("2026-04-12T16:10:00.000Z"),
  },
  {
    id: "message-bb-3",
    clientUserId: CLIENT_USER_ID,
    subject: "Accessibility pass complete",
    preview: "Color contrast and heading structure checks have passed across key pages.",
    senderRole: "studio" as const,
    isRead: true,
    sentAt: new Date("2026-04-11T15:45:00.000Z"),
  },
];

const CLIENT_INVOICES = [
  {
    id: "invoice-bb-1",
    clientUserId: CLIENT_USER_ID,
    invoiceNumber: "BB-2026-041",
    amountCents: 325000,
    status: "Paid" as const,
    dueDate: new Date("2026-04-05T17:00:00.000Z"),
    issuedAt: new Date("2026-03-28T13:00:00.000Z"),
    paidAt: new Date("2026-04-03T14:20:00.000Z"),
    downloadUrl: "https://portal.booksandbrews.app/invoices/BB-2026-041.pdf",
  },
  {
    id: "invoice-bb-2",
    clientUserId: CLIENT_USER_ID,
    invoiceNumber: "BB-2026-052",
    amountCents: 275000,
    status: "Sent" as const,
    dueDate: new Date("2026-04-22T17:00:00.000Z"),
    issuedAt: new Date("2026-04-12T09:15:00.000Z"),
    paidAt: null,
    downloadUrl: "https://portal.booksandbrews.app/invoices/BB-2026-052.pdf",
  },
];

const CLIENT_FILES = [
  {
    id: "file-bb-1",
    clientUserId: CLIENT_USER_ID,
    projectId: "project-bb-client-website",
    name: "Launch checklist.pdf",
    category: "Deliverable" as const,
    sizeBytes: 246120,
    uploadedAt: new Date("2026-04-13T11:20:00.000Z"),
    downloadUrl: "https://portal.booksandbrews.app/files/launch-checklist.pdf",
  },
  {
    id: "file-bb-2",
    clientUserId: CLIENT_USER_ID,
    projectId: "project-bb-client-website",
    name: "Brand asset pack.zip",
    category: "Asset" as const,
    sizeBytes: 4823190,
    uploadedAt: new Date("2026-04-10T18:40:00.000Z"),
    downloadUrl: "https://portal.booksandbrews.app/files/brand-asset-pack.zip",
  },
  {
    id: "file-bb-3",
    clientUserId: CLIENT_USER_ID,
    projectId: "project-bb-client-website",
    name: "Invoice BB-2026-052.pdf",
    category: "Invoice" as const,
    sizeBytes: 184002,
    uploadedAt: new Date("2026-04-12T09:20:00.000Z"),
    downloadUrl: "https://portal.booksandbrews.app/invoices/BB-2026-052.pdf",
  },
];

const CLIENT_SUPPORT_REQUESTS = [
  {
    id: "support-bb-1",
    clientUserId: CLIENT_USER_ID,
    projectId: "project-bb-client-website",
    subject: "Final launch window confirmation",
    message:
      "Can we confirm the exact production cutover window and rollback plan before sign-off?",
    priority: "normal" as const,
    status: "In Progress" as const,
    createdAt: new Date("2026-04-11T10:05:00.000Z"),
    updatedAt: new Date("2026-04-13T09:15:00.000Z"),
  },
  {
    id: "support-bb-2",
    clientUserId: CLIENT_USER_ID,
    projectId: null,
    subject: "Analytics access request",
    message:
      "Please grant read-only access for our marketing lead to the analytics workspace.",
    priority: "high" as const,
    status: "Open" as const,
    createdAt: new Date("2026-04-12T14:35:00.000Z"),
    updatedAt: new Date("2026-04-12T14:35:00.000Z"),
  },
];

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

async function seedAuthUsers(): Promise<void> {
  for (const user of DEMO_USERS) {
    await db
      .insert(usersTable)
      .values({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash: hashPassword(user.password),
      })
      .onConflictDoUpdate({
        target: usersTable.email,
        set: {
          name: user.name,
          role: user.role,
          passwordHash: hashPassword(user.password),
          updatedAt: new Date(),
        },
      });
  }

  for (const project of CLIENT_PROJECTS) {
    await db
      .insert(clientProjectsTable)
      .values(project)
      .onConflictDoUpdate({
        target: clientProjectsTable.id,
        set: {
          projectName: project.projectName,
          status: project.status,
          progressPercent: project.progressPercent,
          phase: project.phase,
          nextMilestone: project.nextMilestone,
          targetDate: project.targetDate,
          updatedAt: project.updatedAt,
        },
      });
  }

  for (const item of CLIENT_TIMELINE) {
    await db
      .insert(clientTimelineItemsTable)
      .values(item)
      .onConflictDoUpdate({
        target: clientTimelineItemsTable.id,
        set: {
          type: item.type,
          title: item.title,
          description: item.description,
          occurredAt: item.occurredAt,
        },
      });
  }

  for (const message of CLIENT_MESSAGES) {
    await db
      .insert(clientMessagesTable)
      .values(message)
      .onConflictDoUpdate({
        target: clientMessagesTable.id,
        set: {
          subject: message.subject,
          preview: message.preview,
          senderRole: message.senderRole,
          isRead: message.isRead,
          sentAt: message.sentAt,
        },
      });
  }

  for (const invoice of CLIENT_INVOICES) {
    await db
      .insert(clientInvoicesTable)
      .values(invoice)
      .onConflictDoUpdate({
        target: clientInvoicesTable.id,
        set: {
          invoiceNumber: invoice.invoiceNumber,
          amountCents: invoice.amountCents,
          status: invoice.status,
          dueDate: invoice.dueDate,
          issuedAt: invoice.issuedAt,
          paidAt: invoice.paidAt,
          downloadUrl: invoice.downloadUrl,
        },
      });
  }

  for (const file of CLIENT_FILES) {
    await db
      .insert(clientFilesTable)
      .values(file)
      .onConflictDoUpdate({
        target: clientFilesTable.id,
        set: {
          name: file.name,
          category: file.category,
          sizeBytes: file.sizeBytes,
          uploadedAt: file.uploadedAt,
          downloadUrl: file.downloadUrl,
        },
      });
  }

  for (const request of CLIENT_SUPPORT_REQUESTS) {
    await db
      .insert(clientSupportRequestsTable)
      .values(request)
      .onConflictDoUpdate({
        target: clientSupportRequestsTable.id,
        set: {
          subject: request.subject,
          message: request.message,
          priority: request.priority,
          status: request.status,
          updatedAt: request.updatedAt,
        },
      });
  }

  console.log(
    `Seeded ${DEMO_USERS.length} auth users, ${CLIENT_PROJECTS.length} projects, ${CLIENT_TIMELINE.length} timeline entries, ${CLIENT_MESSAGES.length} messages, ${CLIENT_INVOICES.length} invoices, ${CLIENT_FILES.length} files, and ${CLIENT_SUPPORT_REQUESTS.length} support requests.`,
  );
}

seedAuthUsers()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error("Failed to seed auth demo users", error);
    process.exit(1);
  });
