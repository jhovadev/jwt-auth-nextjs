import QRCode from "qrcode";
import { NextRequest } from "next/server";
import { enable2FA } from "@/utils/totp";
import { encodeBase32UpperCase } from "@oslojs/encoding";

export async function POST(req: NextRequest) {
	const { accountName } = await req.json();

	const token = enable2FA(accountName);

	const data = await QRCode.toDataURL(token.uri);

	const encoded = encodeBase32UpperCase(token.secret);

	return Response.json({ data, secret: encoded, status: 200 });
}
