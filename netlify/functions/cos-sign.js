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
    const { url } = JSON.parse(event.body);
    
    // Extract key from the URL
    const urlPattern = new RegExp(`https://${process.env.TENCENT_BUCKET}\\.cos\\.${process.env.TENCENT_REGION}\\.myqcloud\\.com/(.+?)(?:\\?|$)`);
    const match = url.match(urlPattern);
    
    if (!match) {
      throw new Error('Invalid COS URL format');
    }

    const key = decodeURIComponent(match[1]);

    // Check if object exists
    try {
      await new Promise((resolve, reject) => {
        cos.headObject({
          Bucket: process.env.TENCENT_BUCKET,
          Region: process.env.TENCENT_REGION,
          Key: key
        }, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
    } catch (error) {
      console.error('Object does not exist:', error);
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({ error: 'File not found' })
      };
    }
    const signedUrl = await getSignedUrl({
      Bucket: process.env.TENCENT_BUCKET,
      Region: process.env.TENCENT_REGION,
      Key: key
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
    console.error('Error generating signed URL:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ error: 'Failed to generate signed URL' })
    };
  }
};