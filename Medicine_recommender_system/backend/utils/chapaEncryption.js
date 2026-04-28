const crypto = require('crypto');

/**
 * Encrypts data using 3DES (Triple DES) in ECB mode as required by Chapa Direct API.
 * @param {string} plainText - The JSON stringified payload to encrypt.
 * @param {string} encryptionKey - Your Chapa encryption key.
 * @returns {string} - The Base64 encoded encrypted string.
 */
function encrypt3DES(plainText, encryptionKey) {
  const blockSize = 8;
  
  // Calculate padding (Zero Padding/PKCS7-like requirements for 3DES)
  const padDiff = blockSize - (plainText.length % blockSize);
  const padding = Buffer.alloc(padDiff, padDiff);
  
  const inputBuffer = Buffer.concat([Buffer.from(plainText, 'utf8'), padding]);

  // Setup 3DES (des-ede3) cipher. In node.js crypto, 'des-ede3' with a null IV defaults to ECB mode.
  const cipher = crypto.createCipheriv('des-ede3', Buffer.from(encryptionKey, 'utf8'), null);
  cipher.setAutoPadding(false); // We handle padding manually
  
  // Encrypt and encode
  const encrypted = Buffer.concat([cipher.update(inputBuffer), cipher.final()]);
  
  return encrypted.toString('base64');
}

module.exports = {
  encrypt3DES
};
