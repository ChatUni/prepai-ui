# WeChat Pay SSL Certificates

This directory should contain the SSL certificates required for WeChat Pay secure API operations (like refunds).

## Required Files

1. **apiclient_cert.pem** - Client certificate
2. **apiclient_key.pem** - Client private key
3. **rootca.pem** - Root CA certificate (optional)

## How to Obtain Certificates

1. **Login to WeChat Pay Merchant Platform**
   - Go to https://pay.weixin.qq.com/
   - Login with your merchant account

2. **Download API Certificates**
   - Navigate to "Account Center" → "API Security"
   - Download the API certificate package
   - The package typically contains:
     - `apiclient_cert.p12` (PKCS#12 format)
     - `apiclient_cert.pem` (Certificate)
     - `apiclient_key.pem` (Private Key)
     - `rootca.pem` (Root CA)

3. **Place Certificates**
   - Copy the `.pem` files to this directory
   - Ensure file permissions are secure (600 or 400)

## File Permissions

Set appropriate permissions for security:

```bash
chmod 600 server/certs/apiclient_cert.pem
chmod 600 server/certs/apiclient_key.pem
chmod 600 server/certs/rootca.pem
```

## Environment Variables

The following environment variables are configured in `.env`:

- `WECHAT_CERT_PATH="./server/certs/apiclient_cert.pem"`
- `WECHAT_KEY_PATH="./server/certs/apiclient_key.pem"`
- `WECHAT_CA_PATH="./server/certs/rootca.pem"`

## Security Notes

- **Never commit these certificates to version control**
- Keep certificates secure and rotate them regularly
- Use different certificates for development and production environments
- The certificates are tied to your specific WeChat Pay merchant ID

## Troubleshooting

If you encounter SSL certificate errors:

1. Verify certificate files exist and have correct permissions
2. Ensure certificates match your merchant ID
3. Check certificate expiration dates
4. Verify the certificate format is PEM (not P12)

## Converting P12 to PEM (if needed)

If you only have the P12 certificate, convert it:

```bash
# Extract certificate
openssl pkcs12 -in apiclient_cert.p12 -out apiclient_cert.pem -clcerts -nokeys

# Extract private key
openssl pkcs12 -in apiclient_cert.p12 -out apiclient_key.pem -nocerts -nodes
```

The password for P12 files is typically your WeChat Pay Merchant ID.