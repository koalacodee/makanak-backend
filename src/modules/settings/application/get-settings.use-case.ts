import type { StoreSettings } from '../domain/settings.entity'
import type { ISettingsRepository } from '../domain/settings.iface'

export class GetSettingsUseCase {
  async execute(repo: ISettingsRepository): Promise<StoreSettings | null> {
    return await repo.find()
  }
}
