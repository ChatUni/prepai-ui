/**
 * Copyright (c) 2024 Cjz.
 * https://github.com/tencentcloud/tencentcloud-sdk-nodejs
 */

const tencentcloud = require("tencentcloud-sdk-nodejs")
// 导入对应产品模块的client models。
const smsClient = tencentcloud.sms.v20210111.Client

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

module.exports = {
    sendSms
}
