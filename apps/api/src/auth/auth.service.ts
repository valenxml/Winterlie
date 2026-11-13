import { BadRequestException, ConflictException, HttpException, Injectable, UnauthorizedException } from "@nestjs/common";
import type { LoginInput, RegisterInput } from "@workshop/validators";
import { PrismaService } from "../prisma.service.js";
import { CreditsService } from "../credits/credits.service.js";
import { SIGNUP_BONUS } from "../credits/credits.logic.js";
import { hashPassword, verifyPassword } from "./password.js";
import { codeMatches, cooldownRemaining, generateCode, hashCode, isExpired, OTP_MAX_ATTEMPTS, OTP_TTL_MS } from "./otp.logic.js";
import { sendOtpEmail } from "./mailer.js";

/** Same message for unknown email and wrong password, so accounts cannot be enumerated. */
const BAD_CREDENTIALS = "Email atau password salah";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly credits: CreditsService,
  ) {}

  private secret(): string {
    const value = process.env.AUTH_SECRET ?? "";
    if (value.length < 32) throw new Error("AUTH_SECRET must be set to at least 32 characters");
    return value;
  }

  /** Step 1 of sign-up: stores a hashed code and the pending details, then emails the code. */
  async requestRegisterOtp(input: RegisterInput) {
    const exists = await this.prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
    if (exists) throw new ConflictException("Email sudah terdaftar");

    const last = await this.prisma.emailOtp.findFirst({
      where: { email: input.email, purpose: "register" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    const wait = cooldownRemaining(last?.createdAt ?? null, Date.now());
    if (wait > 0) {
      throw new HttpException(
        { message: `Tunggu ${Math.ceil(wait / 1000)} detik sebelum meminta kode baru` },
        429,
      );
    }

    const code = generateCode();
    await this.prisma.emailOtp.create({
      data: {
        email: input.email,
        purpose: "register",
        codeHash: hashCode(code, input.email, this.secret()),
        pendingName: input.name ?? null,
        pendingHash: await hashPassword(input.password),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });
    await sendOtpEmail(input.email, code);

    const devMode = process.env.AUTH_DEV_BYPASS === "true" && process.env.NODE_ENV !== "production";
    return {
      sent: true,
      expiresInSeconds: OTP_TTL_MS / 1000,
      // Development only, so tests can finish without email. Never returned in production.
      ...(devMode ? { devCode: code } : {}),
    };
  }

  /** Step 2 of sign-up: checks the code, creates the account, and returns the user. */
  async verifyRegisterOtp(email: string, code: string) {
    const otp = await this.prisma.emailOtp.findFirst({
      where: { email, purpose: "register", consumedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (!otp) throw new BadRequestException("Kode tidak ditemukan. Minta kode baru.");
    if (isExpired(otp.expiresAt)) throw new BadRequestException("Kode sudah kedaluwarsa. Minta kode baru.");
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new HttpException({ message: "Terlalu banyak percobaan. Minta kode baru." }, 429);
    }

    if (!codeMatches(code, email, this.secret(), otp.codeHash)) {
      await this.prisma.emailOtp.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
      throw new BadRequestException("Kode salah");
    }

    // Consume the code atomically, so a double submit cannot create two accounts.
    const consumed = await this.prisma.emailOtp.updateMany({
      where: { id: otp.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    if (consumed.count !== 1) throw new BadRequestException("Kode sudah dipakai");
    if (!otp.pendingHash) throw new BadRequestException("Pendaftaran tidak lengkap. Daftar ulang.");

    const exists = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) throw new ConflictException("Email sudah terdaftar");

    const user = await this.prisma.user.create({
      data: { email, name: otp.pendingName, passwordHash: otp.pendingHash },
      select: { id: true, email: true, name: true },
    });
    await this.credits.grant(user.id, SIGNUP_BONUS, `signup:${user.id}`);
    return user;
  }

  async login(input: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, email: true, name: true, passwordHash: true },
    });
    // Always run one hash check, even for unknown emails, so response time does not reveal accounts.
    const ok = await verifyPassword(input.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !user.passwordHash || !ok) throw new UnauthorizedException(BAD_CREDENTIALS);
    return { id: user.id, email: user.email, name: user.name };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true } });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  /** Signs in with a verified Google email. Links to an existing account with that email, or creates one. */
  async loginWithGoogle(email: string, name?: string): Promise<{ id: string; email: string; name: string | null }> {
    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });
    if (existing) return existing;

    const user = await this.prisma.user.create({
      data: { email, name: name ?? null, passwordHash: null },
      select: { id: true, email: true, name: true },
    });
    await this.credits.grant(user.id, SIGNUP_BONUS, `signup:${user.id}`);
    return user;
  }
}

/** A valid scrypt hash of a random string. Only used to burn equal time on unknown emails. */
const DUMMY_HASH = "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$" + Buffer.alloc(64).toString("base64");
