import { type NextRequest } from "next/server";
import { decodeBase32 } from "@oslojs/encoding";
import { validateTOTP } from "@/utils/totp";

export async function POST(req: NextRequest) {
	const { secret, token } = await req.json();

	const decoded = decodeBase32(secret);
	const verified = validateTOTP(decoded, token);

	return Response.json({
		verified,
	});
}
