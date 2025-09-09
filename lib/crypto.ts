import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import { env } from './env';

// Chave de criptografia (deve estar no .env)
const ENCRYPTION_KEY = env.ENCRYPTION_KEY || 'your-32-char-secret-key-here-123';

if (!env.ENCRYPTION_KEY) {
  console.warn('⚠️ ENCRYPTION_KEY não está definida no .env - usando chave padrão (inseguro)');
}

export function encryptToken(token: string): string {
  try {
    const key = createHash('sha256').update(ENCRYPTION_KEY).digest(); // 32 bytes
    // AES-256-GCM com IV/nonce de 12 bytes (recomendado)
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    // Formato: gcm:ivHex:cipherHex:tagHex
    return `gcm:${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
  } catch (error) {
    console.error('Erro ao criptografar token:', error);
    throw new Error('Falha na criptografia do token');
  }
}

export function decryptToken(encryptedToken: string): string {
  try {
    const key = createHash('sha256').update(ENCRYPTION_KEY).digest();
    const parts = encryptedToken.split(':');

    // Novo formato: gcm:iv:cipher:tag
    if (parts.length === 4 && parts[0] === 'gcm') {
      const [, ivHex, cipherHex, tagHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const encrypted = Buffer.from(cipherHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      const decipher = createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      return decrypted.toString('utf8');
    }

    // Legado (CBC): iv:cipher
    if (parts.length === 2) {
      const [ivHex, cipherHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const encrypted = Buffer.from(cipherHex, 'hex');
      const decipher = createDecipheriv('aes-256-cbc', key, iv);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      return decrypted.toString('utf8');
    }

    throw new Error('Formato do token criptografado inválido');
  } catch (error) {
    console.error('Erro ao descriptografar token:', error);
    throw new Error('Falha na descriptografia do token');
  }
}
