import UserType from "../models/user/user-type.model";
import UserAccount from "../models/user/user-account.model";
import UserRole from "../models/user/user-role.model";
import UserCredit from "../models/credit/user-credit.model";
import bcrypt from "bcrypt";

const ADMIN_EMAIL = "admin@jobportal.com";
const ADMIN_PASSWORD = "Admin@123";

export default class AdminSeeder {
  public static async run() {
    try {
      let adminType = await UserType.findOne({ user_type_name: "admin" });

      if (!adminType) {
        adminType = await UserType.create({
          user_type_name: "admin",
          user_type_display_name: "管理员",
        });
        console.log("✅ Created admin user type");
      }

      const existingAdmin = await UserAccount.findOne({
        email: ADMIN_EMAIL,
      });

      if (existingAdmin) {
        const existingRoles = await UserRole.find({
          user_id: existingAdmin._id,
          role_type: "admin",
        });
        if (existingRoles.length === 0) {
          await UserRole.create({
            user_id: existingAdmin._id,
            role_type: "admin",
            status: "approved",
            is_active: true,
          });
          console.log("  ✅ Created admin role for existing user");
        }

        const existingCredit = await UserCredit.findOne({
          user_id: existingAdmin._id,
        });
        if (!existingCredit) {
          await UserCredit.create({
            user_id: existingAdmin._id,
            current_balance: 100,
            total_earned: 100,
            total_spent: 0,
            level: "bronze",
          });
          console.log("  ✅ Created credit for existing admin");
        }

        existingAdmin.password = ADMIN_PASSWORD;
        await existingAdmin.save();
        console.log("  ✅ Updated admin password");
        console.log("⚠️ Admin user already exists: " + ADMIN_EMAIL);
        return;
      }

      const admin = await UserAccount.create({
        user_type_id: adminType._id,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        first_name: "System",
        last_name: "Admin",
        registration_date: new Date(),
        sms_notification_active: false,
        email_notification_active: true,
        is_active: true,
      });

      console.log("✅ Created admin user: " + ADMIN_EMAIL);

      await UserRole.create({
        user_id: admin._id,
        role_type: "admin",
        status: "approved",
        is_active: true,
      });
      console.log("  ✅ Created admin role");

      await UserCredit.create({
        user_id: admin._id,
        current_balance: 100,
        total_earned: 100,
        total_spent: 0,
        level: "bronze",
      });
      console.log("  ✅ Created credit with initial balance: 100");
      console.log("  📝 Admin credentials: " + ADMIN_EMAIL + " / " + ADMIN_PASSWORD);
    } catch (error) {
      console.error("❌ Admin seeder error:", error);
    }
  }
}
