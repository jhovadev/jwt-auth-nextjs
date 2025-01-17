import { getUserByIdFromDb } from "@/utils/jwt_";
import { parseJWT } from "@oslojs/jwt";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
	try {
		const token =
			req.cookies.get("accessToken")?.value ||
			req.cookies.get("accessToken")?.value;
		const [_, payload] = parseJWT(token!) as [
			header: object,
			payload: { id: number },
			signature: Uint8Array,
			signatureMessage: Uint8Array,
		];

		const user = await getUserByIdFromDb(payload?.id);
		console.log("user: ", user);
		return NextResponse.json({
			message: "User Found",
			status: 200,
			user,
		});
	} catch (error) {
		console.log(error);
		if (error instanceof TypeError)
			return NextResponse.json({
				status: 400,
				message: error,
			});
		return NextResponse.json({
			status: 500,
			message: "Internal Server Error",
		});
	}
}

// ! función para mostrar tiempo de expiración de token
