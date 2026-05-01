'use strict';

const { validate } = require('deep-email-validator');

// Well-known disposable / fake domains not always caught by the library
const EXTRA_BLOCKED_DOMAINS = new Set([
  'example.com', 'example.org', 'example.net',
  'test.com', 'test.org', 'test.net',
  'fake.com', 'invalid.com', 'nowhere.com',
  'sample.com', 'domain.com', 'email.com',
  'noemail.com', 'nomail.com', 'noreply.com',
  'placeholder.com', 'dummy.com', 'abc.com',
  'xyz.com', 'foo.com', 'bar.com', 'baz.com',
  'asdf.com', 'qwerty.com', 'aaa.com', 'zzz.com',
  'tempmail.com', 'throwam.com', 'dispostable.com',
  'mailnull.com', 'spamgourmet.com', 'spamgourmet.net',
]);

/**
 * Validates that an email address is real and deliverable.
 * Checks: format, typo detection, disposable domain list, MX DNS records.
 * SMTP probing is intentionally disabled — most providers block it.
 *
 * @param {string} email
 * @returns {Promise<{ valid: boolean, reason: string|null }>}
 */
async function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, reason: 'Email is required.' };
  }

  const lower = email.trim().toLowerCase();

  // Block extra known fake domains
  const domain = lower.split('@')[1];
  if (domain && EXTRA_BLOCKED_DOMAINS.has(domain)) {
    return { valid: false, reason: `The email domain "${domain}" is not accepted. Please use a real email address.` };
  }

  try {
    const result = await validate({
      email: lower,
      validateSMTP: false, // skip SMTP — most providers block probing
    });

    if (result.valid) {
      return { valid: true, reason: null };
    }

    // Map validator reasons to user-friendly messages
    const reasonMap = {
      regex:      'Please enter a valid email address format.',
      typo:       'This email domain does not look real. Please check for typos.',
      disposable: 'Disposable or temporary email addresses are not allowed.',
      mx:         'This email domain has no mail server. Please use a real email address.',
    };

    const message = reasonMap[result.reason] || 'Please provide a valid, real email address.';
    return { valid: false, reason: message };
  } catch (err) {
    // If DNS lookup fails due to network issues, fall back to format-only check
    console.warn('[validateEmail] DNS lookup failed, falling back to format check:', err.message);
    const formatOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lower);
    return formatOk
      ? { valid: true, reason: null }
      : { valid: false, reason: 'Please enter a valid email address format.' };
  }
}

module.exports = validateEmail;
