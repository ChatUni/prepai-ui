/**
 * Copyright (c) 2024 Cjz.
 * https://github.com/tencentcloud/tencentcloud-sdk-nodejs
 */

import tencentcloud from "tencentcloud-sdk-nodejs";
// 导入对应产品模块的client models。
const smsClient = tencentcloud.sms.v20210111.Client;
import { flatOne, get, save } from './db.js';

/* 实例化要请求产品(以sms为例)的client对象 */
let client = null

function createClient() {
    client = new smsClient({
        credential: {
            secretId: process.env.SMS_TENCENT_SECRET_ID,
            secretKey: process.env.SMS_TENCENT_SECRET_KEY,
        },
        region: "ap-beijing",
        profile: {
            signMethod: "HmacSHA256",
            httpProfile: {
                reqMethod: "POST",
                reqTimeout: 30,
                endpoint: "sms.tencentcloudapi.com"
            },
        },
    })
}


async function sendSms(phone, countryCode, code) {
    if (!client) {
        createClient();
    }
    let SignName = "";
    let TemplateId = "";
    let phoneParam = [phone]
    let TemplateParamSet = [code]
    if (countryCode == "+86") {
        SignName = process.env.SMS_TENCENT_SIGN_NAME_CN;
        TemplateId = process.env.SMS_TENCENT_TEMPLATE_ID_CN;
    } else {
        SignName = process.env.SMS_TENCENT_SIGN_NAME_EN;
        TemplateId = process.env.SMS_TENCENT_TEMPLATE_ID_EN;
        phoneParam = [countryCode+phone]
        TemplateParamSet.push("6")
    }
    const params = {
        SmsSdkAppId: process.env.SMS_TENCENT_APP_ID,
        SignName: SignName,
        TemplateId: TemplateId,
        TemplateParamSet: TemplateParamSet,
        PhoneNumberSet: phoneParam,
        SessionContext: "",
        ExtendCode: "",
        SenderId: "",
    }
    await client.SendSms(params);
}

// SMS handlers
const send_sms = async (q, b) => {
  try {
    // Validate required parameters
    if (!b.phone) {
      return {
        success: false,
        error: 'Phone number is required'
      };
    }

    // Set default country code if not provided
    const countryCode = b.countryCode || '+86';
    
    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Send SMS
    await sendSms(b.phone, countryCode, verificationCode);
    
    // Store verification code in database for later verification
    // Using a temporary collection with expiration
    const verificationData = {
      id: `${countryCode}${b.phone}_${b.host}`,
      phone: b.phone,
      countryCode: countryCode,
      code: verificationCode,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 300000).toISOString(), // 5 minutes expiration
      verified: false
    };
    
    await save('sms_verifications', verificationData);
    
    return {
      success: true,
      message: 'SMS verification code sent successfully',
      expiresIn: 300 // 5 minutes in seconds
    };
    
  } catch (error) {
    console.error('SMS sending error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS verification code'
    };
  }
};

const verify_sms = async (q, b) => {
  try {
    // Validate required parameters
    if (!b.phone || !b.code) {
      return {
        success: false,
        error: 'Phone number and verification code are required'
      };
    }

    const countryCode = b.countryCode || '+86';
    const verificationId = `${countryCode}${b.phone}_${b.host}`;
    
    // Get verification record from database
    const verification = await flatOne('sms_verifications', `m_id=${verificationId}`);

    if (!verification) {
      return {
        success: false,
        error: 'No verification code found for this phone number'
      };
    }
    
    // Check if code has expired
    if (new Date() > new Date(verification.expiresAt)) {
      return {
        success: false,
        error: '验证码已过期'
      };
    }
    
    // Check if code has already been used
    if (verification.verified) {
      return {
        success: false,
        error: '验证码已被使用'
      };
    }
    
    // Verify the code
    if (verification.code !== b.code) {
      return {
        success: false,
        error: '验证码无效'
      };
    }
    
    // Mark as verified
    const updatedVerification = {
      ...verification,
      verified: true,
      verifiedAt: new Date().toISOString()
    };
    
    await save('sms_verifications', updatedVerification);
    
    return {
      success: true,
      message: 'Phone number verified successfully'
    };
    
  } catch (error) {
    console.error('SMS verification error:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify SMS code'
    };
  }
};

export {
    sendSms,
    send_sms,
    verify_sms
};
