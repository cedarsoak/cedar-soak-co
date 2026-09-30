import QRCode from "qrcode";

/** An SVG QR code for a link (null if it can't be made). */
export async function qrSvg(text: string): Promise<string | null> {
  try {
    return await QRCode.toString(text, { type: "svg", margin: 1, color: { dark: "#1E1712", light: "#FFFFFF" } });
  } catch (err) {
    console.error("qr code failed", err);
    return null;
  }
}
