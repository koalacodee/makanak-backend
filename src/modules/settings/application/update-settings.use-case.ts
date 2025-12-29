import type {
  StoreSettings,
  StoreSettingsInput,
} from '../domain/settings.entity'
import type { ISettingsRepository } from '../domain/settings.iface'

export class UpdateSettingsUseCase {
  async execute(
    data: StoreSettingsInput,
    repo: ISettingsRepository,
  ): Promise<StoreSettings> {
    return await repo.update(data)
  }
}
