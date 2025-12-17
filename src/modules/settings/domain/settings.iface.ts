import { StoreSettings, StoreSettingsInput } from "./settings.entity";

export interface ISettingsRepository {
  find(): Promise<StoreSettings | null>;
  create(data: StoreSettingsInput): Promise<StoreSettings>;
  update(data: StoreSettingsInput): Promise<StoreSettings>;
}
