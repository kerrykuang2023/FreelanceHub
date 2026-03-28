import SkillCategory from "../models/freelancer/skill_category.model";
import SkillSubCategory from "../models/freelancer/skill_sub_category.model";

export default class SkillCategorySeeder {
  public static async run() {
    const skillData = [
      {
        category_name: "ERP",
        category_code: "ERP",
        category_icon: "CpuChipIcon",
        description: "Enterprise Resource Planning systems",
        display_order: 1,
        sub_categories: [
          { sub_category_name: "SAP", sub_category_code: "SAP", description: "SAP ERP System", display_order: 1 },
          { sub_category_name: "Oracle EBS", sub_category_code: "ORACLE_EBS", description: "Oracle E-Business Suite", display_order: 2 },
          { sub_category_name: "Microsoft Dynamics", sub_category_code: "MS_DYNAMICS", description: "Microsoft Dynamics ERP", display_order: 3 },
          { sub_category_name: "用友", sub_category_code: "YONYOU", description: "用友ERP", display_order: 4 },
          { sub_category_name: "金蝶", sub_category_code: "KINGDEE", description: "金蝶ERP", display_order: 5 },
        ]
      },
      {
        category_name: "SAP",
        category_code: "SAP",
        category_icon: "CubeIcon",
        description: "SAP Modules and Technologies",
        display_order: 2,
        sub_categories: [
          { sub_category_name: "SAP MM", sub_category_code: "SAP_MM", description: "Materials Management", display_order: 1 },
          { sub_category_name: "SAP FICO", sub_category_code: "SAP_FICO", description: "Finance & Controlling", display_order: 2 },
          { sub_category_name: "SAP SD", sub_category_code: "SAP_SD", description: "Sales & Distribution", display_order: 3 },
          { sub_category_name: "SAP ABAP", sub_category_code: "SAP_ABAP", description: "ABAP Programming", display_order: 4 },
          { sub_category_name: "SAP PP", sub_category_code: "SAP_PP", description: "Production Planning", display_order: 5 },
          { sub_category_name: "SAP HCM", sub_category_code: "SAP_HCM", description: "Human Capital Management", display_order: 6 },
          { sub_category_name: "SAP BW/4HANA", sub_category_code: "SAP_BW4", description: "Business Warehouse", display_order: 7 },
          { sub_category_name: "SAP S/4HANA", sub_category_code: "SAP_S4", description: "SAP S/4HANA", display_order: 8 },
        ]
      },
      {
        category_name: "CRM",
        category_code: "CRM",
        category_icon: "UsersIcon",
        description: "Customer Relationship Management",
        display_order: 3,
        sub_categories: [
          { sub_category_name: "Salesforce", sub_category_code: "SALESFORCE", description: "Salesforce CRM", display_order: 1 },
          { sub_category_name: "SAP CRM", sub_category_code: "SAP_CRM", description: "SAP CRM", display_order: 2 },
          { sub_category_name: "Microsoft Dynamics CRM", sub_category_code: "MS_DYN_CRM", description: "Microsoft Dynamics CRM", display_order: 3 },
        ]
      },
      {
        category_name: "JAVA",
        category_code: "JAVA",
        category_icon: "CodeIcon",
        description: "Java Development",
        display_order: 4,
        sub_categories: [
          { sub_category_name: "Spring", sub_category_code: "SPRING", description: "Spring Framework", display_order: 1 },
          { sub_category_name: "Spring Boot", sub_category_code: "SPRING_BOOT", description: "Spring Boot", display_order: 2 },
          { sub_category_name: "Hibernate", sub_category_code: "HIBERNATE", description: "Hibernate ORM", display_order: 3 },
          { sub_category_name: "Microservices", sub_category_code: "MICROSVCS", description: "Microservices Architecture", display_order: 4 },
        ]
      },
      {
        category_name: "Frontend",
        category_code: "FRONTEND",
        category_icon: "DeviceMobileIcon",
        description: "Frontend Development",
        display_order: 5,
        sub_categories: [
          { sub_category_name: "React", sub_category_code: "REACT", description: "React.js", display_order: 1 },
          { sub_category_name: "Vue.js", sub_category_code: "VUE", description: "Vue.js", display_order: 2 },
          { sub_category_name: "Angular", sub_category_code: "ANGULAR", description: "Angular", display_order: 3 },
          { sub_category_name: "TypeScript", sub_category_code: "TS", description: "TypeScript", display_order: 4 },
        ]
      },
      {
        category_name: "DevOps",
        category_code: "DEVOPS",
        category_icon: "ServerIcon",
        description: "DevOps & Cloud",
        display_order: 6,
        sub_categories: [
          { sub_category_name: "AWS", sub_category_code: "AWS", description: "Amazon Web Services", display_order: 1 },
          { sub_category_name: "Azure", sub_category_code: "AZURE", description: "Microsoft Azure", display_order: 2 },
          { sub_category_name: "Docker", sub_category_code: "DOCKER", description: "Docker", display_order: 3 },
          { sub_category_name: "Kubernetes", sub_category_code: "K8S", description: "Kubernetes", display_order: 4 },
          { sub_category_name: "Jenkins", sub_category_code: "JENKINS", description: "Jenkins CI/CD", display_order: 5 },
        ]
      },
      {
        category_name: "Database",
        category_code: "DB",
        category_icon: "DatabaseIcon",
        description: "Database Management",
        display_order: 7,
        sub_categories: [
          { sub_category_name: "Oracle", sub_category_code: "ORACLE", description: "Oracle Database", display_order: 1 },
          { sub_category_name: "MySQL", sub_category_code: "MYSQL", description: "MySQL", display_order: 2 },
          { sub_category_name: "PostgreSQL", sub_category_code: "PG", description: "PostgreSQL", display_order: 3 },
          { sub_category_name: "MongoDB", sub_category_code: "MONGODB", description: "MongoDB", display_order: 4 },
          { sub_category_name: "SQL Server", sub_category_code: "MSSQL", description: "Microsoft SQL Server", display_order: 5 },
        ]
      },
      {
        category_name: "Project Management",
        category_code: "PM",
        category_icon: "ClipboardDocumentListIcon",
        description: "Project Management",
        display_order: 8,
        sub_categories: [
          { sub_category_name: "PMP", sub_category_code: "PMP", description: "Project Management Professional", display_order: 1 },
          { sub_category_name: "Scrum Master", sub_category_code: "SCRUM", description: "Scrum Master", display_order: 2 },
          { sub_category_name: "Agile", sub_category_code: "AGILE", description: "Agile Methodology", display_order: 3 },
          { sub_category_name: "PRINCE2", sub_category_code: "PRINCE2", description: "PRINCE2", display_order: 4 },
        ]
      },
    ];

    for (const categoryData of skillData) {
      const { sub_categories, ...categoryFields } = categoryData;

      const existingCategory = await SkillCategory.findOne({
        category_code: categoryFields.category_code
      });

      if (!existingCategory) {
        const category = new SkillCategory(categoryFields);
        await category.save();
        console.log(`✅ Created skill category: ${categoryFields.category_name}`);

        for (const subCategoryData of sub_categories) {
          const existingSubCategory = await SkillSubCategory.findOne({
            category_id: category._id,
            sub_category_code: subCategoryData.sub_category_code
          });

          if (!existingSubCategory) {
            const subCategory = new SkillSubCategory({
              ...subCategoryData,
              category_id: category._id
            });
            await subCategory.save();
            console.log(`  ✅ Created sub-category: ${subCategoryData.sub_category_name}`);
          }
        }
      } else {
        console.log(`⚠️ Skill category already exists: ${categoryFields.category_name}`);
      }
    }

    console.log("🌱 Skill categories seeding completed");
  }
}