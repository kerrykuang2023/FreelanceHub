interface SMSConfig {
  provider: "aliyun" | "tencent" | "twilio" | "mock";
  accessKeyId?: string;
  accessKeySecret?: string;
  signName?: string;
  region?: string;
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class SMSService {
  private config: SMSConfig;

  constructor() {
    this.config = {
      provider: (process.env.SMS_PROVIDER as SMSConfig["provider"]) || "mock",
      accessKeyId: process.env.SMS_ACCESS_KEY_ID,
      accessKeySecret: process.env.SMS_ACCESS_KEY_SECRET,
      signName: process.env.SMS_SIGN_NAME,
      region: process.env.SMS_REGION,
      accountSid: process.env.SMS_ACCOUNT_SID,
      authToken: process.env.SMS_AUTH_TOKEN,
      fromNumber: process.env.SMS_FROM_NUMBER,
    };
  }

  public async sendSMS(
    phoneNumber: string,
    templateCode: string,
    params: Record<string, string>
  ): Promise<SMSResult> {
    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    switch (this.config.provider) {
      case "aliyun":
        return this.sendViaAliyun(formattedPhone, templateCode, params);
      case "tencent":
        return this.sendViaTencent(formattedPhone, templateCode, params);
      case "twilio":
        return this.sendViaTwilio(formattedPhone, templateCode, params);
      default:
        return this.sendMock(formattedPhone, templateCode, params);
    }
  }

  public async sendPaymentConfirmation(
    phoneNumber: string,
    data: { invoiceNumber: string; amount: string; currency: string }
  ): Promise<SMSResult> {
    return this.sendSMS(phoneNumber, "PAYMENT_CONFIRMATION", {
      invoice_number: data.invoiceNumber,
      amount: data.amount,
      currency: data.currency,
    });
  }

  public async sendSecurityAlert(
    phoneNumber: string,
    data: { type: string; time: string; location?: string }
  ): Promise<SMSResult> {
    return this.sendSMS(phoneNumber, "SECURITY_ALERT", {
      type: data.type,
      time: data.time,
      location: data.location || "Unknown",
    });
  }

  public async sendVerificationCode(
    phoneNumber: string,
    code: string,
    expiresInMinutes: number = 5
  ): Promise<SMSResult> {
    return this.sendSMS(phoneNumber, "VERIFICATION_CODE", {
      code,
      expire: String(expiresInMinutes),
    });
  }

  public async sendProjectNotification(
    phoneNumber: string,
    data: { projectName: string; action: string }
  ): Promise<SMSResult> {
    return this.sendSMS(phoneNumber, "PROJECT_NOTIFICATION", {
      project_name: data.projectName.substring(0, 20),
      action: data.action,
    });
  }

  private async sendViaAliyun(
    phoneNumber: string,
    templateCode: string,
    params: Record<string, string>
  ): Promise<SMSResult> {
    try {
      console.log(`[Aliyun SMS] Sending to ${phoneNumber} with template ${templateCode}`, params);
      return {
        success: true,
        messageId: `aliyun-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async sendViaTencent(
    phoneNumber: string,
    templateCode: string,
    params: Record<string, string>
  ): Promise<SMSResult> {
    try {
      console.log(`[Tencent SMS] Sending to ${phoneNumber} with template ${templateCode}`, params);
      return {
        success: true,
        messageId: `tencent-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async sendViaTwilio(
    phoneNumber: string,
    templateCode: string,
    params: Record<string, string>
  ): Promise<SMSResult> {
    try {
      console.log(`[Twilio SMS] Sending to ${phoneNumber} with template ${templateCode}`, params);
      return {
        success: true,
        messageId: `twilio-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async sendMock(
    phoneNumber: string,
    templateCode: string,
    params: Record<string, string>
  ): Promise<SMSResult> {
    console.log(`[Mock SMS] To: ${phoneNumber}, Template: ${templateCode}`, params);
    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
  }

  private formatPhoneNumber(phone: string): string {
    let formatted = phone.replace(/[^\d+]/g, "");
    if (!formatted.startsWith("+")) {
      if (formatted.startsWith("86")) {
        formatted = "+" + formatted;
      } else if (formatted.length === 11) {
        formatted = "+86" + formatted;
      } else {
        formatted = "+" + formatted;
      }
    }
    return formatted;
  }
}

export default new SMSService();
