const connector = require('@secretarium/connector');
const crypto = require('@secretarium/crypto');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

let scp = undefined;

let requestCount = 0;
let scp_call_timeout  = 100000;

const timedSCPCall = (request, result) => {
  //console.log(request)
  let requestId = "request_" + (++requestCount).toString() + request.dcapp + "-" + request.function;
  let prom = new Promise((resolve, reject) => {
    const tick = setTimeout(() => { reject('Request timed out ' + requestId) }, scp_call_timeout);
    const transaction = scp.newTx(
      request.dcapp,
      request.function,
      requestId,
      JSON.stringify(request.args)
    );
    transaction.onResult?.(result => console.log(`Request result: ${result}`));
    transaction.onError?.(error => console.error(`Transaction error: ${error}`));
    transaction.send().then((res) => {
      console.log(res)
      clearTimeout(tick)
      resolve(res)
      result.push(res)
    })
    .catch(reject)
  });

  return prom;
};

const applyTransaction = async (request) => {
    console.log('Play transaction: ', request);

    const requestId = uuidv4();

    const transaction = scp.newTx(
      request.dcapp,
      request.function,
      requestId,
      JSON.stringify(request.args)
    );
    transaction.onResult?.(result => {
      console.log(`Request result: ${result.message}`)
    });
    transaction.onError?.(error => {
      console.error(`Transaction error: ${error.message}`)
    });    

    let results = undefined;
    try {
      results = await transaction.send();
    } catch (e) {
      console.log('Transaction Error: ', e);
    }
    return results;
};

const applyQuery = async (request) => {
  console.log('Play query: ', request);

  const requestId = uuidv4();

  const query = scp.newQuery(
    request.dcapp,
    request.function,
    requestId,
    JSON.stringify(request.args)
  );

  query.onResult?.(result => {
    console.log(`Request result: ${result.message}`)
  });
  query.onError?.(error => {
    console.error(`Transaction error: ${error.message}`)
  });

  let results = undefined;
  try {
    results = await query.send();
  } catch (e) {
    console.log('Query Error: ', e);
  }
  return results;
};

const openSCP = async (klave_endpoint, connection_keypair, password) => {
  console.log('\n>> Opening SCP...');

  const encryptedKey = fs.readFileSync(connection_keypair);

  const key = await connector.Key.importEncryptedKeyPair(JSON.parse(encryptedKey.toString()), password);

  scp = new connector.SCP();

  try {
    await scp.connect(klave_endpoint, key);
    console.log('SCP Connection: Connected');
    return true;
  } catch (e) {
    console.log(e);
    console.log('SCP Connection: Error');
    return false;
  }
};

const closeSCP = () => {
    console.log('\n>> Closing SCP...');
    scp.close();
    console.log('SCP Connection: Closed');
}

module.exports = {
    openSCP,
    closeSCP,
    timedSCPCall,
    applyTransaction,
    applyQuery
}
