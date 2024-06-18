//Klave connection

const { openSCP, closeSCP, applyTransaction, applyQuery } = require("./scp-utils");
const fs = require('fs');
const KLAVE_JEREMIE_ENDPOINT = 'wss://thranduil4.node.secretarium.org:4201/';
//const KLAVE_DEV_ENDPOINT = 'wss://klave-dev.secretarium.org/';
const KLAVE_DCAPP_WASM_MANAGER = 'wasm-manager';
const KLAVE_CONNECTION_KEYPAIR = './config/connectionKeys/klave1.secretarium';
//key password provided below just for test purpose !!!!!!!!!!!!!!!!
const KLAVE_CONNECTION_KEYPAIR_PWD = 'klave';
const SOFTMETAL_CONNECTION_KEYPAIR_PWD = 'tutu@';


const klaveOpenConnection = async (user) => {

    let connection_key_pair = KLAVE_CONNECTION_KEYPAIR;
    let connection_pwd = KLAVE_CONNECTION_KEYPAIR_PWD;
    switch(user) {
        case `klave1`:
        case ``: {
            break;
        };
        default: {
            connection_key_pair = './config/connectionKeys/' + user + ".secretarium";
            connection_pwd = SOFTMETAL_CONNECTION_KEYPAIR_PWD;
            break;
        }        
    }

    let user_connected = await openSCP(
        KLAVE_JEREMIE_ENDPOINT, 
        connection_key_pair, 
        connection_pwd);
    return user_connected;
}

const klaveCloseConnection = async () => {
    closeSCP();
}
  
const klaveAddKredits = async (app_id, kredits) => {
    return klaveTransaction(
        KLAVE_DCAPP_WASM_MANAGER, 
        "add_kredit", 
        {
            "app_id":app_id,
            "kredit":kredits
        }
    );        
}

const klaveTransaction = async (dcapp,func,args) => {
    let request = {
        "dcapp":dcapp,
        "function":func,
        "args":args
    };
    let serviceInfoResult = await applyTransaction(request);
    return serviceInfoResult;
}

const klaveQuery = async (dcapp,func,args) => {
    let request = {
        "dcapp":dcapp,
        "function":func,
        "args":args
    };
    let serviceInfoResult = await applyQuery(request);
    return serviceInfoResult;
}

const klaveDeployApp = async (app_id,fqdn,wasm_file) =>
{
    //deploy the app
    let wasm_bytes_b64 = (fs.readFileSync(wasm_file)).toString();
    await klaveTransaction(
        KLAVE_DCAPP_WASM_MANAGER, 
        "deploy_instance", 
        {
            "app_id":app_id,
            "fqdn":fqdn,
            "wasm_bytes_b64":wasm_bytes_b64
        }
    );
    console.log("App deployed");

    //add some kredits to the app
    let kredits = 10000000000;
    await klaveAddKredits(app_id, kredits);
    console.log("Kredits added");
}
    

module.exports = {
    klaveOpenConnection,
    klaveCloseConnection,
    klaveDeployApp,
    klaveTransaction, 
    klaveQuery
}