import { RSA } from 'react-native-rsa-native';
import { error } from './common';

interface CryptoResult {
  success: boolean;
  data?: string;
  error?: string;
}

export const encrypt = async (publicKey: string, data: string): Promise<CryptoResult> => {
  try {
    const encrypted = await RSA.encrypt(data, publicKey);
    return { success: true, data: encrypted };
  } catch (err) {
    error('Error in Encryption', err);
    return { success: false, error: 'Failed to encrypt data' };
  }
};

export const decrypt = async (privateKey: string, encryptedData: string): Promise<CryptoResult> => {
  try {
    const decrypted = await RSA.decrypt(encryptedData, privateKey);
    return { success: true, data: decrypted };
  } catch (err) {
    error('Error in Decryption', err);
    return { success: false, error: 'Failed to decrypt data' };
  }
};

export const convertKeyToPem = (publicKeyXml: any) => {
  try {
    const forge = require('node-forge');
    // defensive: validate input
    if (!publicKeyXml || typeof publicKeyXml !== 'string') {
      throw new Error('Invalid publicKeyXml');
    }
    const modulusMatch = publicKeyXml.match(/<Modulus>([^<]+)<\/Modulus>/);
    const exponentMatch = publicKeyXml.match(/<Exponent>([^<]+)<\/Exponent>/);
    if (!modulusMatch || !exponentMatch) {
      throw new Error('Invalid XML public key format');
    }
    const modulusBase64 = modulusMatch[1];
    const exponentBase64 = exponentMatch[1];

    const modulusBytes = forge.util.decode64(modulusBase64);
    const exponentBytes = forge.util.decode64(exponentBase64);

    const modulus = new forge.jsbn.BigInteger(forge.util.bytesToHex(modulusBytes), 16);
    const exponent = new forge.jsbn.BigInteger(forge.util.bytesToHex(exponentBytes), 16);

    const publicKey = forge.pki.setRsaPublicKey(modulus, exponent);
    const pemPublicKey = forge.pki.publicKeyToPem(publicKey);
    return pemPublicKey;
  } catch (err) {
    console.log('[convertKeyToPem] error', err);
    return null;
  }
};

