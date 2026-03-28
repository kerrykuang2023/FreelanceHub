import { Router } from "express";
import FreelancerProfileController from "../controllers/freelancer-profile.controller";
import { asyncWrapper } from "../helpers/async-wrapper";
import { authMiddleware } from "../middlewares/auth.middleware";

class FreelancerProfileRoutes {
  public router: Router;

  constructor() {
    this.router = Router();
    this.routes();
  }

  private routes() {
    this.router.get("/me", authMiddleware, asyncWrapper(FreelancerProfileController.getMyProfile));
    this.router.put("/me", authMiddleware, asyncWrapper(FreelancerProfileController.updateProfile));
    this.router.put("/me/rates", authMiddleware, asyncWrapper(FreelancerProfileController.updateRates));
    this.router.put("/me/availability", authMiddleware, asyncWrapper(FreelancerProfileController.updateAvailability));

    this.router.post("/me/skills", authMiddleware, asyncWrapper(FreelancerProfileController.addSkill));
    this.router.put("/me/skills/:skillId", authMiddleware, asyncWrapper(FreelancerProfileController.updateSkill));
    this.router.delete("/me/skills/:skillId", authMiddleware, asyncWrapper(FreelancerProfileController.deleteSkill));

    this.router.post("/me/project-experiences", authMiddleware, asyncWrapper(FreelancerProfileController.addProjectExperience));
    this.router.put("/me/project-experiences/:experienceId", authMiddleware, asyncWrapper(FreelancerProfileController.updateProjectExperience));
    this.router.delete("/me/project-experiences/:experienceId", authMiddleware, asyncWrapper(FreelancerProfileController.deleteProjectExperience));

    this.router.post("/me/certifications", authMiddleware, asyncWrapper(FreelancerProfileController.addCertification));
    this.router.put("/me/certifications/:certId", authMiddleware, asyncWrapper(FreelancerProfileController.updateCertification));
    this.router.delete("/me/certifications/:certId", authMiddleware, asyncWrapper(FreelancerProfileController.deleteCertification));

    this.router.get("/:id", authMiddleware, asyncWrapper(FreelancerProfileController.getProfileById));
  }
}

export default new FreelancerProfileRoutes().router;
