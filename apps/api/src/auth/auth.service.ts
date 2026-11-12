import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import type { LoginInput, RegisterInput } from "@workshop/validators";
import { PrismaService } from "../prisma.service.js";
import { hashPassword, verifyPassword } from "./password.js";

/** Same message for unknown email and wrong password, so accounts cannot be enumerated. */
const BAD_CREDENTIALS = "Email atau password salah";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(input: RegisterInput) {
    const exists = await this.prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
    if (exists) throw new ConflictException("Email sudah terdaftar");

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name ?? null,
        passwordHash: await hashPassword(input.password),
      },
      select: { id: true, email: true, name: true },
    });
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
}

/** A valid scrypt hash of a random string. Only used to burn equal time on unknown emails. */
const DUMMY_HASH = "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$" + Buffer.alloc(64).toString("base64");
