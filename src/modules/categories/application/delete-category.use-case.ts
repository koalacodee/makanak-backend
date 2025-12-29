import { NotFoundError } from "../../../shared/presentation/errors";
import type { ICategoryRepository } from "../domain/categories.iface";

export class DeleteCategoryUseCase {
	async execute(id: string, repo: ICategoryRepository): Promise<void> {
		// Check if category exists
		const existing = await repo.findById(id);
		if (!existing) {
			throw new NotFoundError([
				{
					path: "category",
					message: "Category not found",
				},
			]);
		}

		await repo.delete(id);
	}
}
