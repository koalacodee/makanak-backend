import type { ISettingsRepository } from "../domain/settings.iface";
import type { StoreSettings } from "../domain/settings.entity";

export class GetSettingsUseCase {
  async execute(repo: ISettingsRepository): Promise<StoreSettings | null> {
    return await repo.find();
  }
}
