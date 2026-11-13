/**
 * Sends the verification code by email through Resend (https://resend.com).
 * In development without RESEND_API_KEY, the code is printed to the API console instead.
 * In production, a missing key is an error: codes are never written to logs there.
 */
export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? "Winterlie <onboarding@resend.dev>";

  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Pengiriman email belum dikonfigurasi");
    }
    console.warn(`[mail:dev] RESEND_API_KEY kosong. Kode untuk ${to}: ${code}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Kode verifikasi Winterlie",
      html: `<p>Kode verifikasi kamu: <b style="font-size:20px;letter-spacing:4px">${code}</b></p><p>Berlaku 10 menit. Jika kamu tidak mendaftar, abaikan email ini.</p>`,
    }),
  });
  if (!res.ok) throw new Error(`Gagal mengirim email (${res.status})`);
}
