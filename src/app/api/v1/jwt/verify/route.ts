"use server";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, errors } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const REFRESH_SECRET = new TextEncoder().encode(
	process.env.JWT_REFRESH_SECRET!
);

// Manejo de la solicitud POST
export async function POST(req: NextRequest) {
	try {
		const { accessToken, refreshToken } = await req.json();

		/* status: 401,
		message: `Refresh token ${refreshTokenResult.errorType}`,
		refreshTokenValid: false,
		errorType: refreshTokenResult.errorType */
	} catch (error) {
		console.error("Error in verifyToken middleware:", error);
		return NextResponse.json({
			status: 500,
			message: error,
		});
	}
}
