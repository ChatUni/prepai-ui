const COS = require('cos-nodejs-sdk-v5');

const cos = new COS({
  SecretId: process.env.TENCENT_SECRETID,
  SecretKey: process.env.TENCENT_SECRETKEY,
  Protocol: 'https:'
});

const getSignedUrl = (params) => {
  return new Promise((resolve, reject) => {
    cos.getObjectUrl({
      ...params,
      Sign: true,
      Method: 'GET',
      Expires: 43200, // 12 hours
      Protocol: 'https:',
      Domain: `${params.Bucket}.cos.${params.Region}.myqcloud.com`
    }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.Url);
      }
    });
  });
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  try {
    const { file, key } = JSON.parse(event.body);
    const fileBuffer = Buffer.from(file.split(',')[1], 'base64');
    const contentType = file.match(/data:(.*);base64/)[1];

    // Upload the file
    await new Promise((resolve, reject) => {
      cos.putObject({
        Bucket: process.env.TENCENT_BUCKET,
        Region: process.env.TENCENT_REGION,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType
      }, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });

    // Verify the upload was successful
    await new Promise((resolve, reject) => {
      cos.headObject({
        Bucket: process.env.TENCENT_BUCKET,
        Region: process.env.TENCENT_REGION,
        Key: key
      }, (err, data) => {
        if (err) {
          reject(new Error('Upload verification failed'));
        } else {
          resolve(data);
        }
      });
    });

    // Get signed URL with Method-Override header
    const signedUrl = await getSignedUrl({
      Bucket: process.env.TENCENT_BUCKET,
      Region: process.env.TENCENT_REGION,
      Key: key,
      Headers: {
        'Method-Override': 'GET'
      }
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        url: signedUrl
      })
    };
  } catch (error) {
    console.error('Error uploading to COS:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ error: 'Failed to upload file' })
    };
  }
};