import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Response } from "express";
import {
  GetClientFilesResponse,
  GetClientInvoicesResponse,
  GetClientMessagesResponse,
  GetClientNotificationsResponse,
  GetClientProjectResponse,
  GetClientPortalFilesResponse,
  GetClientPortalInvoicesResponse,
  GetClientPortalMessagesResponse,
  GetClientPortalStatusResponse,
  GetClientPortalTimelineResponse,
  PostClientSupportBody,
} from "@workspace/api-zod";
import {
  clientFilesTable,
  clientInvoicesTable,
  clientMessagesTable,
  clientProjectsTable,
  clientSupportRequestsTable,
  clientTimelineItemsTable,
  db,
} from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { getAuthContext, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

router.use(requireRole("client"));

function requireClientUserId(res: Response): string | null {
  const auth = getAuthContext(res);
  if (!auth) {
    res.status(401).json({ message: "Authentication required" });
    return null;
  }

  return auth.user.id;
}

async function readClientProjectPayload(clientUserId: string) {
  const [project] = await db
    .select({
      id: clientProjectsTable.id,
      projectName: clientProjectsTable.projectName,
      status: clientProjectsTable.status,
      progressPercent: clientProjectsTable.progressPercent,
      phase: clientProjectsTable.phase,
      nextMilestone: clientProjectsTable.nextMilestone,
      targetDate: clientProjectsTable.targetDate,
    })
    .from(clientProjectsTable)
    .where(eq(clientProjectsTable.clientUserId, clientUserId))
    .orderBy(desc(clientProjectsTable.updatedAt))
    .limit(1);

  if (!project) {
    return GetClientProjectResponse.parse({ project: null, timeline: [] });
  }

  const timelineRows = await db
    .select({
      id: clientTimelineItemsTable.id,
      projectId: clientTimelineItemsTable.projectId,
      type: clientTimelineItemsTable.type,
      title: clientTimelineItemsTable.title,
      description: clientTimelineItemsTable.description,
      occurredAt: clientTimelineItemsTable.occurredAt,
    })
    .from(clientTimelineItemsTable)
    .where(
      and(
        eq(clientTimelineItemsTable.clientUserId, clientUserId),
        eq(clientTimelineItemsTable.projectId, project.id),
      ),
    )
    .orderBy(desc(clientTimelineItemsTable.occurredAt));

  return GetClientProjectResponse.parse({
    project: {
      ...project,
      targetDate: project.targetDate.toISOString(),
    },
    timeline: timelineRows.map((row) => ({
      ...row,
      occurredAt: row.occurredAt.toISOString(),
    })),
  });
}

async function readClientMessages(clientUserId: string) {
  const rows = await db
    .select({
      id: clientMessagesTable.id,
      subject: clientMessagesTable.subject,
      preview: clientMessagesTable.preview,
      senderRole: clientMessagesTable.senderRole,
      isRead: clientMessagesTable.isRead,
      sentAt: clientMessagesTable.sentAt,
    })
    .from(clientMessagesTable)
    .where(eq(clientMessagesTable.clientUserId, clientUserId))
    .orderBy(desc(clientMessagesTable.sentAt));

  return GetClientMessagesResponse.parse(
    rows.map((row) => ({
      ...row,
      sentAt: row.sentAt.toISOString(),
    })),
  );
}

async function readClientInvoices(clientUserId: string) {
  const rows = await db
    .select({
      id: clientInvoicesTable.id,
      invoiceNumber: clientInvoicesTable.invoiceNumber,
      amountCents: clientInvoicesTable.amountCents,
      status: clientInvoicesTable.status,
      dueDate: clientInvoicesTable.dueDate,
      issuedAt: clientInvoicesTable.issuedAt,
      paidAt: clientInvoicesTable.paidAt,
      downloadUrl: clientInvoicesTable.downloadUrl,
    })
    .from(clientInvoicesTable)
    .where(eq(clientInvoicesTable.clientUserId, clientUserId))
    .orderBy(desc(clientInvoicesTable.dueDate));

  return GetClientInvoicesResponse.parse(
    rows.map((row) => ({
      ...row,
      dueDate: row.dueDate.toISOString(),
      issuedAt: row.issuedAt.toISOString(),
      paidAt: row.paidAt ? row.paidAt.toISOString() : null,
    })),
  );
}

async function readClientFiles(clientUserId: string) {
  const rows = await db
    .select({
      id: clientFilesTable.id,
      projectId: clientFilesTable.projectId,
      name: clientFilesTable.name,
      category: clientFilesTable.category,
      sizeBytes: clientFilesTable.sizeBytes,
      uploadedAt: clientFilesTable.uploadedAt,
      downloadUrl: clientFilesTable.downloadUrl,
    })
    .from(clientFilesTable)
    .where(eq(clientFilesTable.clientUserId, clientUserId))
    .orderBy(desc(clientFilesTable.uploadedAt));

  return GetClientFilesResponse.parse(
    rows.map((row) => ({
      ...row,
      uploadedAt: row.uploadedAt.toISOString(),
    })),
  );
}

async function readClientNotifications(clientUserId: string) {
  let timelineRows: {
    id: string;
    type: "Milestone" | "Update" | "Delivery" | "Billing";
    title: string;
    description: string;
    occurredAt: Date;
  }[];
  let messageRows: {
    id: string;
    subject: string;
    preview: string;
    senderRole: "studio" | "client";
    isRead: boolean;
    sentAt: Date;
  }[];
  let invoiceRows: {
    id: string;
    invoiceNumber: string;
    amountCents: number;
    status: "Draft" | "Sent" | "Paid" | "Overdue";
    dueDate: Date;
    issuedAt: Date;
    paidAt: Date | null;
  }[];
  let fileRows: {
    id: string;
    name: string;
    category: "Contract" | "Deliverable" | "Asset" | "Invoice" | "Other";
    uploadedAt: Date;
  }[];
  let supportRows: {
    id: string;
    subject: string;
    priority: "low" | "normal" | "high";
    status: "Open" | "In Progress" | "Resolved";
    updatedAt: Date;
  }[];

  try {
    [timelineRows, messageRows, invoiceRows, fileRows, supportRows] =
      await Promise.all([
        db
          .select({
            id: clientTimelineItemsTable.id,
            type: clientTimelineItemsTable.type,
            title: clientTimelineItemsTable.title,
            description: clientTimelineItemsTable.description,
            occurredAt: clientTimelineItemsTable.occurredAt,
          })
          .from(clientTimelineItemsTable)
          .where(eq(clientTimelineItemsTable.clientUserId, clientUserId))
          .orderBy(desc(clientTimelineItemsTable.occurredAt))
          .limit(12),
        db
          .select({
            id: clientMessagesTable.id,
            subject: clientMessagesTable.subject,
            preview: clientMessagesTable.preview,
            senderRole: clientMessagesTable.senderRole,
            isRead: clientMessagesTable.isRead,
            sentAt: clientMessagesTable.sentAt,
          })
          .from(clientMessagesTable)
          .where(eq(clientMessagesTable.clientUserId, clientUserId))
          .orderBy(desc(clientMessagesTable.sentAt))
          .limit(12),
        db
          .select({
            id: clientInvoicesTable.id,
            invoiceNumber: clientInvoicesTable.invoiceNumber,
            amountCents: clientInvoicesTable.amountCents,
            status: clientInvoicesTable.status,
            dueDate: clientInvoicesTable.dueDate,
            issuedAt: clientInvoicesTable.issuedAt,
            paidAt: clientInvoicesTable.paidAt,
          })
          .from(clientInvoicesTable)
          .where(eq(clientInvoicesTable.clientUserId, clientUserId))
          .orderBy(desc(clientInvoicesTable.issuedAt))
          .limit(12),
        db
          .select({
            id: clientFilesTable.id,
            name: clientFilesTable.name,
            category: clientFilesTable.category,
            uploadedAt: clientFilesTable.uploadedAt,
          })
          .from(clientFilesTable)
          .where(eq(clientFilesTable.clientUserId, clientUserId))
          .orderBy(desc(clientFilesTable.uploadedAt))
          .limit(12),
        db
          .select({
            id: clientSupportRequestsTable.id,
            subject: clientSupportRequestsTable.subject,
            priority: clientSupportRequestsTable.priority,
            status: clientSupportRequestsTable.status,
            updatedAt: clientSupportRequestsTable.updatedAt,
          })
          .from(clientSupportRequestsTable)
          .where(eq(clientSupportRequestsTable.clientUserId, clientUserId))
          .orderBy(desc(clientSupportRequestsTable.updatedAt))
          .limit(12),
      ]);
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }

    console.warn("Client notifications lookup failed; using development demo feed.");
    return GetClientNotificationsResponse.parse([
      {
        id: `demo-message-${clientUserId}`,
        type: "message",
        title: "Launch checklist is ready",
        description:
          "Your launch checklist is now in the portal and ready for sign-off.",
        occurredAt: "2026-04-13T11:30:00.000Z",
        isUnread: true,
        actionLabel: "Open message",
        relatedId: "demo-message-1",
      },
      {
        id: `demo-file-${clientUserId}`,
        type: "file",
        title: "Launch checklist.pdf",
        description: "Deliverable file added to your shared workspace.",
        occurredAt: "2026-04-13T11:20:00.000Z",
        isUnread: false,
        actionLabel: "View files",
        relatedId: "demo-file-1",
      },
      {
        id: `demo-invoice-${clientUserId}`,
        type: "invoice",
        title: "Invoice BB-2026-052 sent",
        description: "Amount due: $2,750.00",
        occurredAt: "2026-04-12T09:15:00.000Z",
        isUnread: true,
        actionLabel: "Review invoice",
        relatedId: "demo-invoice-1",
      },
    ]);
  }

  const notifications = [
    ...timelineRows.map((row) => ({
      id: `timeline-${row.id}`,
      type: "project" as const,
      title: row.title,
      description: row.description,
      occurredAt: row.occurredAt.toISOString(),
      isUnread: false,
      actionLabel: `View ${row.type.toLowerCase()}`,
      relatedId: row.id,
    })),
    ...messageRows.map((row) => ({
      id: `message-${row.id}`,
      type: "message" as const,
      title: row.subject,
      description:
        row.senderRole === "studio" ? row.preview : `You replied: ${row.preview}`,
      occurredAt: row.sentAt.toISOString(),
      isUnread: !row.isRead,
      actionLabel: "Open message",
      relatedId: row.id,
    })),
    ...invoiceRows.map((row) => ({
      id: `invoice-${row.id}`,
      type: "invoice" as const,
      title:
        row.status === "Paid"
          ? `Invoice ${row.invoiceNumber} paid`
          : `Invoice ${row.invoiceNumber} ${row.status.toLowerCase()}`,
      description:
        row.status === "Paid"
          ? "Payment has been recorded in your portal."
          : `Amount due: $${(row.amountCents / 100).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
      occurredAt: (row.paidAt ?? row.issuedAt).toISOString(),
      isUnread: row.status !== "Paid",
      actionLabel: "Review invoice",
      relatedId: row.id,
    })),
    ...fileRows.map((row) => ({
      id: `file-${row.id}`,
      type: "file" as const,
      title: row.name,
      description: `${row.category} file added to your shared workspace.`,
      occurredAt: row.uploadedAt.toISOString(),
      isUnread: false,
      actionLabel: "View files",
      relatedId: row.id,
    })),
    ...supportRows.map((row) => ({
      id: `support-${row.id}`,
      type: "support" as const,
      title: row.subject,
      description: `${row.priority} priority request is ${row.status.toLowerCase()}.`,
      occurredAt: row.updatedAt.toISOString(),
      isUnread: row.status !== "Resolved",
      actionLabel: "View support",
      relatedId: row.id,
    })),
  ].sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  return GetClientNotificationsResponse.parse(notifications.slice(0, 24));
}

router.get("/project", async (_req, res) => {
  const clientUserId = requireClientUserId(res);
  if (!clientUserId) {
    return;
  }

  const data = await readClientProjectPayload(clientUserId);
  res.json(data);
});

router.get("/notifications", async (_req, res) => {
  const clientUserId = requireClientUserId(res);
  if (!clientUserId) {
    return;
  }

  const data = await readClientNotifications(clientUserId);
  res.json(data);
});

router.get("/messages", async (_req, res) => {
  const clientUserId = requireClientUserId(res);
  if (!clientUserId) {
    return;
  }

  const data = await readClientMessages(clientUserId);
  res.json(data);
});

router.get("/invoices", async (_req, res) => {
  const clientUserId = requireClientUserId(res);
  if (!clientUserId) {
    return;
  }

  const data = await readClientInvoices(clientUserId);
  res.json(data);
});

router.get("/files", async (_req, res) => {
  const clientUserId = requireClientUserId(res);
  if (!clientUserId) {
    return;
  }

  const data = await readClientFiles(clientUserId);
  res.json(data);
});

router.post("/support", async (req, res) => {
  const clientUserId = requireClientUserId(res);
  if (!clientUserId) {
    return;
  }

  const body = PostClientSupportBody.parse(req.body);
  const supportId = randomUUID();
  const now = new Date();
  const requestedProjectId = body.projectId ?? null;

  if (requestedProjectId) {
    const [project] = await db
      .select({ id: clientProjectsTable.id })
      .from(clientProjectsTable)
      .where(
        and(
          eq(clientProjectsTable.id, requestedProjectId),
          eq(clientProjectsTable.clientUserId, clientUserId),
        ),
      )
      .limit(1);

    if (!project) {
      res.status(400).json({ message: "Invalid projectId for this client" });
      return;
    }
  }

  const [supportRequest] = await db
    .insert(clientSupportRequestsTable)
    .values({
      id: supportId,
      clientUserId,
      projectId: requestedProjectId,
      subject: body.subject,
      message: body.message,
      priority: body.priority ?? "normal",
      status: "Open",
      createdAt: now,
      updatedAt: now,
    })
    .returning({
      id: clientSupportRequestsTable.id,
      projectId: clientSupportRequestsTable.projectId,
      subject: clientSupportRequestsTable.subject,
      message: clientSupportRequestsTable.message,
      priority: clientSupportRequestsTable.priority,
      status: clientSupportRequestsTable.status,
      createdAt: clientSupportRequestsTable.createdAt,
      updatedAt: clientSupportRequestsTable.updatedAt,
    });

  const data = {
    id: supportRequest.id,
    projectId: supportRequest.projectId,
    subject: supportRequest.subject,
    message: supportRequest.message,
    priority: supportRequest.priority,
    status: supportRequest.status,
    createdAt: supportRequest.createdAt.toISOString(),
    updatedAt: supportRequest.updatedAt.toISOString(),
  };

  res.status(201).json(data);
});

router.get("/portal/status", async (_req, res) => {
  const clientUserId = requireClientUserId(res);
  if (!clientUserId) {
    return;
  }

  const payload = await readClientProjectPayload(clientUserId);
  const data = GetClientPortalStatusResponse.parse(
    payload.project ? [payload.project] : [],
  );

  res.json(data);
});

router.get("/portal/timeline", async (_req, res) => {
  const clientUserId = requireClientUserId(res);
  if (!clientUserId) {
    return;
  }

  const payload = await readClientProjectPayload(clientUserId);
  const data = GetClientPortalTimelineResponse.parse(payload.timeline);

  res.json(data);
});

router.get("/portal/messages", async (_req, res) => {
  const clientUserId = requireClientUserId(res);
  if (!clientUserId) {
    return;
  }

  const data = GetClientPortalMessagesResponse.parse(
    await readClientMessages(clientUserId),
  );

  res.json(data);
});

router.get("/portal/invoices", async (_req, res) => {
  const clientUserId = requireClientUserId(res);
  if (!clientUserId) {
    return;
  }

  const data = GetClientPortalInvoicesResponse.parse(
    await readClientInvoices(clientUserId),
  );

  res.json(data);
});

router.get("/portal/files", async (_req, res) => {
  const clientUserId = requireClientUserId(res);
  if (!clientUserId) {
    return;
  }

  const data = GetClientPortalFilesResponse.parse(await readClientFiles(clientUserId));

  res.json(data);
});

export default router;
