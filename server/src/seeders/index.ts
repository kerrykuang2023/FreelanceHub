import UserTypeSeeder from "./user-type.seeder";
import JobTypeSeeder from "./job-type.seeder";
import SkillCategorySeeder from "./skill-category.seeder";
import AdminSeeder from "./admin.seeder";
import { seedTestUsers } from "./test-users.seeder";

export default class Seeders {
  public static async runSeeders() {
    console.log(`🌱[Server]: Running seeders...`);
    
    try {
      await UserTypeSeeder.run();
      await JobTypeSeeder.run();
      await SkillCategorySeeder.run();
      await AdminSeeder.run();
      
      console.log(`🌱[Server]: Running test users seeder...`);
      await seedTestUsers();
      
      console.log(`✅[Server]: All seeders completed successfully!`);
    } catch (error) {
      console.error(`❌[Server]: Error running seeders:`, error);
      throw error;
    }
  }
}
