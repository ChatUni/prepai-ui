# WeChat Pay SSL Certificate Fix

## Problem Description

The WeChat Pay refund API was returning a "400 No required SSL certificate was sent" error. This occurs because WeChat Pay's secure APIs (like `/secapi/pay/refund`) require mutual TLS authentication using SSL client certificates.

## Root Cause

The original implementation used a standard HTTPS request without SSL client certificates. WeChat Pay's refund endpoint requires:

1. **Client Certificate** (`apiclient_cert.pem`) - Identifies your merchant account
2. **Private Key** (`apiclient_key.pem`) - Used for SSL handshake
3. **Root CA Certificate** (`rootca.pem`) - Optional, for certificate chain validation

## Solution Implemented

### 1. Environment Variables Added

Added SSL certificate configuration to `.env`:

```env
WECHAT_CERT_PATH="./server/certs/apiclient_cert.pem"
WECHAT_KEY_PATH="./server/certs/apiclient_key.pem"
WECHAT_CA_PATH="./server/certs/rootca.pem"
```

### 2. New Secure Request Method

Created `makeSecureRequest()` method in `WeChatPay` class that:

- Loads SSL certificates from configured paths
- Validates certificate file existence
- Configures HTTPS request with client certificates
- Handles SSL-specific errors with detailed messages

### 3. Updated Refund Method

Modified the `refund()` method to use `makeSecureRequest()` instead of `makeRequest()` for the `/secapi/pay/refund` endpoint.

### 4. Security Enhancements

- Added certificate files to `.gitignore` to prevent accidental commits
- Created secure certificate directory structure
- Added comprehensive documentation for certificate setup

## Files Modified

1. **`.env`** - Added SSL certificate path configurations
2. **`server/utils/wechat.js`** - Added secure request method and updated refund function
3. **`.gitignore`** - Added certificate file exclusions
4. **`server/certs/README.md`** - Created certificate setup instructions

## Certificate Setup Required

To complete the fix, you need to:

1. **Download certificates from WeChat Pay Merchant Platform**
   - Login to https://pay.weixin.qq.com/
   - Go to Account Center → API Security
   - Download API certificate package

2. **Place certificates in `server/certs/` directory**
   - `apiclient_cert.pem` - Client certificate
   - `apiclient_key.pem` - Private key
   - `rootca.pem` - Root CA (optional)

3. **Set secure file permissions**
   ```bash
   chmod 600 server/certs/*.pem
   ```

## Error Handling

The new implementation provides detailed error messages for:

- Missing certificate configuration
- Certificate file not found
- SSL handshake failures
- Certificate format issues

## Testing

After placing the certificates, test the refund functionality:

```javascript
// Example refund request
const result = await wechat_refund({}, {
  orderId: 'your_order_id',
  refundAmount: 1.00,
  refundDesc: 'Test refund'
});
```

## Security Notes

- **Never commit certificates to version control**
- Use different certificates for development/production
- Regularly rotate certificates as per WeChat Pay guidelines
- Ensure certificates match your merchant ID

## Troubleshooting

Common issues and solutions:

1. **"SSL certificate file not found"**
   - Verify certificate files exist in `server/certs/`
   - Check file paths in environment variables

2. **"SSL handshake failed"**
   - Ensure certificates are in PEM format (not P12)
   - Verify certificates match your merchant ID
   - Check certificate expiration dates

3. **"Invalid certificate format"**
   - Convert P12 to PEM if needed:
     ```bash
     openssl pkcs12 -in apiclient_cert.p12 -out apiclient_cert.pem -clcerts -nokeys
     openssl pkcs12 -in apiclient_cert.p12 -out apiclient_key.pem -nocerts -nodes
     ```

## Production Considerations

- Set `NODE_ENV=production` to enable strict certificate verification
- Use environment-specific certificate files
- Monitor certificate expiration dates
- Implement certificate rotation procedures

This fix resolves the SSL certificate requirement for WeChat Pay refund operations while maintaining security best practices.