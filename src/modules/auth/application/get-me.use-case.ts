import type { IUserRepository } from "../domain/auth.iface";
import type { User } from "../domain/user.entity";
import { NotFoundError } from "../../../shared/presentation/errors";

export class GetMeUseCase {
  async execute(userId: string, userRepo: IUserRepository): Promise<User> {
    const user = await userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError([
        {
          path: "user",
          message: "User not found",
        },
      ]);
    }
    return user;
  }
}
