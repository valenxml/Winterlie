import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { canAfford, dailyKey, DAILY_GRANT, sumBalance } from "./credits.logic.js";

type Tx = Parameters<Parameters<PrismaService["$transaction"]>[0]>[0];

/**
 * The ledger is append-only. Every change is a row in credit_transactions with a unique
 * idempotency key, so a retried request cannot charge or grant twice.
 */
@Injectable()
export class CreditsService {
  constructor(private readonly prisma: PrismaService) {}

  private async balanceOf(tx: Tx, userId: string): Promise<number> {
    const rows = await tx.creditTransaction.findMany({ where: { userId }, select: { amount: true } });
    return sumBalance(rows.map((r) => r.amount));
  }

  async balance(userId: string): Promise<number> {
    return this.prisma.$transaction((tx) => this.balanceOf(tx, userId));
  }

  /** Adds credits once per key. Returns false if this key was already used. */
  async grant(userId: string, amount: number, key: string, prismaClient: PrismaService = this.prisma): Promise<boolean> {
    const existing = await prismaClient.creditTransaction.findUnique({ where: { idempotencyKey: key }, select: { id: true } });
    if (existing) return false;
    try {
      await prismaClient.creditTransaction.create({
        data: { userId, type: "GRANT", amount, idempotencyKey: key },
      });
      return true;
    } catch (err) {
      // Another request inserted the same key first.
      if ((err as { code?: string }).code === "P2002") return false;
      throw err;
    }
  }

  /** Claims the daily credit once per WIB day. */
  async claimDaily(userId: string, now: Date = new Date()): Promise<{ granted: boolean; balance: number }> {
    const granted = await this.grant(userId, DAILY_GRANT, `daily:${userId}:${dailyKey(now)}`);
    return { granted, balance: await this.balance(userId) };
  }

  /**
   * Deducts credits before a paid action. The user row is locked for the duration, so two
   * simultaneous requests cannot both spend the last credit.
   */
  async charge(userId: string, cost: number, key: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;

      const duplicate = await tx.creditTransaction.findUnique({ where: { idempotencyKey: key }, select: { id: true } });
      if (duplicate) return;

      const balance = await this.balanceOf(tx, userId);
      if (!canAfford(balance, cost)) {
        throw new HttpException(
          { message: "Credit tidak cukup. Klaim credit harian atau tunggu besok.", balance, cost },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
      await tx.creditTransaction.create({
        data: { userId, type: "DEDUCT", amount: -cost, idempotencyKey: key },
      });
    });
  }

  /** Returns credits for a paid action that failed. Safe to call twice with the same key. */
  async refund(userId: string, cost: number, key: string): Promise<void> {
    await this.grant(userId, cost, key);
  }
}
