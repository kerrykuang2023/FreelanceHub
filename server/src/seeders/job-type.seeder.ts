import JobType from "../models/job/job_type.model";

export default class JobTypeSeeder {
  public static async run() {
    const data = [
      { job_type: "Full-time" },
      { job_type: "Part-time" },
      { job_type: "Contract" },
      { job_type: "Internship" },
      { job_type: "Remote" },
      { job_type: "Temporary" },
    ];

    for (const item of data) {
      const exists = await JobType.findOne({ job_type: item.job_type });
      if (!exists) {
        await JobType.create(item);
        console.log(`🌱[Server]: Created job type: ${item.job_type}`);
      }
    }
  }
}
