import { BadRequestError } from "@/shared/presentation";
import redis from "@/shared/redis";

export class LeaveShiftUseCase {
  async execute(driverId: string): Promise<{ success: boolean }> {
    if (await redis.sismember("busy_drivers", driverId)) {
      throw new BadRequestError([
        { path: "driverId", message: "Driver is busy" },
      ]);
    }
    await redis.lrem("available_drivers", 1, driverId);
    return { success: true };
  }
}
