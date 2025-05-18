require('dotenv').config();
const path = require('path');
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Enable CORS for localhost frontend (adjust in production)
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Load env variables
const {
  VIPPS_CLIENT_ID,
  VIPPS_CLIENT_SECRET,
  VIPPS_SUBSCRIPTION_KEY,
  VIPPS_MERCHANT_SERIAL_NUMBER,
  VIPPS_SYSTEM_NAME,
  VIPPS_SYSTEM_VERSION,
  VIPPS_PLUGIN_NAME,
  VIPPS_PLUGIN_VERSION,
  VIPPS_OAUTH_URL,
  VIPPS_PAYMENT_URL,
} = process.env;

// Function to get Vipps access token
async function getAccessToken() {
  try {
    const response = await axios.post(
      VIPPS_OAUTH_URL,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          client_id: VIPPS_CLIENT_ID,
          client_secret: VIPPS_CLIENT_SECRET,
          'Ocp-Apim-Subscription-Key': VIPPS_SUBSCRIPTION_KEY,
          'Merchant-Serial-Number': VIPPS_MERCHANT_SERIAL_NUMBER,
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting Vipps access token:', error.response?.data || error.message);
    throw error;
  }
}

// Helper to mask URLs and tokens with friendly messages before logging
function maskUrlsWithMessage(obj) {
  const copy = { ...obj };

  if (copy.url) {
    copy.url = 'Redirect URL hidden for security';
  }
  if (copy.redirectUrl) {
    copy.redirectUrl = 'Redirect URL hidden for security';
  }
  if (copy.token) {
    copy.token = 'Token hidden for security';
  }
  if (copy.paymentToken) {
    copy.paymentToken = 'Token hidden for security';
  }
  if (copy.data?.token) {
    copy.data.token = 'Token hidden for security';
  }

  return copy;
}

// API endpoint to create payment
app.post('/create-payment', async (req, res) => {
  const { amountValue, phoneNumber, reference, returnUrl, paymentDescription } = req.body;

  try {
    const accessToken = await getAccessToken();

    const paymentPayload = {
      amount: { currency: 'NOK', value: amountValue },
      paymentMethod: { type: 'WALLET' },
      customer: { phoneNumber },
      reference,
      returnUrl,
      userFlow: 'WEB_REDIRECT',
      paymentDescription,
    };

    const idempotencyKey = `order-${Date.now()}`;

    const response = await axios.post(VIPPS_PAYMENT_URL, paymentPayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Ocp-Apim-Subscription-Key': VIPPS_SUBSCRIPTION_KEY,
        'Merchant-Serial-Number': VIPPS_MERCHANT_SERIAL_NUMBER,
        'Vipps-System-Name': VIPPS_SYSTEM_NAME,
        'Vipps-System-Version': VIPPS_SYSTEM_VERSION,
        'Vipps-System-Plugin-Name': VIPPS_PLUGIN_NAME,
        'Vipps-System-Plugin-Version': VIPPS_PLUGIN_VERSION,
        'Idempotency-Key': idempotencyKey,
        'Content-Type': 'application/json',
      },
    });

    // Mask URLs and tokens with friendly messages before logging
    const maskedResponseData = maskUrlsWithMessage(response.data);
    console.log('Vipps payment response:', JSON.stringify(maskedResponseData, null, 2));

    let vippsRedirectUrl = response.data.url || response.data.redirectUrl;

    if (!vippsRedirectUrl) {
      const token =
        response.data.token ||
        response.data.paymentToken ||
        response.data.data?.token ||
        null;

      if (!token) {
        console.warn('Vipps payment token or redirect URL not found in response');
        return res.status(500).json({ error: 'Vipps payment token not found' });
      }

      vippsRedirectUrl = `https://apitest.vipps.no/dwo-api-application/v1/deeplink/vippsgateway?v=2&token=${token}`;
    }

    // Log the redirect URL as a hidden message instead of actual URL
    console.log('Vipps redirect URL:', '[Redirect URL hidden for security]');

    return res.json({ url: vippsRedirectUrl });
  } catch (error) {
    console.error('Error creating Vipps payment:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Failed to create Vipps payment',
      details: error.response?.data || error.message,
    });
  }
});

// Serve static React build files
app.use(express.static(path.resolve(__dirname, 'build')));

app.get('/*path', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'build', 'index.html'), (err) => {
    if (err) {
      console.error(err);
      res.status(500).send(err);
    }
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Vipps backend listening on port ${PORT}`);
});
