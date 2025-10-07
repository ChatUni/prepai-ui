import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate, useLocation } from 'react-router-dom';
import userStore from '../../../stores/userStore';
import Logo from '../../ui/Logo';
import { post } from '../../../utils/db';
import clientStore from '../../../stores/clientStore';

const LoginPage = observer(() => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'verify'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state or default to home
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    // If already logged in, redirect to the original page
    if (userStore.isLoggedIn) {
      navigate(from, { replace: true });
    }
  }, [userStore.isLoggedIn, navigate, from]);

  useEffect(() => {
    // Handle countdown for resend code
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handlePhoneChange = (e) => {
    // Allow only numbers
    const value = e.target.value.replace(/\D/g, '');
    setPhoneNumber(value);
    setError('');
  };

  const handleVerificationCodeChange = (e) => {
    // Allow only numbers
    const value = e.target.value.replace(/\D/g, '');
    setVerificationCode(value);
    setError('');
  };

  const sendVerificationCode = async () => {
    if (!phoneNumber) {
      setError('请输入手机号码');
      return;
    }

    if (import.meta.env.VITE_NO_SMS == 1) {
      await userStore.loginWithPhone(phoneNumber);
      navigate(from, { replace: true });
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const response = await post('send_sms', {}, {
        host: window.location.hostname,
        phone: phoneNumber,
        countryCode: '+86'
      });
      
      if (response.success) {
        setStep('verify');
        setCountdown(60); // 60 second countdown for resend
        setIsLoading(false);
      } else {
        setError(response.error || '发送验证码失败，请稍后再试');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      setIsLoading(false);
      setError('发送验证码失败，请稍后再试');
    }
  };
  const verifyAndLogin = async () => {
    if (!verificationCode) {
      setError('请输入验证码');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // First verify the SMS code
      const verifyResponse = await post('verify_sms', {}, {
        host: window.location.hostname,
        phone: phoneNumber,
        code: verificationCode,
        countryCode: '+86'
      });
      
      if (verifyResponse.success) {
        // SMS verification successful, now login with phone
        await userStore.loginWithPhone(phoneNumber, verificationCode);
        
        // Redirect to the original page after successful login
        navigate(from, { replace: true });
      } else {
        setError(verifyResponse.error || '验证码无效，请重试');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Verification or login error:', error);
      setError('验证码无效，请重试');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-100">
          <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center mb-6">
          <Logo size="large" />
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-6">
          {step === 'phone' ? '手机号登录' : '验证码登录'}
        </h1>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        {step === 'phone' ? (
          <div>
            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                手机号
              </label>
              <div className="flex">
                <div className="flex items-center justify-center bg-gray-50 border border-gray-300 rounded-l-md px-3">
                  <span className="text-gray-500">+86</span>
                </div>
                <input
                  type="tel"
                  id="phone"
                  className="flex-1 rounded-r-md border-gray-300 border p-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入手机号码"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  maxLength={11}
                />
              </div>
            </div>
            
            <button
              className={`w-full py-2 px-4 rounded-md font-medium text-white ${
                isLoading || !phoneNumber
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              onClick={sendVerificationCode}
              disabled={isLoading || !phoneNumber}
            >
              {isLoading ? '发送中...' : '获取验证码'}
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-1">
                验证码
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="verification-code"
                  className="flex-1 rounded-l-md border-gray-300 border p-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入验证码"
                  value={verificationCode}
                  onChange={handleVerificationCodeChange}
                  maxLength={6}
                />
                <button
                  className={`rounded-r-md border border-gray-300 bg-gray-50 px-3 text-sm ${
                    countdown > 0 || isLoading ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600'
                  }`}
                  onClick={() => countdown === 0 && !isLoading && sendVerificationCode()}
                  disabled={countdown > 0 || isLoading}
                >
                  {isLoading ? '发送中...' : countdown > 0 ? `${countdown}秒后重发` : '重新获取'}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                验证码已发送至 +86 {phoneNumber}
              </p>
            </div>
            
            <div className="flex gap-4">
              <button
                className="w-1/3 py-2 px-4 rounded-md border border-gray-300 font-medium"
                onClick={() => setStep('phone')}
                disabled={isLoading}
              >
                返回
              </button>
              <button
                className={`w-2/3 py-2 px-4 rounded-md font-medium text-white ${
                  isLoading || !verificationCode
                    ? 'bg-blue-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                onClick={verifyAndLogin}
                disabled={isLoading || !verificationCode}
              >
                {isLoading ? '登录中...' : '登录'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default LoginPage;