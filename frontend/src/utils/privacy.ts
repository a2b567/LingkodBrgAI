/**
 * Data Privacy & Encryption Utilities (DPA RA 10173 Compliant)
 * LingkodBrgy Citizen Data Protection
 */

/**
 * Mask Phone Number: e.g. "09171234567" -> "0917 •••• 567"
 */
export const maskPhone = (phone?: string): string => {
  if (!phone || typeof phone !== 'string') return '—';
  const clean = phone.replace(/[\s-]/g, '');
  if (clean.length <= 4) return '••••';
  const start = clean.slice(0, 4);
  const end = clean.slice(-3);
  return `${start} •••• ${end}`;
};

/**
 * Mask Email Address: e.g. "juan.delacruz@gmail.com" -> "j•••••z@gmail.com"
 */
export const maskEmail = (email?: string): string => {
  if (!email || typeof email !== 'string') return '—';
  const parts = email.split('@');
  if (parts.length !== 2) return '•••••••';
  const [username, domain] = parts;
  if (username.length <= 2) {
    return `${username[0]}•••@${domain}`;
  }
  const first = username[0];
  const last = username[username.length - 1];
  return `${first}•••••${last}@${domain}`;
};

/**
 * Mask Full Address: e.g. "Block 12 Lot 5, Mabini St., Brgy. San Isidro" -> "Block 12 •••••••••••••"
 */
export const maskAddress = (address?: string): string => {
  if (!address || typeof address !== 'string') return '—';
  const words = address.split(',');
  if (words.length > 1) {
    return `${words[0].trim()}, ••••••••••`;
  }
  if (address.length > 10) {
    return `${address.slice(0, 8)} ••••••••••`;
  }
  return '••••••••••••';
};

/**
 * Mask Full Name (For confidential blotter/juvenile cases): e.g. "Juan Dela Cruz" -> "J••• D••• C•••"
 */
export const maskName = (name?: string): string => {
  if (!name || typeof name !== 'string') return '—';
  return name
    .split(' ')
    .filter(Boolean)
    .map(part => (part.length > 1 ? `${part[0]}${'•'.repeat(Math.min(3, part.length - 1))}` : part))
    .join(' ');
};

/**
 * Mask Financial / Income Amount: e.g. 15000 -> "₱ ••,•••.00"
 */
export const maskMoney = (amount?: number | string): string => {
  if (amount === undefined || amount === null || amount === '') return '—';
  return '₱ ••,•••.00';
};

/**
 * Mask Birthdate: e.g. "1995-08-20" -> "••••-••-20"
 */
export const maskBirthdate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '••••-••-••';
    const day = String(d.getDate()).padStart(2, '0');
    return `••••-••-${day}`;
  } catch {
    return '••••-••-••';
  }
};

/**
 * Mask Government ID / PhilSys / TIN / SSS: e.g. "1234-5678-9012" -> "••••-••••-9012"
 */
export const maskIdNumber = (id?: string): string => {
  if (!id || typeof id !== 'string') return '—';
  const clean = id.replace(/[\s-]/g, '');
  if (clean.length <= 4) return '••••';
  const end = clean.slice(-4);
  return `••••-••••-${end}`;
};

/**
 * Simple reversible client-side encryption for cached confidential notes/drafts
 */
const SECRET_SALT = 'LINGKOD_BRGY_ENCRYPT_SALT_2026';

export const encryptText = (plainText: string): string => {
  if (!plainText) return '';
  try {
    const textToChars = (text: string) => text.split('').map(c => c.charCodeAt(0));
    const byteHex = (n: number) => ('0' + Number(n).toString(16)).slice(-2);
    const applySaltToChar = (code: number, idx: number) =>
      code ^ SECRET_SALT.charCodeAt(idx % SECRET_SALT.length);

    return plainText
      .split('')
      .map(textToChars)
      .map((chars, idx) => applySaltToChar(chars[0], idx))
      .map(byteHex)
      .join('');
  } catch {
    return btoa(unescape(encodeURIComponent(plainText)));
  }
};

export const decryptText = (cipherHex: string): string => {
  if (!cipherHex) return '';
  try {
    const applySaltToChar = (code: number, idx: number) =>
      code ^ SECRET_SALT.charCodeAt(idx % SECRET_SALT.length);

    const matches = cipherHex.match(/.{1,2}/g);
    if (!matches) return '';

    return matches
      .map(hex => parseInt(hex, 16))
      .map((code, idx) => applySaltToChar(code, idx))
      .map(charCode => String.fromCharCode(charCode))
      .join('');
  } catch {
    try {
      return decodeURIComponent(escape(atob(cipherHex)));
    } catch {
      return cipherHex;
    }
  }
};
