import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate, useLocation } from 'react-router-dom';
import userStore from '../../../stores/userStore';
import Logo from '../../ui/Logo';

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
  
  // Add more detailed debugging
  console.log('LoginPage rendered, current step:', step, 'phone:', phoneNumber,
    'location state:', location.state, 'redirect path:', from);

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

  const sendVerificationCode = () => {
    console.log('Send verification code button clicked');
    
    // Allow any phone number without validation
    if (!phoneNumber) {
      setError('请输入手机号码');
      return;
    }

    setIsLoading(true);
    console.log('Setting loading state, phone number:', phoneNumber);
    
    try {
      // For demo purposes, immediately switch to verify step
      console.log('Changing to verify step immediately for testing');
      
      // Simulate verification code sent to the phone
      const mockCode = '123456';
      console.log('Verification code for testing:', mockCode);
      
      // Use setTimeout to allow UI to update with loading state first
      setTimeout(() => {
        setStep('verify');
        setCountdown(60); // 60 second countdown for resend
        setIsLoading(false);
        console.log('Step changed to:', 'verify');
      }, 500);
    } catch (error) {
      console.error('Error in send verification:', error);
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
  console.log('Verifying code:', verificationCode, 'for phone:', phoneNumber);
  
  try {
    // Accept any verification code
    console.log('Verification successful, logging in');
      console.log('Verification successful, logging in');
      await userStore.loginWithPhone(phoneNumber, verificationCode);
      
      console.log('Login successful, redirecting to:', from);
      // Redirect to the original page after successful login
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      setError('验证码无效，请重试 (提示: 测试用验证码为123456)');
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
                    countdown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600'
                  }`}
                  onClick={() => countdown === 0 && sendVerificationCode()}
                  disabled={countdown > 0}
                >
                  {countdown > 0 ? `${countdown}秒后重发` : '重新获取'}
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