// Libraries
// @oslojs/jwt | jose | bcrypt | argon2

// openssl rand -hex 32
// openssl rand -base64 32
// 220ac0c787eb23495a79b7e05961fe38543d3c83d7b09ee1040127dfe10feab2

import { SignJWT, JWTPayload, errors, jwtVerify } from "jose";
import { decodeJWT, JWTRegisteredClaims } from "@oslojs/jwt";
import * as argon2 from "argon2";

import { encodeBase64, decodeBase64 } from "@oslojs/encoding";
import { is } from "drizzle-orm";
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const REFRESH_SECRET = new TextEncoder().encode(
	process.env.JWT_REFRESH_SECRET!
);

/*
async function storeRefreshToken(userId: string, refreshToken: string) {
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + 30); // 30 días de expiración

	// Insertar el refresh token en la base de datos
	// Aquí estamos usando un ORM de ejemplo
	await db.sesiones.create({
		data: {
			userId,
			refreshToken,
			expiresAt,
		},
	});
}
*/

declare module "Jose" {
	interface JWTPayload {
		username?: string;
		email?: string;
		role?: string;
	}
}

async function getUserByEmailFromDb(email: string) {
	const users = [
		{
			email: "admin001@example.com",
			username: "admin",
			password:
				"$argon2id$v=19$m=65536,t=3,p=4$fCcutPmN3OGGAQSwVlAT4w$iYjbl2uG8lvhEyuPKdwlz7WrDamrQo2S8G1eSHJ5Hi4", // Contraseña hasheada de '12345'
			role: "admin",
		},
		{
			email: "johnDoe@example.com",
			username: "john",
			password:
				"$argon2id$v=19$m=65536,t=3,p=4$hC9MutPObo+6Vn3BxXpVBg$b6SaQerNIgnwogx28ujvIUrpUtDs3HexR3aXsSD2nzA", // Contraseña hasheada de 'doe123'
			role: "user",
		},
	];
	return users.find((u) => u.email === email) || null;
}
interface ValidationResult {
	payload?: JWTPayload;
	errorType?: "expired" | "invalid" | "unknown";
}

async function validateToken({
	token,
	secret,
}: {
	token: string;
	secret: Uint8Array;
}): Promise<ValidationResult> {
	try {
		// Verificar el token
		const { payload } = await jwtVerify(token, secret);
		return { payload: payload as JWTPayload };
	} catch (error) {
		if (error instanceof errors.JWTExpired) {
			console.info("Token expirado");
			const payload = decodeJWT(token);
			return {
				payload: payload as JWTPayload,
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

async function generateAccessToken({
	username,
	email,
	role,
}: {
	username: string;
	email: string;
	role: string;
}) {
	const payload: JWTPayload = {
		username,
		email,
		role,
	};

	return await new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("4s")
		.sign(SECRET);
}

async function generateRefreshToken({
	email,
	username,
}: {
	email: string;
	username: string;
}) {
	const id: Uint8Array = new TextEncoder().encode(`${email}:${username}`);
	const refreshPayload: JWTPayload = {
		sub: encodeBase64(id),
	};
	return await new SignJWT(refreshPayload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("5m")
		.sign(REFRESH_SECRET);
}

async function refreshAccessToken(accessToken: string, refreshToken: string) {
	try {
		// verificar el token
		const accessTokenResult = (await validateToken({
			token: accessToken,
			secret: SECRET,
		})) as ValidationResult;
		if (
			accessTokenResult.errorType === "invalid" ||
			accessTokenResult.errorType === "unknown"
		) {
			throw new Error("Token inválido");
		}

		if (accessTokenResult.errorType === "expired") {
			console.log(
				"El token ha expirado, se procederá a verificar el refresh token."
			);
		}

		const email = accessTokenResult.payload?.email;
		if (!email) throw new Error("Email is missing in token payload");
		const user = await getUserByEmailFromDb(email);
		if (!user) throw new Error("Usuario no encontrado");

		// Verificar si el Refresh Token ha expirado
		const refreshTokenPayload = (await validateToken({
			token: refreshToken,
			secret: REFRESH_SECRET,
		})) as JWTPayload;
		if (!refreshTokenPayload) throw new Error("Refresh Token inválido");

		// Verificar que el Refresh Token existe en la base de datos
		/* 	const session = await db.sesiones.findUnique({
            where: { refreshToken },
        }); 
    
        if (!session || session.expiresAt < new Date()) {
            throw new Error("Refresh Token no válido o expirado");
        }
    
        // Obtener los datos del usuario asociados al Refresh Token
        const { userId, role } = session; // Aquí deberíamos obtener la información del usuario desde la base de datos
        */

		// una vez verificado los tokens podemos generar el nuevo access token
		const newAccessToken = await generateAccessToken(user);
		return {
			accessToken: newAccessToken,
		};
	} catch (error) {
		console.error("Error al procesar el proceso de refresco de tokens:", error);
	}
}
async function jwt_({
	email,
	username,
	role,
}: {
	email: string;
	username: string;
	role: string;
}) {
	try {
		// Generar Access Token y Refresh Token
		const accessToken = await generateAccessToken({
			username,
			role,
			email,
		});
		const refreshToken = await generateRefreshToken({
			email,
			username,
		});
		return {
			accessToken,
			refreshToken,
		};
	} catch (error) {
		console.log("Error al procesar la creación de tokens:");
		throw error; // Propagar el error
	}
}

async function login(email: string, password: string) {
	try {
		const user = await getUserByEmailFromDb(email);
		if (!user) throw new Error("Usuario no encontrado");
		const isValid = await argon2.verify(user.password, password);
		if (!isValid) throw new Error("Credenciales Incorrectas");

		// Generar Access Token y Refresh Token
		const jwt_t = await jwt_(user);
		return jwt_t;
	} catch (error) {
		/* console.log("Error al procesar el login:", error); */
		throw error; // Propagar el error
	}
}

const main = async () => {
	const admin = await login("johnDoe@example.com", "doe123");
	const john = await login("admin001@example.com", "12345");
	console.log(admin);
	setTimeout(async () => {
		const validationResult = await validateToken({
			token: admin.accessToken,
			secret: SECRET,
		});

		console.log(validationResult);

		console.log(
			await refreshAccessToken(admin.accessToken, admin.refreshToken)
		);
		/* console.log(
			"\n--- Usando Refresh Token para obtener un nuevo Access Token ---"
		);
		try {
			const newAccessToken = await refreshAccessToken(admin.refreshToken);
			console.log("Nuevo Access Token: ", newAccessToken);
		} catch (error) {
			console.log(error);
		} */
	}, 6000); // Simular después de 6 segundos
};

main();
