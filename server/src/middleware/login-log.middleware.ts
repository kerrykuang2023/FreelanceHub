import { Request } from "express";
import LoginLog from "../models/auth/login-log.model";

class LoginLogMiddleware {
  public static async logLogin(
    req: Request,
    userId: string,
    status: "success" | "failed" = "success",
    failureReason?: string
  ): Promise<void> {
    try {
      const ip =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "unknown";

      const userAgent = req.headers["user-agent"] || "";
      const deviceType = this.detectDeviceType(userAgent);
      const browserInfo = this.parseBrowser(userAgent);
      const osInfo = this.parseOS(userAgent);

      await LoginLog.create({
        user_id: userId,
        login_time: new Date(),
        ip_address: ip,
        user_agent: userAgent,
        device_type: deviceType,
        browser: browserInfo,
        os: osInfo,
        login_status: status,
        failure_reason: failureReason,
        session_id: (req as any).sessionID,
      });
    } catch (error) {
      console.error("Failed to log login:", error);
    }
  }

  public static async logLogout(userId: string, sessionId?: string): Promise<void> {
    try {
      const query: any = { user_id: userId, logout_time: { $exists: false } };
      if (sessionId) {
        query.session_id = sessionId;
      }

      await LoginLog.updateMany(query, {
        $set: { logout_time: new Date() },
      });
    } catch (error) {
      console.error("Failed to log logout:", error);
    }
  }

  private static detectDeviceType(userAgent: string): "desktop" | "mobile" | "tablet" | "unknown" {
    const ua = userAgent.toLowerCase();
    if (/tablet|ipad|playbook|silk/.test(ua)) {
      return "tablet";
    }
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/.test(ua)) {
      return "mobile";
    }
    if (/windows|mac|linux|ubuntu|chrome os/.test(ua)) {
      return "desktop";
    }
    return "unknown";
  }

  private static parseBrowser(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (ua.includes("chrome") && !ua.includes("edg")) return "Chrome";
    if (ua.includes("safari") && !ua.includes("chrome")) return "Safari";
    if (ua.includes("firefox")) return "Firefox";
    if (ua.includes("edg")) return "Edge";
    if (ua.includes("opera") || ua.includes("opr")) return "Opera";
    if (ua.includes("msie") || ua.includes("trident")) return "IE";
    return "Unknown";
  }

  private static parseOS(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (ua.includes("windows nt 10")) return "Windows 10";
    if (ua.includes("windows nt 6.3")) return "Windows 8.1";
    if (ua.includes("windows nt 6.2")) return "Windows 8";
    if (ua.includes("windows nt 6.1")) return "Windows 7";
    if (ua.includes("mac os x")) return "macOS";
    if (ua.includes("android")) return "Android";
    if (ua.includes("iphone") || ua.includes("ipad")) return "iOS";
    if (ua.includes("linux")) return "Linux";
    return "Unknown";
  }
}

export default LoginLogMiddleware;
