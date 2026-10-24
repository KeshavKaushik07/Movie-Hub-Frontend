/**
 * Frontend Security & Sanitization Utilities (Requirement 3)
 * Protects against XSS payloads, dangerous URI schemes (javascript:/data:text/html),
 * prototype pollution in Web Storage JSON, and oversized/malformed inputs.
 */

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /on\w+\s*=\s*[^\s>]+/gi,
  /<iframe\b[^>]*>/gi,
  /<object\b[^>]*>/gi,
  /<embed\b[^>]*>/gi,
];

/**
 * Strips dangerous script/HTML/event-handler payloads from user strings.
 */
export function sanitizeText(value, maxLength = 5000) {
  if (typeof value !== 'string') return '';
  let cleaned = value;
  for (const pattern of DANGEROUS_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  // Remove null bytes
  cleaned = cleaned.replace(/\0/g, '');
  if (maxLength && cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }
  return cleaned;
}

/**
 * Recursively sanitizes outgoing request objects/arrays (blocks prototype pollution
 * keys like __proto__, constructor, prototype and strips script payloads).
 */
export function sanitizePayload(input, depth = 0) {
  if (depth > 8 || input === null || input === undefined) return input;
  if (typeof input === 'string') {
    return sanitizeText(input, 25000);
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizePayload(item, depth + 1));
  }
  if (typeof FormData !== 'undefined' && input instanceof FormData) return input;
  if (typeof URLSearchParams !== 'undefined' && input instanceof URLSearchParams) return input;
  if (Object.prototype.toString.call(input) === '[object Object]') {
    const safeObj = {};
    for (const [k, v] of Object.entries(input)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype' || k.startsWith('$')) {
        continue;
      }
      safeObj[k] = sanitizePayload(v, depth + 1);
    }
    return safeObj;
  }
  return input;
}

/**
 * Verifies that a URL is safe to render in <img src> or <a href>.
 * Blocks javascript:, vbscript:, and executable data: URIs while allowing
 * http:, https:, safe data:image/svg+xml placeholders, and relative paths.
 */
export function isSafeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return !trimmed.startsWith('//');
  }
  if (trimmed.startsWith('data:image/')) {
    return true;
  }
  try {
    const parsed = new URL(trimmed, window.location.origin);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Safely parses JSON from localStorage/sessionStorage and strips prototype pollution keys.
 */
export function safeJsonParse(raw, fallback = null) {
  if (!raw || typeof raw !== 'string') return fallback;
  try {
    const parsed = JSON.parse(raw);
    return sanitizePayload(parsed);
  } catch {
    return fallback;
  }
}
