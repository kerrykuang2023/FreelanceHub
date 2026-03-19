import UserTypeSeeder from "./user-type.seeder";
import JobTypeSeeder from "./job-type.seeder";

export default class Seeders {
  public static async runSeeders() {
    console.log(`🌱[Server]: Running seeders`);
    await UserTypeSeeder.run();
    await JobTypeSeeder.run();
  }
}
