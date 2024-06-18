const fs = require('fs');


const readKeyFile = (keyFile) => {
  return (fs.readFileSync(keyFile).toString().split("-----"))[2].replaceAll('\n','').replaceAll('\r','');
}

const readAsn1Signature = (asn1Signature) => {
  let file = fs.readFileSync(asn1Signature).toString();
  let vect = file.split("\n");
  let signature1 = (vect[1].split(':'))[3];
  let signature2 = (vect[2].split(':'))[3];
  return signature1 + signature2;
}

const ab2str = (buf) => {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

const convertToU8Array = (input) => {
  let ret = u8[input.length];
  for (let i = 0; i < input.length; ++i)
      ret[i] = input[i];

  return ret;
}

function base64ToArrayBuffer(base64) {
  var binaryString = atob(base64);
  var bytes = new Uint8Array(binaryString.length);
  for (var i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer) {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
      binary += String.fromCharCode( bytes[ i ] );
  }
  return btoa( binary );
}

function getMessageEncoding(message) {
  let enc = new TextEncoder();
  return enc.encode(message);
}

function rmPemDecorators(pemFile) {
  pemFile = pemFile.replace('-----BEGIN EC PRIVATE KEY-----','');
  pemFile = pemFile.replace('-----END EC PRIVATE KEY-----','');
  pemFile = pemFile.replace(/\n/g,'');
  return pemFile;
}

module.exports = {
  readKeyFile,
  readAsn1Signature,
  ab2str,
  convertToU8Array,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  getMessageEncoding,
  rmPemDecorators
}
