// QR code generation for templates with a qrField (e.g. ID card). Pure JS,
// returns a PNG data URL ready to embed in HTML preview and PDF alike.
import QRCode from "qrcode";

export async function qrDataUrl(text: string): Promise<string | undefined> {
  const value = (text ?? "").trim();
  if (!value) return undefined;
  try {
    return await QRCode.toDataURL(value, { margin: 1, width: 200, errorCorrectionLevel: "M" });
  } catch {
    return undefined;
  }
}
