import { Context, Ledger, Notifier, JSON, Crypto } from "@klave/sdk";
import { emit, revert } from "../klave/types";
import { KeysList, TokenIdentityOutput } from "./outputs/types";
import { encode as b64encode } from 'as-base64/assembly';

const KeysTable = "KeysTable";

/**
 * An Keys is associated with a list of keys and holds keys.
 */
@JSON
export class Keys {
    backend_private_key: string;
    webserver_public_key: string;

    constructor() {
        this.backend_private_key = "";
        this.webserver_public_key = ""; 
    }

    /**
     * load the keys from the ledger.
     * @returns true if the keys was loaded successfully, false otherwise.
     */
    static load(): Keys {
        let keysTable = Ledger.getTable(KeysTable).get("ALL");
        if (keysTable.length == 0) {            
            // emit(`New Keys Table created successfully`);
            return new Keys;
        }
        let wlt = JSON.parse<Keys>(keysTable);
        // emit(`Keys loaded successfully: ${keysTable}`);
        return wlt;
    }

    /**
     * save the keys to the ledger.
     */
    save(): void {
        let keysTable = JSON.stringify<Keys>(this);
        Ledger.getTable(KeysTable).set("ALL", keysTable);
        // emit(`Keys saved successfully: ${keysTable}`);
    }

    /**
     * Generate a key to the list of keys.
     * @param keyId The id of the key to add.
     * @param keyInput The details (algorithm, extractable) of the key to add.
     */
    generateBackendPrivateKey(): boolean {
        let keyId : string = "";
        if (this.backend_private_key != "") {
            revert(`Key already exists: ${this.backend_private_key}`);
            return false;
        }            
        else {
            keyId = b64encode(Crypto.Utils.convertToUint8Array(Crypto.getRandomValues(64)));
        }
        let key = Crypto.ECDSA.generateKey(this.backend_private_key, "secp256r1", true);
        if (key === null) {
            emit(`Backend private key could not be created.`);
            return false;
        }
        this.backend_private_key = key.name;
        emit(`Backend private key created successfully: ${this.backend_private_key}`);
        return true;
    }

    /**
     * Import a public key corresponding to a webserver
     * @param keyId The id of the key to add.
     * @param keyInput The details (algorithm, extractable) of the key to add.
     */
    importWebserverPublicKey(spkiPublicKey: string): boolean {
        let keyId : string = "";
        if (this.webserver_public_key != "") {
            revert(`Webserver public key already exists: ${this.webserver_public_key}`);
            return false;
        }            
        else {
            keyId = b64encode(Crypto.Utils.convertToUint8Array(Crypto.getRandomValues(64)));
        }

        // emit("keyId(" + keyId + "), " + "format(" + keyInput.format + "), " + "algorithm(" + keyInput.algorithm + "), " + "keyData(" + keyInput.keyData + "), " + "extractable(" + ((keyInput.extractable)?"true":"false") + ")");

        let key = Crypto.ECDSA.importKey(keyId, "spki", spkiPublicKey, "secp256r1", true);
        if (key === null) {
            emit(`Webserver public key could not be imported.`);
            return false;
        }
        this.webserver_public_key = key.name;
        emit(`Webserver public key imported successfully: ${this.webserver_public_key} `);
        return true;    
    }
    
    /**
     * Remove a key from the list of keys.
     * @param keyId The id of the key to remove.
     */
    clearKeys(): boolean {
        this.backend_private_key = "";
        this.webserver_public_key = "";
        //It is not possible to override the previously imported key
        emit("Both backend and webserver keys now removed successfully");
        return true;
    }

    /**
     * list the current backend and webserver keys.
     * @returns
     */
    list(): void {
        if (this.backend_private_key == "" && this.webserver_public_key == "") {
            emit("No keys have been set yet.");
            return;
        }

        let backend_key = Crypto.ECDSA.getKey(this.backend_private_key);
        if (!backend_key) {
            revert("Issue retrieving the key: " + this.backend_private_key);
            return;
        }
        let backend_spki_pem = backend_key.getPublicKey("spki").getPem();        

        let webserver_key = new Crypto.PublicKey(Crypto.ECDSA.exportKey(this.webserver_public_key, "spki"));
        if (webserver_key.bytes.length == 0) {
            revert("Issue retrieving the key: " + this.webserver_public_key);
            return;
        }
        
        let keysList = new KeysList(backend_spki_pem, webserver_key.getPem());        
        Notifier.sendJson<TokenIdentityOutput>({
            requestId: Context.get('request_id'),
            result: keysList
        });
    }

}