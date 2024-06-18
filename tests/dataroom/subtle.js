const { base64ToArrayBuffer } = require('../../utils');

const { subtle } = require('crypto').webcrypto;
  
const subtle_GenerateKey = async () => {
    let keyPair = await subtle.generateKey(
        {
        name: "ECDSA",
        namedCurve: "P-256",
        },
        true,
        ["sign", "verify"],
    );
    return keyPair;
}
    
const subtle_ExportPublicKey = async (pubCryptoKey) => {
    let exported = Buffer.from(await crypto.subtle.exportKey('spki', pubCryptoKey)).toString('base64');  
    console.log(exported);
    return exported;
}

const subtle_Hash = async (message) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);    
    const hash = await crypto.subtle.digest("SHA-256", data);        
    return hash;
}    

const subtle_Sign = async (privCryptoKey, message) => {
let enc = new TextEncoder();  
let signature = await subtle.sign(
    {
    name: "ECDSA",
    hash: { name: "SHA-256" },
    },
    privCryptoKey,
    enc.encode(message),
);
return signature;  
}

const subtle_Verify = async (pubCryptoKey, message, signature) => {
let enc = new TextEncoder();  
let result = await subtle.verify(
    {
    name: "ECDSA",
    hash: { name: "SHA-256" },
    },
    pubCryptoKey,
    base64ToArrayBuffer(signature),
    enc.encode(message),
);
return result;  
}
  
module.exports = {
    subtle_GenerateKey,
    subtle_ExportPublicKey,
    subtle_Hash,
    subtle_Sign,
    subtle_Verify
}
