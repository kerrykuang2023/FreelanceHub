import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import { asyncWrapper } from "../helpers/async-wrapper";
import RequestValidator from "../validators/RequestValidator";
import { RegisterUserAccountRequest } from "../requests/RegisterUserAccountRequest";
import passport from "passport";

export default class AuthRoutes {
  public router: Router;

  constructor() {
    this.router = Router();
    this.routes();
  }

  private routes() {
    this.router.post("/login", asyncWrapper(AuthController.login));

    this.router.post(
      "/signup",
      RequestValidator.validate(RegisterUserAccountRequest),
      asyncWrapper(AuthController.signup)
    );

    this.router.get(
      "/me",
      passport.authenticate("jwt", { session: false }),
      asyncWrapper(AuthController.me)
    );

    this.router.get("/user-types", asyncWrapper(AuthController.getUserTypes));

    this.router.post(
      "/switch-role",
      passport.authenticate("jwt", { session: false }),
      asyncWrapper(AuthController.switchRole)
    );

    this.router.post(
      "/roles/apply",
      passport.authenticate("jwt", { session: false }),
      asyncWrapper(AuthController.applyForRole)
    );

    this.router.post(
      "/roles/switch",
      passport.authenticate("jwt", { session: false }),
      asyncWrapper(AuthController.switchRole)
    );

    this.router.get(
      "/roles",
      passport.authenticate("jwt", { session: false }),
      asyncWrapper(AuthController.getMyRoles)
    );

    this.router.get(
      "/my-role-approvals",
      passport.authenticate("jwt", { session: false }),
      asyncWrapper(AuthController.getMyRoleApprovals)
    );
  }
}
