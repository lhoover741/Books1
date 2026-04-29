import { relations } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["client", "admin"]);

export const usersTable = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("client"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    usersEmailUniqueIdx: uniqueIndex("users_email_unique_idx").on(table.email),
    usersRoleIdx: index("users_role_idx").on(table.role),
  }),
);

export const sessionsTable = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    sessionsTokenUniqueIdx: uniqueIndex("sessions_token_unique_idx").on(
      table.token,
    ),
    sessionsUserIdIdx: index("sessions_user_id_idx").on(table.userId),
    sessionsExpiresAtIdx: index("sessions_expires_at_idx").on(table.expiresAt),
  }),
);

export const usersRelations = relations(usersTable, ({ many }) => ({
  sessions: many(sessionsTable),
}));

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessionsTable.userId],
    references: [usersTable.id],
  }),
}));

export const insertUserSchema = createInsertSchema(usersTable);
export const insertSessionSchema = createInsertSchema(sessionsTable);

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessionsTable.$inferSelect;
