import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import {
	int,
	sqliteTable,
	text,
	integer,
	index,
} from "drizzle-orm/sqlite-core";

export const userTable = sqliteTable("user", {
	id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
	username: text("username").notNull().unique(),
	password: text("password").notNull(),
	email: text("email").notNull().unique(),
	roleId: integer("role_id") // Reemplazamos "role" con "roleId"
		.notNull()
		.references(() => roleTable.id, {
			onDelete: "set null",
			onUpdate: "cascade",
		}),
	createdAt: integer("created_at", {
		mode: "timestamp",
	}).notNull(),
	updatedAt: integer("updated_at", {
		mode: "timestamp",
	}).notNull(),
});

export const sessionTable = sqliteTable("session", {
	id: integer("id").primaryKey({ autoIncrement: true }).notNull(),
	userId: integer("user_id")
		.notNull()
		.references(() => userTable.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
	refresh_token: text("refresh_token").notNull(),
	expiresAt: integer("expires_at", {
		mode: "timestamp",
	}).notNull(),
});

export const roleTable = sqliteTable("role", {
	id: integer("role_id").primaryKey({ autoIncrement: true }).notNull(),
	name: text().notNull().unique(), // El nombre del rol, por ejemplo "admin", "user", etc.
	description: text().notNull(), // Descripción del rol, por ejemplo "El rol de administrador"
});

export const rolePermissionTable = sqliteTable("role_permission", {
	roleId: integer("role_id")
		.notNull()
		.references(() => roleTable.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
	permissionId: integer("permission_id")
		.notNull()
		.references(() => permissionTable.id, {
			onDelete: "cascade",
			onUpdate: "cascade",
		}),
});

export const permissionTable = sqliteTable("permission", {
	id: integer("permission_id").primaryKey({ autoIncrement: true }).notNull(),
	name: text().notNull().unique(), // Nombre del permiso, por ejemplo "CREATE_USER", "VIEW_REPORT"
	description: text().notNull(), // Descripción opcional
});

// Relations
export const userRelations = relations(userTable, ({ one, many }) => ({
	role: one(roleTable, {
		fields: [userTable.roleId],
		references: [roleTable.id],
	}),
	sessions: many(sessionTable),
}));

export const sessionRelations = relations(sessionTable, ({ one, many }) => ({
	user: one(userTable, {
		fields: [sessionTable.userId],
		references: [userTable.id],
	}),
}));

export const roleRelations = relations(roleTable, ({ one, many }) => ({
	permission: many(rolePermissionTable),
}));

export const rolePermissionRelations = relations(
	rolePermissionTable,
	({ one }) => ({
		role: one(roleTable, {
			fields: [rolePermissionTable.roleId],
			references: [roleTable.id],
		}),
		permission: one(permissionTable, {
			fields: [rolePermissionTable.permissionId],
			references: [permissionTable.id],
		}),
	})
);

// Export Tipes

// Select Schemas
export const UserSelectSchema = createSelectSchema(userTable);
export const SessionSelectSchema = createSelectSchema(sessionTable);
export const RoleSelectSchema = createSelectSchema(roleTable);
export const RolePermissionSelectSchema =
	createSelectSchema(rolePermissionTable);
export const PermissionSelectSchema = createSelectSchema(permissionTable);

// Insert Schemas
export const UserInsertSchema = createInsertSchema(userTable);
export const SessionInsertSchema = createInsertSchema(sessionTable);
