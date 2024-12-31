import QRCode from "qrcode";
import { generateTOTP, verifyTOTP, createTOTPKeyURI } from "@oslojs/otp";
import crypto from "crypto";

const issuer = "TOTP Authentication Example";
const intervalInSeconds = 30;
const digits = 6;

// Función para generar y habilitar la autenticación TOTP para un usuario
export const enable2FA = (accountName: string) => {
	// Generar un secreto aleatorio único para cada usuario (usando un valor aleatorio)
	const randomBytes = crypto.randomBytes(20); // Genera 20 bytes aleatorios
	const secret: Uint8Array = randomBytes;

	console.log("secret:", secret);

	// Crear el URI para el TOTP
	const uri = createTOTPKeyURI(
		issuer,
		accountName,
		secret, // Usamos el secreto aleatorio generado para cada usuario
		intervalInSeconds,
		digits
	);
	console.log("uri:", uri);

	// Generar el código QR que el usuario puede escanear
	QRCode.toString(uri, { type: "terminal", small: true }, function (err, url) {
		if (err) {
			console.error("Error generando QR:", err);
		} else {
			console.log("Escanea este QR Code en tu aplicación 2FA:", url);
		}
	});

	return { uri, secret };
};

// Función para validar el TOTP generado
export const validateTOTP = (user_secret: Uint8Array, token: string) => {
	// Generar el TOTP actual
	const totp = generateTOTP(user_secret, intervalInSeconds, digits);
	console.log(totp);
	// Verificar el TOTP
	const valid = verifyTOTP(user_secret, intervalInSeconds, digits, token);
	return valid;
};
