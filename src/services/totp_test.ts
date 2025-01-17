/* import { config } from "dotenv";
import QRCode from "qrcode";
import { generateTOTP, verifyTOTP, createTOTPKeyURI } from "@oslojs/otp";
// Cargar variables de entorno desde .env.local
config({ path: ".env.local" });
const secretKey = process.env.SECRET_KEY;

const issuer = "TOTP Authentication Example";
const intervalInSeconds = 30;
const digits = 6;

const accountName = "ramiro";

const enable2FA = (accountName: string) => {
    const secret: Uint8Array = new TextEncoder().encode(secretKey + accountName);
    console.log("secret:", secret);
    const uri = createTOTPKeyURI(
        issuer,
        accountName,
        secret,
        intervalInSeconds,
        digits
    );
    console.log("uri:", uri);
    // Generate the QR code for the TOTP key URI
    QRCode.toString(uri, { type: "terminal", small: true }, function (err, url) {
        console.log(url);
    });

    return secret;
};

const user_secret = enable2FA(accountName);

const validateTOTP = (accountName: string, user_secret: Uint8Array) => {
    console.log("user_secret:", user_secret);
    const totp = generateTOTP(user_secret, intervalInSeconds, digits);
    const valid = verifyTOTP(user_secret, intervalInSeconds, digits, totp);
    console.log(`TOTP: ${totp}`);
    console.log(`Es válido: ${valid}`);
};
const fake_uint8array = new Uint8Array([ 98, 97, 116, 109, 97, 110, 49, 50, 51, 52, 53, 54, 64, 64, 64, 114, 97, 109, 105, 114, 111 ]);

validateTOTP(accountName, user_secret);
validateTOTP("accountName", fake_uint8array);
 */
