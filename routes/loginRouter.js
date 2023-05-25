const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const SMSClient = require('@alicloud/sms-sdk');

// 阿里云短信服务的配置信息
const accessKeyId = 'YOUR_ACCESS_KEY_ID';
const accessKeySecret = 'YOUR_ACCESS_KEY_SECRET';
const smsClient = new SMSClient({ accessKeyId, accessKeySecret });

router.use(bodyParser.json());

// 生成指定长度的随机验证码
function generateVerificationCode(length) {
    let code = '';
    const characters = '0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        code += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return code;
}

// 存储手机号和对应的验证码
const verificationCodes = new Map();

router.post('/sendVerificationCode', (req, res) => {
    const { phoneNumber } = req.body;

    // 生成6位验证码
    const verificationCode = generateVerificationCode(6);

    // 发送短信验证码
    smsClient.sendSMS({
        PhoneNumbers: phoneNumber,
        SignName: 'YOUR_SIGN_NAME',
        TemplateCode: 'YOUR_TEMPLATE_CODE',
        TemplateParam: JSON.stringify({ code: verificationCode })
    }).then(() => {
        // 将手机号和验证码存储到Map中，用于后续验证
        verificationCodes.set(phoneNumber, verificationCode);
        res.send('Verification code sent successfully');
    }).catch((error) => {
        console.log('Error sending verification code:', error);
        res.status(500).send('Failed to send verification code');
    });
});

router.post('/login', (req, res) => {
    const { phoneNumber, verificationCode } = req.body;

    // 检查请求中的手机号和验证码是否存在
    if (phoneNumber && verificationCode) {
        // 从存储的Map中获取之前发送的验证码
        const storedVerificationCode = verificationCodes.get(phoneNumber);

        // 检查输入的验证码是否与存储的验证码一致
        if (verificationCode === storedVerificationCode) {
            // 验证成功
            res.send('Login successful');
        } else {
            // 验证失败
            res.send('Invalid verification code');
        }
    } else {
        res.status(400).send('Bad request');
    }
});

module.exports = router;