import { observer } from 'mobx-react-lite';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { t } from '../../stores/languageStore';
import useDialogOverflow from '../../hooks/useDialogOverflow';

const VerificationDialog = observer(({
  isOpen,
  onClose,
  onVerify,
  onResend,
  type, // 'phone', 'email', or 'dual'
  contact, // phone number or email (for single verification)
  phone, // phone number (for dual verification)
  email, // email (for dual verification)
  error,
  isLoading
}) => {
  const [phoneCode, setPhoneCode] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneCountdown, setPhoneCountdown] = useState(0);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [countdown, setCountdown] = useState(0);

  useDialogOverflow(isOpen);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (phoneCountdown > 0) {
      const timer = setTimeout(() => setPhoneCountdown(phoneCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [phoneCountdown]);

  useEffect(() => {
    if (emailCountdown > 0) {
      const timer = setTimeout(() => setEmailCountdown(emailCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [emailCountdown]);

  useEffect(() => {
    if (isOpen) {
      setVerificationCode('');
      setPhoneCode('');
      setEmailCode('');
      setCountdown(60);
      setPhoneCountdown(60);
      setEmailCountdown(60);
    }
  }, [isOpen]);

  const handleVerificationCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setVerificationCode(value);
  };

  const handlePhoneCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setPhoneCode(value);
  };

  const handleEmailCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setEmailCode(value);
  };

  const handleVerify = () => {
    if (type === 'dual') {
      if (phoneCode && emailCode && onVerify) {
        onVerify(phoneCode, emailCode);
      }
    } else {
      if (verificationCode && onVerify) {
        onVerify(verificationCode);
      }
    }
  };

  const handleResend = () => {
    if (countdown === 0 && !isLoading && onResend) {
      onResend();
      setCountdown(60);
    }
  };

  const handlePhoneResend = () => {
    if (phoneCountdown === 0 && !isLoading && onResend) {
      onResend('phone');
      setPhoneCountdown(60);
    }
  };

  const handleEmailResend = () => {
    if (emailCountdown === 0 && !isLoading && onResend) {
      onResend('email');
      setEmailCountdown(60);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 px-6 pb-4">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                {type === 'dual' ? t('user.edit.dualVerification') : t(`user.edit.${type}Verification`)}
              </h3>
              {isLoading && (
                <AiOutlineLoading3Quarters className="animate-spin text-blue-500 ml-4" size={20} />
              )}
            </div>
            <div className="mb-6" />
            
            {type === 'dual' ? (
              <div className="space-y-4">
                {/* Phone verification */}
                <div className="mb-4">
                  <label htmlFor="phone-code" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('user.edit.phoneVerificationCode')}
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      id="phone-code"
                      className="flex-1 rounded-l-md border-gray-300 border p-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('user.edit.enterVerificationCode')}
                      value={phoneCode}
                      onChange={handlePhoneCodeChange}
                      maxLength={6}
                      disabled={isLoading}
                    />
                    <button
                      className={`rounded-r-md border border-gray-300 bg-gray-50 px-3 text-sm ${
                        phoneCountdown > 0 || isLoading ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-gray-100'
                      }`}
                      onClick={handlePhoneResend}
                      disabled={phoneCountdown > 0 || isLoading}
                    >
                      {phoneCountdown > 0 ? t('user.edit.countdown', { seconds: phoneCountdown }) : t('user.edit.resendCode')}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('user.edit.codeSentTo')} {phone}
                  </p>
                </div>

                {/* Email verification */}
                <div className="mb-4">
                  <label htmlFor="email-code" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('user.edit.emailVerificationCode')}
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      id="email-code"
                      className="flex-1 rounded-l-md border-gray-300 border p-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={t('user.edit.enterVerificationCode')}
                      value={emailCode}
                      onChange={handleEmailCodeChange}
                      maxLength={6}
                      disabled={isLoading}
                    />
                    <button
                      className={`rounded-r-md border border-gray-300 bg-gray-50 px-3 text-sm ${
                        emailCountdown > 0 || isLoading ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-gray-100'
                      }`}
                      onClick={handleEmailResend}
                      disabled={emailCountdown > 0 || isLoading}
                    >
                      {emailCountdown > 0 ? t('user.edit.countdown', { seconds: emailCountdown }) : t('user.edit.resendCode')}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('user.edit.codeSentTo')} {email}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('user.edit.verificationCode')}
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="verification-code"
                    className="flex-1 rounded-l-md border-gray-300 border p-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('user.edit.enterVerificationCode')}
                    value={verificationCode}
                    onChange={handleVerificationCodeChange}
                    maxLength={6}
                    disabled={isLoading}
                  />
                  <button
                    className={`rounded-r-md border border-gray-300 bg-gray-50 px-3 text-sm ${
                      countdown > 0 || isLoading ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-gray-100'
                    }`}
                    onClick={handleResend}
                    disabled={countdown > 0 || isLoading}
                  >
                    {countdown > 0 ? t('user.edit.countdown', { seconds: countdown }) : t('user.edit.resendCode')}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {t('user.edit.codeSentTo')} {contact}
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 text-red-600 text-sm">{error}</div>
            )}
          </div>
          
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleVerify}
              className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                isLoading || (type === 'dual' ? (!phoneCode || !emailCode) : !verificationCode)
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={isLoading || (type === 'dual' ? (!phoneCode || !emailCode) : !verificationCode)}
            >
              {isLoading ? t('common.loading') : t('user.edit.verifyCode')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
});

export default VerificationDialog;