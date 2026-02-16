// Simple client-side obfuscation/encryption to prevent plain-text storage
// Note: In a purely client-side app without a user password, this is obfuscation.
const SECRET_SALT = "AI_SLIDE_EDITOR_V1_SALT";

const xorEncrypt = (text: string): string => {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ SECRET_SALT.charCodeAt(i % SECRET_SALT.length));
  }
  return result;
};

export const saveApiKey = (apiKey: string): void => {
  if (!apiKey) return;
  const encrypted = btoa(xorEncrypt(apiKey));
  localStorage.setItem('gemini_api_key_enc', encrypted);
};

export const loadApiKey = (): string | null => {
  const encrypted = localStorage.getItem('gemini_api_key_enc');
  if (!encrypted) return null;
  try {
    const decrypted = xorEncrypt(atob(encrypted));
    return decrypted;
  } catch (e) {
    console.error("Failed to decrypt key", e);
    return null;
  }
};

export const clearApiKey = (): void => {
  localStorage.removeItem('gemini_api_key_enc');
};