import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

export const clientProjectStatusEnum = pgEnum("client_project_status", [
  "Planning",
  "In Progress",
  "In Review",
  "Completed",
  "On Hold",
]);

export const clientTimelineTypeEnum = pgEnum("client_timeline_type", [
  "Milestone",
  "Update",
  "Delivery",
  "Billing",
]);

export const clientMessageSenderRoleEnum = pgEnum("client_message_sender_role", [
  "studio",
  "client",
]);

export const clientInvoiceStatusEnum = pgEnum("client_invoice_status", [
  "Draft",
  "Sent",
  "Paid",
  "Overdue",
]);

export const clientFileCategoryEnum = pgEnum("client_file_category", [
  "Contract",
  "Deliverable",
  "Asset",
  "Invoice",
  "Other",
]);

export const clientSupportPriorityEnum = pgEnum("client_support_priority", [
  "low",
  "normal",
  "high",
]);

export const clientSupportStatusEnum = pgEnum("client_support_status", [
  "Open",
  "In Progress",
  "Resolved",
]);

export const clientProjectsTable = pgTable(
  "client_projects",
  {
    id: text("id").primaryKey(),
    clientUserId: text("client_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    projectName: text("project_name").notNull(),
    status: clientProjectStatusEnum("status").notNull(),
    progressPercent: integer("progress_percent").notNull(),
    phase: text("phase").notNull(),
    nextMilestone: text("next_milestone").notNull(),
    targetDate: timestamp("target_date", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    clientProjectsUserIdIdx: index("client_projects_user_id_idx").on(
      table.clientUserId,
    ),
    clientProjectsUpdatedAtIdx: index("client_projects_updated_at_idx").on(
      table.updatedAt,
    ),
  }),
);

export const clientTimelineItemsTable = pgTable(
  "client_timeline_items",
  {
    id: text("id").primaryKey(),
    clientUserId: text("client_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => clientProjectsTable.id, { onDelete: "cascade" }),
    type: clientTimelineTypeEnum("type").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    clientTimelineUserIdIdx: index("client_timeline_user_id_idx").on(
      table.clientUserId,
    ),
    clientTimelineOccurredAtIdx: index("client_timeline_occurred_at_idx").on(
      table.occurredAt,
    ),
  }),
);

export const clientMessagesTable = pgTable(
  "client_messages",
  {
    id: text("id").primaryKey(),
    clientUserId: text("client_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    preview: text("preview").notNull(),
    senderRole: clientMessageSenderRoleEnum("sender_role").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    clientMessagesUserIdIdx: index("client_messages_user_id_idx").on(
      table.clientUserId,
    ),
    clientMessagesSentAtIdx: index("client_messages_sent_at_idx").on(
      table.sentAt,
    ),
  }),
);

export const clientInvoicesTable = pgTable(
  "client_invoices",
  {
    id: text("id").primaryKey(),
    clientUserId: text("client_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    invoiceNumber: text("invoice_number").notNull(),
    amountCents: integer("amount_cents").notNull(),
    status: clientInvoiceStatusEnum("status").notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    downloadUrl: text("download_url").notNull(),
  },
  (table) => ({
    clientInvoicesUserIdIdx: index("client_invoices_user_id_idx").on(
      table.clientUserId,
    ),
    clientInvoicesDueDateIdx: index("client_invoices_due_date_idx").on(
      table.dueDate,
    ),
  }),
);

export const clientFilesTable = pgTable(
  "client_files",
  {
    id: text("id").primaryKey(),
    clientUserId: text("client_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => clientProjectsTable.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    category: clientFileCategoryEnum("category").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    downloadUrl: text("download_url").notNull(),
  },
  (table) => ({
    clientFilesUserIdIdx: index("client_files_user_id_idx").on(table.clientUserId),
    clientFilesUploadedAtIdx: index("client_files_uploaded_at_idx").on(
      table.uploadedAt,
    ),
  }),
);

export const clientSupportRequestsTable = pgTable(
  "client_support_requests",
  {
    id: text("id").primaryKey(),
    clientUserId: text("client_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => clientProjectsTable.id, {
      onDelete: "set null",
    }),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    priority: clientSupportPriorityEnum("priority").notNull().default("normal"),
    status: clientSupportStatusEnum("status").notNull().default("Open"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    clientSupportRequestsUserIdIdx: index("client_support_requests_user_id_idx").on(
      table.clientUserId,
    ),
    clientSupportRequestsStatusIdx: index("client_support_requests_status_idx").on(
      table.status,
    ),
    clientSupportRequestsCreatedAtIdx: index(
      "client_support_requests_created_at_idx",
    ).on(table.createdAt),
  }),
);

export const clientProjectsRelations = relations(clientProjectsTable, ({ one, many }) => ({
  client: one(usersTable, {
    fields: [clientProjectsTable.clientUserId],
    references: [usersTable.id],
  }),
  timelineItems: many(clientTimelineItemsTable),
  files: many(clientFilesTable),
  supportRequests: many(clientSupportRequestsTable),
}));

export const clientTimelineItemsRelations = relations(
  clientTimelineItemsTable,
  ({ one }) => ({
    project: one(clientProjectsTable, {
      fields: [clientTimelineItemsTable.projectId],
      references: [clientProjectsTable.id],
    }),
  }),
);

export const clientMessagesRelations = relations(clientMessagesTable, ({ one }) => ({
  client: one(usersTable, {
    fields: [clientMessagesTable.clientUserId],
    references: [usersTable.id],
  }),
}));

export const clientInvoicesRelations = relations(clientInvoicesTable, ({ one }) => ({
  client: one(usersTable, {
    fields: [clientInvoicesTable.clientUserId],
    references: [usersTable.id],
  }),
}));

export const clientFilesRelations = relations(clientFilesTable, ({ one }) => ({
  client: one(usersTable, {
    fields: [clientFilesTable.clientUserId],
    references: [usersTable.id],
  }),
  project: one(clientProjectsTable, {
    fields: [clientFilesTable.projectId],
    references: [clientProjectsTable.id],
  }),
}));

export const clientSupportRequestsRelations = relations(
  clientSupportRequestsTable,
  ({ one }) => ({
    client: one(usersTable, {
      fields: [clientSupportRequestsTable.clientUserId],
      references: [usersTable.id],
    }),
    project: one(clientProjectsTable, {
      fields: [clientSupportRequestsTable.projectId],
      references: [clientProjectsTable.id],
    }),
  }),
);

export const insertClientProjectSchema = createInsertSchema(clientProjectsTable);
export const insertClientTimelineItemSchema = createInsertSchema(
  clientTimelineItemsTable,
);
export const insertClientMessageSchema = createInsertSchema(clientMessagesTable);
export const insertClientInvoiceSchema = createInsertSchema(clientInvoicesTable);
export const insertClientFileSchema = createInsertSchema(clientFilesTable);
export const insertClientSupportRequestSchema = createInsertSchema(
  clientSupportRequestsTable,
);

export type ClientProject = typeof clientProjectsTable.$inferSelect;
export type ClientTimelineItem = typeof clientTimelineItemsTable.$inferSelect;
export type ClientMessage = typeof clientMessagesTable.$inferSelect;
export type ClientInvoice = typeof clientInvoicesTable.$inferSelect;
export type ClientFile = typeof clientFilesTable.$inferSelect;
export type ClientSupportRequest = typeof clientSupportRequestsTable.$inferSelect;

export type InsertClientProject = z.infer<typeof insertClientProjectSchema>;
export type InsertClientTimelineItem = z.infer<typeof insertClientTimelineItemSchema>;
export type InsertClientMessage = z.infer<typeof insertClientMessageSchema>;
export type InsertClientInvoice = z.infer<typeof insertClientInvoiceSchema>;
export type InsertClientFile = z.infer<typeof insertClientFileSchema>;
export type InsertClientSupportRequest = z.infer<
  typeof insertClientSupportRequestSchema
>;
