// Libraries
// @oslojs/jwt | jose | bcrypt | argon2
import db from "@/db";
import {
	userTable,
	roleTable,
	sessionTable,
	UserSelectSchema,
	UserInsertSchema,
	SessionInsertSchema,
	SessionSelectSchema,
	userRelations,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { SignJWT, JWTPayload, errors, jwtVerify } from "jose";
import { encodeBase64 } from "@oslojs/encoding";
import { decodeJWT } from "@oslojs/jwt";
import { z } from "zod";

// .env variables
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const REFRESH_SECRET = new TextEncoder().encode(
	process.env.JWT_REFRESH_SECRET!
);

export async function getUserByIdFromDb(id: number) {
	return await db.query.userTable.findFirst({
		where: eq(userTable.id, id),
		with: {
			role: true,
			sessions: true,
		},
	});

	/* return await db
		.select({
			id: userTable.id,
			username: userTable.username,
			email: userTable.email,
			role: roleTable.name,
			description: roleTable.description,
			expiresAt: sessionTable.expiresAt,
		})
		.from(userTable)
		.where(eq(userTable.id, id))
		.leftJoin(sessionTable, eq(sessionTable.userId, userTable.id))
		.innerJoin(roleTable, eq(roleTable.id, userTable.roleId)); */
}

export async function insertUser(user: z.infer<typeof UserInsertSchema>) {
	try {
		console.log("Insertando Usuario");
		console.log(user);

		const validatedData = UserInsertSchema.safeParse(user);
		console.log(validatedData);

		if (!validatedData.success) throw new Error("Validation failed");
		return await db.insert(userTable).values(validatedData.data).returning({
			id: userTable.id,
		});
	} catch (error) {
		console.error("Error al insertar usuario:", error);
	}
}

export async function insertSession(
	session: z.infer<typeof SessionInsertSchema>
) {
	try {
		console.log("Insertando Sesión");
		console.log(session);

		const validatedData = SessionInsertSchema.safeParse(session);
		console.log(validatedData);

		if (!validatedData.success) throw new Error("Validation failed");

		return await db.insert(sessionTable).values(validatedData.data).returning({
			id: sessionTable.id,
		});
	} catch (error) {
		console.error("Error al insertar sesión:", error);
	}
}

export async function getSessionByUserIdFromDb(id: number) {
	return await db
		.select({
			id: sessionTable.id,
			userId: sessionTable.userId,
			refresh_token: sessionTable.refresh_token,
			expiresAt: sessionTable.expiresAt,
		})
		.from(sessionTable)
		.where(eq(userTable.id, id))
		.innerJoin(sessionTable, eq(sessionTable.id, userTable.roleId));
}

export async function getUserByUsernameFromDb(id: number) {
	return await db
		.select({
			id: userTable.id,
			username: userTable.username,
			email: userTable.email,
			role: roleTable.name,
			description: roleTable.description,
		})
		.from(userTable)
		.where(eq(userTable.id, id))
		.innerJoin(roleTable, eq(userTable.roleId, roleTable.id));
}

export async function getUserByEmailFromDb(email: string) {
	return await db
		.select({
			id: userTable.id,
			username: userTable.username,
			password: userTable.password,
			email: userTable.email,
			role: roleTable.name,
			description: roleTable.description,
		})
		.from(userTable)
		.where(eq(userTable.email, email))
		.innerJoin(roleTable, eq(userTable.roleId, roleTable.id));
}
export interface JWTCustomPayload extends JWTPayload {
	id?: number;
}

export interface ValidationResult {
	payload?: JWTCustomPayload;
	errorType?: "expired" | "invalid" | "unknown";
}

export async function validateToken({
	token,
	secret,
}: {
	token: string;
	secret: Uint8Array;
}): Promise<ValidationResult> {
	try {
		// Verificar el token
		const { payload } = await jwtVerify(token, secret);
		return { payload: payload as JWTCustomPayload };
	} catch (error) {
		if (error instanceof errors.JWTExpired) {
			console.info("Token expirado");
			const payload = decodeJWT(token);
			return {
				payload: payload as JWTCustomPayload,
				errorType: "expired",
			};
		} else if (error instanceof errors.JWTInvalid) {
			console.info("Token inválido");
			return { errorType: "invalid" };
		} else {
			console.error("Error desconocido al verificar el token", error);
			return { errorType: "unknown" };
		}
	}
}

export async function generateAccessToken(id: number) {
	const payload: JWTCustomPayload = {
		id,
	};

	return await new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("2m")
		.sign(SECRET);
}

export async function generateRefreshToken(id: number) {
	/* const id_: Uint8Array = new TextEncoder().encode(String(id)); */
	const refreshPayload: JWTCustomPayload = {
		id,
	};
	return await new SignJWT(refreshPayload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("5m")
		.sign(REFRESH_SECRET);
}

export async function refreshAccessToken(refreshToken: string) {
	try {
		// Verificar si el Refresh Token ha expirado
		const refreshTokenPayload = (await validateToken({
			token: refreshToken,
			secret: REFRESH_SECRET,
		})) as JWTCustomPayload;
		if (!refreshTokenPayload) throw new Error("Refresh Token inválido");

		const id = refreshTokenPayload.id;
		if (!id) throw new Error("id is missing in token payload");
		const user = await getUserByIdFromDb(id);
		if (!user) return { errorType: "userNotFound" };

		const newAccessToken = await generateAccessToken(id);
		return {
			accessToken: newAccessToken,
		};
	} catch (error) {
		console.error("Error al procesar el proceso de refresco de tokens:", error);
	}
}
export async function jwt_(id: number) {
	try {
		// Generar Access Token y Refresh Token
		const accessToken = await generateAccessToken(id);
		const refreshToken = await generateRefreshToken(id);
		return {
			accessToken,
			refreshToken,
		};
	} catch (error) {
		console.log("Error al procesar la creación de tokens:");
		throw error; // Propagar el error
	}
}

// Fake database
/* const users = [
		{
			email: "admin001@example.com",
			username: "admin",
			password:
				"$argon2id$v=19$m=65536,t=3,p=4$fCcutPmN3OGGAQSwVlAT4w$iYjbl2uG8lvhEyuPKdwlz7WrDamrQo2S8G1eSHJ5Hi4", // Contraseña hasheada de '12345'
			role: "admin",
		},
		{
			email: "johndoe@example.com",
			username: "john",
			password:
				"$argon2id$v=19$m=65536,t=3,p=4$hC9MutPObo+6Vn3BxXpVBg$b6SaQerNIgnwogx28ujvIUrpUtDs3HexR3aXsSD2nzA", // Contraseña hasheada de 'doe123'
			role: "user",
		},
	];
	return users.find((u) => u.email === email) || null; */
