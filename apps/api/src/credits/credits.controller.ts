import { Controller, Get, Post } from "@nestjs/common";
import { CurrentUser } from "../common/current-user.js";
import { CreditsService } from "./credits.service.js";

@Controller("credits")
export class CreditsController {
  constructor(private readonly credits: CreditsService) {}

  @Get("balance")
  async balance(@CurrentUser() userId: string) {
    return { balance: await this.credits.balance(userId) };
  }

  @Post("daily")
  claimDaily(@CurrentUser() userId: string) {
    return this.credits.claimDaily(userId);
  }
}
