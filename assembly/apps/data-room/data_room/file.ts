import { Ledger, Crypto, JSON, Context } from '@klave/sdk'
import { emit, revert } from "../klave/types"
import { encode as b64encode, decode as b64decode } from 'as-base64/assembly';
import { DataRoom } from './dataroom';

const FilesTable = "FilesTable";

@JSON
export class File {    
    id: string;
    dataRoomId: string;
    name: string;
    digest: Uint8Array;
    type: string;
    key: string;
    token: Uint8Array;

    constructor(dataRoomId: string, name: string, digest:Uint8Array, type: string, key: string, token: Uint8Array) {
        this.id = b64encode(Crypto.Utils.convertToUint8Array(Crypto.getRandomValues(64)));
        this.dataRoomId = dataRoomId;
        this.name = name;
        this.digest = digest;
        this.type = type;
        this.key = key;
        this.token = token;
    }

    static load(fileId: string) : File | null {
        let fileTable = Ledger.getTable(FilesTable).get(fileId);
        if (fileTable.length == 0) {
            // revert("File does not exists. Create it first");
            return null;
        }
        let file = JSON.parse<File>(fileTable);
        // emit(`File loaded successfully: '${file.id}'`);
        return file;
    }

    save(): void {
        let fileTable = JSON.stringify<File>(this);
        Ledger.getTable(FilesTable).set(this.name, fileTable);
        emit(`File saved successfully: ${this.name}`);
    }

    delete(): void {
        Ledger.getTable(FilesTable).unset(this.name);
        emit(`File deleted successfully: ${this.name}`);
    }

    verify_file_token(now: string , webserver_public_key: string) : boolean {        
        if (this.token.length != (40 + 64)) {
            revert("file upload token size is invalid");
            return false;
        }

        let token_digest = this.token.subarray(0, 32);        
        if (b64encode(this.digest) != b64encode(token_digest)) {
            revert("file upload token refers to the wrong file: " + b64encode(this.digest) + " != " + b64encode(token_digest));
			return false;
        }

        let token_time = this.token.subarray(32, 40);
        // Check the token has not expired
        // if (token_time.toString() > now) {
        //     revert("file upload token has expired:" + token_time.toString() + " > " + now);
		// 	return false;
        // }

        let token_body = this.token.subarray(0, 40);
        let token_signature = this.token.subarray(40, 40+64);

        let webserver_pkey = Crypto.ECDSA.getKey(webserver_public_key);
        if (!webserver_pkey) {
            revert("Issue retrieving the key" + webserver_public_key);
            return false;
        }
        let verified = webserver_pkey.verify(b64encode(token_body), Crypto.Utils.convertToU8Array(token_signature));
        if(!verified) {
			revert("file upload token signature is invalid: " + b64encode(token_signature) + ", " + b64encode(token_body));
			return false;            
        }
        return true;
    }
}