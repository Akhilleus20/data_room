const fs = require('fs');
const { subtle_GenerateKey, subtle_ExportPublicKey, subtle_Hash, subtle_Sign, subtle_Verify } = require('./subtle');
const { klaveDeployApp, klaveTransaction, klaveQuery, klaveCloseConnection, klaveOpenConnection } = require('../../klave_network');
const { base64ToArrayBuffer, getMessageEncoding, arrayBufferToBase64 } = require('../../utils');
const { importPrivateKey, getPublicKey, sign } = require('./test_sdk');

//wasm to deploy must be copied post generation coming from yarn build command
const app_id = "test_dataroom";
const fqdn = "test_dataroom_smart_contract_3";
const WASM_TEST_DATAROOM = './config/wasm/dataroom.b64';

const deployDataRoom = async () => {
  let user_connected = await klaveOpenConnection(`klave1`);
  console.log("user_connected: ", user_connected);
  if (user_connected)
  {
    await klaveDeployApp(app_id, fqdn, WASM_TEST_DATAROOM);
  }
  klaveCloseConnection();
}

const createDataRoom = async () => {
  let result = await klaveTransaction(fqdn,"createDataRoom", "");
  return result.message.split(":")[1].trim();
}

const listDataRooms = async () => {
  let result = await klaveTransaction(fqdn,"listDataRooms", "");
  return result.message;
}

const updateDataRoom = async (dataRoomId, filepath, webSvrPrivKey) => {
  //Create a digest of the file defined by filepath
  let file = null;
  try {
    file = fs.readFileSync(filepath);
  }
  catch (err) {
    console.error("Error reading file: ", err);
    return;
  }

  let digest = await subtle_Hash(file);

  //Token is a b64 concatenation between the file digest, the time and the signature of the couple {file digest, time}
  let time = new Date().getTime();
  let timeBuffer = new ArrayBuffer(8);
  let timeView = new DataView(timeBuffer);
  timeView.setBigInt64(0, BigInt(time), true);

  let tokenSign = new Uint8Array(digest.byteLength + timeBuffer.byteLength);

  tokenSign.set(new Uint8Array(digest), 0);
  tokenSign.set(new Uint8Array(timeBuffer), digest.byteLength);

  let digestB64 = arrayBufferToBase64(digest);
  let tokenSignB64 = arrayBufferToBase64(tokenSign);

  let signatureB64 = await sign(webSvrPrivKey, tokenSignB64);
  let signature = base64ToArrayBuffer(signatureB64);

  let token = new Uint8Array(digest.byteLength + timeBuffer.byteLength + signature.byteLength);
  token.set(new Uint8Array(digest), 0);
  token.set(new Uint8Array(timeBuffer), digest.byteLength);
  token.set(new Uint8Array(signature), digest.byteLength + timeBuffer.byteLength);  

  let tokenB64 = arrayBufferToBase64(token);

  let updateDRInput = {
    "dataRoomId": dataRoomId,
    "operation": "addFile",
    "file": {
      "name":"some_secret_file.txt",
      "digestB64": digestB64,
      "type": "",
      "key": "",
      "tokenB64": tokenB64
    }
  };

  let result = await klaveTransaction(fqdn,"updateDataRoom", updateDRInput);
  return result.success;
}

const setTokenIdentity = async () => {
  let result = await klaveTransaction(fqdn, "setTokenIdentity", "unused");
  return result.message.split(":")[1].trim();
}

const setWebServerTokenIdentity = async (spkiPublicKey) => {
  let result = await klaveTransaction(fqdn, "setWebServerTokenIdentity", spkiPublicKey);
  return result.message.split(":")[1].trim();
}

const getTokenIdentity = async () => {
  let result = await klaveQuery(fqdn, "getTokenIdentity", "");  
  return result;
}

const testDataRoom = async (user) => {
  let user_connected = await klaveOpenConnection('klave1');
  console.log("user_connected: ", user_connected);

  if (user_connected) {
    //Set backend identity
    let backendKey = await setTokenIdentity();
    
    //Create crypto keyPairs with subtle
    let webServerPrivateKeyFile = fs.readFileSync('./config/webServerPrivateKey/privateKey.pem');
    let webSvrKeyName = await importPrivateKey(webServerPrivateKeyFile.toString());
    let webSvrSpkiPubKey = await getPublicKey(webSvrKeyName);

    //Set webserver identity
    let webSvrKey = await setWebServerTokenIdentity(webSvrSpkiPubKey);

    //Get token identity
    let tokenIdentity = await getTokenIdentity();

    //Create a dataRoom
    let dataRoomId = await createDataRoom();

    //Check the dataRoom was actually created
    let datarooms = await listDataRooms();
    let found = datarooms.includes(dataRoomId);
    // console.assert(found, "DataRoom not found");

    //Add a file to the dataRoom
    let success = await updateDataRoom(dataRoomId, './config/exampleFiles/some_secret_file.txt', webSvrKeyName);
    console.assert(success, "Error updating dataRoom with new file");
  }
  klaveCloseConnection();  
}

module.exports = {
    deployDataRoom,
    testDataRoom,
}
