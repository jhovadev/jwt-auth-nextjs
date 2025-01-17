import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { errors, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const REFRESH_SECRET = new TextEncoder().encode(
	process.env.JWT_REFRESH_SECRET!
);

export async function verifyAccessToken(
	token: string,
	secret: Uint8Array,
	type: "access" | "refresh"
): Promise<{
	valid: boolean;
	errorType?: "expired" | "invalid" | "unknown" | "";
}> {
	try {
		await jwtVerify(token, secret);
		return { valid: true, errorType: "" };
	} catch (error) {
		console.error("Error al verificar el token: ", error);
		if (error instanceof errors.JWTExpired) {
			if (type === "refresh") return { valid: false, errorType: "expired" };

			return { valid: false, errorType: "expired" };
		} else if (error instanceof errors.JWTInvalid) {
			return { valid: false, errorType: "invalid" };
		} else {
			return { valid: false, errorType: "unknown" };
		}
	}
}
export async function middleware(request: NextRequest) {
	try {
		const accessToken = request.cookies.get("accessToken")?.value;
		const refreshToken = request.cookies.get("refreshToken")?.value;

		// sí el access token existe y el refresh token no
		if (accessToken || refreshToken) {
			const accessTokenValidation = await verifyAccessToken(
				accessToken!,
				SECRET,
				"access"
			);
			const refreshTokenValidation = await verifyAccessToken(
				refreshToken!,
				REFRESH_SECRET,
				"refresh"
			);

			console.log("accessTokenValidation: ", accessTokenValidation);
			console.log("refreshTokenValidation: ", refreshTokenValidation);
			if (accessTokenValidation.valid) {
				return NextResponse.next();
			}

			if (!accessTokenValidation.valid && refreshTokenValidation.valid) {
				console.log("Refresco de Token");
				const url = new URL("/api/v1/jwt/refresh", request.url);
				const response = await fetch(url, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						refreshToken,
					}),
				});
				const data = await response.json();
				console.log(data);

				if (response.status === 401)
					return NextResponse.redirect(new URL("/jwt", request.url));

				const res = NextResponse.next();
				res.cookies.set("accessToken", data.accessToken, {
					httpOnly: true,
					secure: process.env.NODE_ENV === "production",
					sameSite: "strict",
					maxAge: 60 * 2,

					path: "/",
				});
				return res;
			}

			if (!accessTokenValidation.valid && !refreshTokenValidation.valid) {
				return NextResponse.redirect(new URL("/jwt", request.url));
			}
		}
		return NextResponse.redirect(new URL("/jwt", request.url));
	} catch (error) {
		console.error("Error in middleware:", error);
		return NextResponse.json({ message: "Internal Server Error", status: 500 });
	}
}

//Matching Path
export const config = {
	matcher: "/home/:path*",
};

/*
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// el access token existe y es válido
// el access token no existe o es inválido
// el access token no existe y el refresh token no existe
// el access token no existe y el refresh token es válido
// el access token no existe y el refresh token es inválido
// el access token no existe y el refresh token expira
// el access token si existe y el refresh token expira
// el access token si existe y el refresh token no expira

export async function middleware(request: NextRequest) {
	try {
		const accessToken = request.cookies.get("accessToken")?.value;
		const refreshToken = request.cookies.get("refreshToken")?.value;

		

		// sí el access token existe y el refresh token no
		if (accessToken || refreshToken) {
			const url = new URL("/api/v1/jwt/verify", request.url);
			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					accessToken,
					refreshToken,
				}),
			});

			const data = await response.json();

			console.log("Verification Result: ", data);

			if (data.accessToken) {
				return NextResponse.next();
			}

			if ((!data.accessToken && data.refreshToken) || data.status === 200) {
				console.log("Refresco de Token");
				const url = new URL("/api/v1/jwt/refresh", request.url);
				const response = await fetch(url, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						refreshToken,
					}),
				});
				const data = await response.json();
				console.log(data);

				if (response.status === 401)
					return NextResponse.redirect(new URL("/jwt", request.url));

				const res = NextResponse.next();
				res.cookies.set("accessToken", data.accessToken, {
					httpOnly: true,
					secure: process.env.NODE_ENV === "production",
					sameSite: "strict",
					maxAge: 60 * 1,

					path: "/",
				});
				return res;
			}

			if (response.status === 401) {
				return NextResponse.redirect(new URL("/jwt", request.url));
			}
		}
		return NextResponse.redirect(new URL("/jwt", request.url));
	} catch (error) {
		console.error("Error in middleware:", error);
		return NextResponse.json({ message: "Internal Server Error", status: 500 });
	}
}

//Matching Path
export const config = {
	matcher: "/home/:path*",
};
*/
