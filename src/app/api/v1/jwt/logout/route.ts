import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import db from "@/db";
import { sessionTable } from "@/db/schema";

// Función de logout
export async function POST(req: NextRequest) {
	try {
		// Eliminar la cookie del access token
		const res = NextResponse.json({
			message: "Logout successful",
			status: 200,
		});

		// Elimina la cookie "accessToken" (o el nombre que hayas usado)
		res.cookies.set("accessToken", "", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production", // Asegúrate de usar 'secure' en producción
			path: "/", // Asegúrate de que coincida con el path de la cookie
			expires: new Date(0), // Establece la fecha de expiración a 0 para eliminar la cookie
		});

		// También, si estás usando refresh tokens almacenados en la base de datos, puedes eliminarlo
		// Deberías obtener el refresh token de alguna forma, por ejemplo, en las cookies o la sesión
		const refreshToken = req.cookies.get("refreshToken")?.value;

		if (refreshToken) {
			// Elimina el refresh token de la base de datos
			await db
				.delete(sessionTable)
				.where(eq(sessionTable.refresh_token, refreshToken));
		}

		return res;
	} catch (error) {
		console.error("Error during logout:", error);
		return NextResponse.json({ message: "Internal Server Error", status: 500 });
	}
}
