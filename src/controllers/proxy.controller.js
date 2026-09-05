const axios = require('axios');
const FormData = require('form-data');

exports.proxyRequest = async (req, res) => {
  try {
    const isMultipart = req.is('multipart/form-data') || (req.files && req.files.length > 0);
    
    let method, url, headersStr, bodyData;
    let cleanHeaders = {};

    if (isMultipart) {
      method = req.body['Proxy-Method'];
      url = req.body['Proxy-Url'];
      headersStr = req.body['Proxy-Headers'];
      
      const formData = new FormData();
      
      // Append text fields
      for (const [key, value] of Object.entries(req.body)) {
        if (!key.startsWith('Proxy-')) {
          formData.append(key, value);
        }
      }
      
      // Append files
      if (req.files) {
        for (const file of req.files) {
          formData.append(file.fieldname, file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype,
          });
        }
      }
      
      bodyData = formData;
      if (headersStr) {
        try {
          cleanHeaders = JSON.parse(headersStr);
        } catch (e) {}
      }
      
      // Merge FormData headers (boundary) with custom headers
      cleanHeaders = {
        ...cleanHeaders,
        ...formData.getHeaders(),
      };
    } else {
      method = req.body.method;
      url = req.body.url;
      cleanHeaders = { ...(req.body.headers || {}) };
      bodyData = req.body.body;
    }

    if (!url) {
      return res.status(400).json({ message: 'URL is required for proxy' });
    }

    // Filter out restricted/unnecessary headers sent from the frontend
    delete cleanHeaders['host'];
    delete cleanHeaders['content-length'];
    delete cleanHeaders['origin'];
    delete cleanHeaders['referer'];
    
    // Some headers like transfer-encoding shouldn't be proxied blindly
    delete cleanHeaders['transfer-encoding'];

    const response = await axios({
      method: method || 'GET',
      url: url,
      headers: cleanHeaders,
      data: bodyData,
      validateStatus: () => true, // Don't throw errors for non-2xx status codes
      maxRedirects: 5,
    });

    // Send back the exact response from the target server but always as HTTP 200
    // so the frontend doesn't treat it as a proxy failure.
    res.status(200).json({
      status: response.status,
      headers: response.headers,
      data: response.data,
    });
  } catch (error) {
    console.error('Proxy Error:', error.message);
    res.status(500).json({
      message: 'Proxy Error: ' + error.message,
      details: error.response?.data,
    });
  }
};
