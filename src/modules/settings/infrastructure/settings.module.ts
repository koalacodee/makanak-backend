import { Elysia } from "elysia";
import db from "../../../drizzle";
import { SettingsRepository } from "./settings.repository";
import { GetSettingsUseCase } from "../application/get-settings.use-case";
import { UpdateSettingsUseCase } from "../application/update-settings.use-case";

export const settingsModule = new Elysia({ name: "settingsModule" })
  .decorate("settingsRepo", new SettingsRepository(db))
  .decorate("getSettingsUC", new GetSettingsUseCase())
  .decorate("updateSettingsUC", new UpdateSettingsUseCase());
