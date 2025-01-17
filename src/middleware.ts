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
