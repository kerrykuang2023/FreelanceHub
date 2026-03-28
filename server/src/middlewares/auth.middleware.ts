import passport from "passport";
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate("jwt", function (err: any, user: any, info: any) {
    if (err) return next(err);

    if (!user)
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Unauthorized" });

    req.user = user;
    next();
  })(req, res, next);
};

export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" });
    }

    const user = req.user as any;
    
    // 从 populate 的 user_type_id 对象获取用户类型
    let userTypeName = '';
    if (user.user_type_id && typeof user.user_type_id === 'object') {
      userTypeName = user.user_type_id.user_type_name || '';
    } else if (user.user_type) {
      userTypeName = user.user_type;
    } else if (user.role) {
      userTypeName = user.role;
    }

    const normalizedUserRole = userTypeName.toLowerCase().replace(/[_\s]/g, '_');
    const normalizedRequiredRole = role.toLowerCase().replace(/[_\s]/g, '_');

    console.log(`[权限检查] 用户类型: ${userTypeName}, 标准化后: ${normalizedUserRole}, 需要: ${normalizedRequiredRole}`);

    if (normalizedUserRole !== normalizedRequiredRole) {
      return res.status(StatusCodes.FORBIDDEN).json({ message: `Forbidden: insufficient permissions. Required: ${role}, Got: ${userTypeName}` });
    }

    next();
  };
};

export default authMiddleware;
