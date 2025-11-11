/**
 * Copyright (c) 2024 Cjz.
 * https://github.com/tencentcloud/tencentcloud-sdk-nodejs
 */

import tencentcloud from "tencentcloud-sdk-nodejs";
// 导入对应产品模块的client models。
const smsClient = tencentcloud.sms.v20210111.Client;
import { flatOne, getByStrId, save } from './db.js';
import nodemailer from 'nodemailer';
import { TransactionalEmailsApi, Configuration } from '@getbrevo/brevo';

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
    const verification = await getByStrId('sms_verifications', verificationId);

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

/**
 * Email setup with Brevo API as default provider
 *
 * Environment variables required for Brevo (recommended):
 * - BREVO_API_KEY: Your Brevo API key
 * - BREVO_SENDER_EMAIL: Verified sender email address in Brevo
 * - BREVO_SENDER_NAME: Display name for the sender (optional, defaults to 'PrepAI')
 *
 * Fallback environment variables for Gmail SMTP:
 * - EMAIL_USER: Gmail username
 * - EMAIL_PASSWORD: Gmail app password
 */
let emailTransporter = null;
let brevoApiInstance = null;

function initializeBrevoApi() {
    try {
        const config = new Configuration({
            apiKey: process.env.BREVO_API_KEY,
            basePath: 'https://api.brevo.com/v3'
        });
        brevoApiInstance = new TransactionalEmailsApi(config);
        console.log('Brevo API client initialized successfully');
    } catch (error) {
        console.error('Error initializing Brevo API:', error);
        // If Brevo initialization fails, we'll fall back to Gmail
        brevoApiInstance = null;
    }
}

function createEmailTransporter() {
    // Use Brevo API by default, fallback to Gmail SMTP if Brevo API key not available
    if (process.env.BREVO_API_KEY) {
        initializeBrevoApi();
        console.log('Email service initialized with Brevo API');
    } else {
        emailTransporter = nodemailer.createTransport({
            service: 'gmail', // fallback to gmail
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
        console.log('Email transporter initialized with Gmail SMTP (fallback)');
    }
}

async function sendEmail(email, code) {
    // Initialize email service if not already done
    if (!brevoApiInstance && !emailTransporter) {
        createEmailTransporter();
    }
    
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER;
    const senderName = process.env.BREVO_SENDER_NAME || 'PrepAI';
    
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #333; margin-bottom: 10px;">验证码 / Verification Code</h1>
            </div>
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center;">
                <p style="font-size: 16px; color: #666; margin-bottom: 20px;">您的验证码是 / Your verification code is:</p>
                <div style="background-color: #007bff; color: white; padding: 15px 30px; border-radius: 6px; font-size: 32px; font-weight: bold; letter-spacing: 3px; margin: 20px 0; display: inline-block;">
                    ${code}
                </div>
                <p style="font-size: 14px; color: #666; margin-top: 20px;">验证码有效期为5分钟 / This code will expire in 5 minutes.</p>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                <p style="font-size: 12px; color: #999;">如果您没有请求此验证码，请忽略此邮件 / If you didn't request this code, please ignore this email.</p>
            </div>
        </div>
    `;
    
    // Use Brevo API if available, otherwise fallback to nodemailer
    if (brevoApiInstance) {
        const sendSmtpEmail = {
            sender: { email: senderEmail, name: senderName },
            to: [{ email: email }],
            subject: '验证码 - Verification Code',
            htmlContent: htmlContent
        };
        
        try {
            console.log('Sending email via Brevo API with data:', JSON.stringify(sendSmtpEmail, null, 2));
            const data = await brevoApiInstance.sendTransacEmail(sendSmtpEmail);
            console.log('✅ Email sent successfully via Brevo API:', data);
            return data;
        } catch (error) {
            console.error('❌ Error sending email via Brevo API:');
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('Full error:', error);
            
            // Fall back to Gmail if Brevo fails
            console.log('Falling back to Gmail SMTP...');
            if (!emailTransporter) {
                emailTransporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASSWORD
                    }
                });
            }
            
            const mailOptions = {
                from: `${senderName} <${senderEmail}>`,
                to: email,
                subject: '验证码 - Verification Code',
                html: htmlContent
            };
            
            await emailTransporter.sendMail(mailOptions);
            console.log('✅ Email sent successfully via Gmail SMTP (fallback)');
        }
    } else {
        // Fallback to nodemailer (Gmail)
        const mailOptions = {
            from: `${senderName} <${senderEmail}>`,
            to: email,
            subject: '验证码 - Verification Code',
            html: htmlContent
        };
        
        await emailTransporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully via Gmail SMTP');
    }
}

// Email handlers
const send_email = async (q, b) => {
    try {
        // Validate required parameters
        if (!b.email) {
            return {
                success: false,
                error: 'Email address is required'
            };
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(b.email)) {
            return {
                success: false,
                error: 'Invalid email address format'
            };
        }

        // Generate 6-digit verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Send email
        await sendEmail(b.email, verificationCode);

        // Store verification code in database for later verification
        const verificationData = {
            id: `${b.email}_${b.host}`,
            email: b.email,
            code: verificationCode,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 300000).toISOString(), // 5 minutes expiration
            verified: false
        };

        await save('email_verifications', verificationData);

        return {
            success: true,
            message: 'Email verification code sent successfully',
            expiresIn: 300 // 5 minutes in seconds
        };

    } catch (error) {
        console.error('Email sending error:', error);
        return {
            success: false,
            error: error.message || 'Failed to send email verification code'
        };
    }
};

const verify_email = async (q, b) => {
    try {
        // Validate required parameters
        if (!b.email || !b.code) {
            return {
                success: false,
                error: 'Email address and verification code are required'
            };
        }

        const verificationId = `${b.email}_${b.host}`;

        // Get verification record from database
        const verification = await getByStrId('email_verifications', verificationId);

        if (!verification) {
            return {
                success: false,
                error: 'No verification code found for this email address'
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

        await save('email_verifications', updatedVerification);

        return {
            success: true,
            message: 'Email address verified successfully'
        };

    } catch (error) {
        console.error('Email verification error:', error);
        return {
            success: false,
            error: error.message || 'Failed to verify email code'
        };
    }
};

export {
    sendSms,
    send_sms,
    verify_sms,
    sendEmail,
    send_email,
    verify_email
};
