"use server";
import { NextRequest, NextResponse } from "next/server";
import { verify } from "@node-rs/argon2";
import {
	getUserByEmailFromDb,
	insertSession,
	jwt_,
	JWT_EXPIRES_IN,
	JWT_REFRESH_EXPIRES_IN,
} from "@/utils/jwt_";

export async function POST(req: NextRequest) {
	try {
		const { email, password } = await req.json();
		console.log(email, password);

		const users = await getUserByEmailFromDb(email);
		if (!users.length)
			return Response.json({ errorType: "userNotFound", status: 404 });
		const user = users[0];
		const isValid = await verify(user.password, password);
		if (!isValid)
			return Response.json({ errorType: "invalidPassword", status: 401 });
		// Generar Access Token y Refresh Token
		const { accessToken, refreshToken } = await jwt_(user.id);

		// Crear la respuesta con cookies
		const res = NextResponse.json({
			message: "authentication successful",
			status: 200,
		});

		res.cookies.set("accessToken", accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: JWT_EXPIRES_IN,
			path: "/",
		});

		res.cookies.set("refreshToken", refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: JWT_REFRESH_EXPIRES_IN,
			path: "/",
		});
		// insertar session

		const session = await insertSession({
			userId: user.id,
			refresh_token: refreshToken,
			expiresAt: new Date(Date.now() + JWT_REFRESH_EXPIRES_IN * 1000),
		});

		console.log("Session Creada: ", session);

		return res;
	} catch (error) {
		if (error instanceof SyntaxError) {
			return Response.json({
				message: "Invalid json body",
				errorType: "invalid",
				status: 400,
			});
		}

		console.log(error);
		return Response.json({ errorType: "unknown", status: 500 });
	}
}
