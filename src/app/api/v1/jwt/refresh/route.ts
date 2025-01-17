"use server";
import { NextRequest, NextResponse } from "next/server";
import { parseJWT } from "@oslojs/jwt";
import {
	generateAccessToken,
	getUserByIdFromDb,
	refreshAccessToken,
} from "@/utils/jwt_";
import db from "@/db";
import { sessionTable } from "@/db/schema";
import { eq } from "drizzle-orm";

// Función para verificar el refresh token en la base de datos
async function verifyRefreshTokenInDb(refreshToken: string) {
	const session = await db.query.sessionTable.findFirst({
		where: eq(sessionTable.refresh_token, refreshToken),
	});

	console.log("session: ", session);

	if (!session || session.expiresAt < new Date()) {
		if (session) {
			await db.delete(sessionTable).where(eq(sessionTable.id, session.id));
			return false;
		}
		return false;
	}

	return true;
}

export async function POST(req: NextRequest) {
	try {
		/* const refreshToken = req.cookies.get("refreshToken")?.value; */
		const { refreshToken } = await req.json();
		const [_, payload] = parseJWT(refreshToken!) as [
			header: object,
			payload: { id: number },
			signature: Uint8Array,
			signatureMessage: Uint8Array,
		];
		console.log(payload);
		const id = payload.id;
		if (!id) return NextResponse.json({ status: 401, message: "Id not found" });
		const user = await getUserByIdFromDb(id);
		if (!user)
			return NextResponse.json({ status: 401, message: "User not found" });
		if (!(await verifyRefreshTokenInDb(refreshToken)))
			return NextResponse.json({
				message: "Refresh Token no válido o expirado",
				status: 401,
			});

		const newAccessToken = await generateAccessToken(id);

		return NextResponse.json({ accessToken: newAccessToken, status: 200 });
	} catch (error) {
		console.error("Error in middleware:", error);
		return NextResponse.json({ message: "Internal Server Error", status: 500 });
	}
}

/* 	// verificar el token
	const accessTokenResult = (await validateToken({
		token: accessToken,
		secret: SECRET,
	})) as ValidationResult;
	if (
		accessTokenResult.errorType === "invalid" ||
		accessTokenResult.errorType === "unknown"
	) {
		return Response.json({ errorType: "invalidToken", status: 401 });
	}

	if (accessTokenResult.errorType === "expired") {
		console.log(
			"El token ha expirado, se procederá a verificar el refresh token."
		);
	}

	const email = accessTokenResult.payload?.email;
	if (!email) return Response.json({ errorType: "emailMissing", status: 400 });
	const user = await getUserByEmailFromDb(email);
	if (!user) return Response.json({ errorType: "userNotFound", status: 404 });

	// Verificar si el Refresh Token ha expirado
	const refreshTokenPayload = (await validateToken({
		token: refreshToken,
		secret: REFRESH_SECRET,
	})) as JWTCustomPayload;
	if (!refreshTokenPayload) throw new Error("Refresh Token inválido");

	const newAccessToken = await generateAccessToken(user);

	return Response.json({ accessToken: newAccessToken, status: 200 }); */
