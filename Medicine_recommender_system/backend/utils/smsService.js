const twilio = require('twilio');

// Initialize Twilio client if credentials exist in environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let client = null;
if (accountSid && authToken) {
  try {
    client = twilio(accountSid, authToken);
    console.log('Twilio SMS service initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Twilio client:', error.message);
  }
} else {
  console.log('Twilio credentials not found in .env. SMS service will run in Mock Mode.');
}

/**
 * Sends an SMS message to a specified phone number.
 * If Twilio is not configured, it will log the mock message to the console.
 * 
 * @param {string} toPhoneNumber - The recipient's phone number + country code (e.g., +251911234567)
 * @param {string} body - The text message contents
 * @returns {Promise<boolean>} - True if sent (or mocked) successfully
 */
exports.sendSMS = async (toPhoneNumber, body) => {
  if (!toPhoneNumber) {
    console.warn('[SMS Failed] No destination phone number provided.');
    return false;
  }

  // Fallback to Mock Mode if Twilio is not configured
  if (!client || !fromPhoneNumber) {
    console.log('\n================ MOCK SMS LOG ================');
    console.log(`To:   ${toPhoneNumber}`);
    console.log(`From: HealthConnect System`);
    console.log(`Body: ${body}\n==============================================\n`);
    return true; // Return true as it 'gracefully' handled the lack of a real carrier
  }

  try {
    const message = await client.messages.create({
      body: body,
      from: fromPhoneNumber,
      to: toPhoneNumber
    });
    
    console.log(`[Twilio SMS] Successfully dispatched SMS via SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error(`[Twilio Error] Failed to send SMS to ${toPhoneNumber}:`, error.message);
    return false;
  }
};
