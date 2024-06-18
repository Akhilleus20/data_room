import { Ledger, JSON, Crypto, Context } from "@klave/sdk";
import { emit, revert } from "../klave/types"
import { encode as b64encode, decode as b64decode } from 'as-base64/assembly';
import { File } from "./file";
import { Keys } from "./keys";
import { FileInput } from "./inputs/types";

const DataRoomsTable = "DataRoomsTable";

@JSON
export class PublicKey {
    keyId: string;
    spkiPubKey: string;

    constructor(id: string, spki: string) {
        this.keyId = id;
        this.spkiPubKey = spki;
    }    
}

@JSON
export class DataRoom {
    id: string;
    publicKeys: Array<PublicKey>;
    files: Array<string>;
    locked: boolean;

    constructor(id: string) {
        if (id.length > 0 ) {
            this.id = id;
        }
        else {
            this.id = b64encode(Crypto.Utils.convertToUint8Array(Crypto.getRandomValues(64)));
        }

        this.publicKeys = new Array<PublicKey>();
        this.files = new Array<string>();
    }

    static load(dataRoomId: string) : DataRoom | null {
        let dataRoomTable = Ledger.getTable(DataRoomsTable).get(dataRoomId);
        if (dataRoomTable.length == 0) {
            // revert(`DataRoom ${dataRoomId} does not exists. Create it first`);
            return null;
        }
        let dataRoom = JSON.parse<DataRoom>(dataRoomTable);
        // emit(`DataRoom loaded successfully: '${dataRoom.id}'`);
        return dataRoom;
    }

    save(): void {
        let dataRoomTable = JSON.stringify<DataRoom>(this);
        Ledger.getTable(DataRoomsTable).set(this.id, dataRoomTable);
        emit(`DataRoom saved successfully: ${this.id}`);
    }

    delete(): void {
        this.id = "";
        this.publicKeys.forEach(element => {
            element.keyId = "";
            element.spkiPubKey = "";
        });
        Ledger.getTable(DataRoomsTable).unset(this.id);
        emit(`User deleted successfully: ${this.id}`);
    }

    includes(spki: string): string | null {
        for (let i=0; i<this.publicKeys.length; ++i) {
            if (this.publicKeys[i].spkiPubKey == spki) 
            {
                return this.publicKeys[i].keyId;
            }
        }
        return null;
    }

    addFile(input: FileInput): boolean {
        if (this.files.includes(input.name)) {
            revert(`This file ${input.name} already exists in this dataRoom.`)
            return false;
        }
        this.files.push(input.name);

        let file = new File(this.id, 
            input.name, 
            b64decode(input.digestB64), 
            input.key, 
            input.type, 
            b64decode(input.tokenB64));

        //Check signature is valid
        let keys = Keys.load();
        if (keys.webserver_public_key == "") {
            revert(`Cannot read webserver identity.`);
        }
    
        let now : string = ""//Context.get("trusted_time");        
        if (!file.verify_file_token(now, keys.webserver_public_key)) {
            return false;
        }

        return true;
    }

    removeFile(input: FileInput): boolean {
        if (!this.files.includes(input.name)) {
            revert(`This file ${input.name} does not exist in this dataRoom.`)
            return false;
        }
        let index = this.files.indexOf(input.name);
        this.files.splice(index, 1);

        
        return true;
    }

    lock(): void {
        this.locked = true;
    }

    listFiles(): void {
        let files: string = "";
        for (let i = 0; i < this.files.length; i++) {
            let file = this.files[i];
            if (files.length > 0) {
                files += ", ";
            }
            files += file;
        }
        if (files.length == 0) {
            emit(`No file found in this dataRooms`);
        }
        emit(`Files available: ${files}`);
    }

    listPublicKeys(): void {
        let pubKeys: string = "";
        for (let i = 0; i < this.publicKeys.length; i++) {
            let pubKey = this.publicKeys[i];
            if (pubKeys.length > 0) {
                pubKeys += ", ";
            }
            pubKeys += "(" + pubKey.keyId + "," + pubKey.spkiPubKey + ")";
        }
        if (pubKeys.length == 0) {
            emit(`No public key found in this dataRoom`);
        }
        emit(`Public keys available: ${pubKeys}`);
    }
}
