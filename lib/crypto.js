import crypto from 'crypto';

const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function bufferToBase32(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += charset[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += charset[(value << (5 - bits)) & 31];
  }
  return output;
}

export function deriveSecretFromPassword(password) {
  const masterSecret = process.env.TOTP_SECRET;
  if (!masterSecret) {
    throw new Error('TOTP_SECRET must be configured before generating secrets');
  }

  const hmac = crypto.createHmac('sha256', masterSecret);
  hmac.update(password);
  const hash = hmac.digest();

  // Take first 10 bytes = 80 bits = 16 Base32 characters
  return bufferToBase32(hash.subarray(0, 10));
}
