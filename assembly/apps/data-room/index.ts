import { DataRoom } from "./data_room/dataroom";
import { DataRooms } from "./data_room/datarooms";
import { GetFileUploadToken, UpdateDataRoomInput } from "./data_room/inputs/types";
import { Keys } from "./data_room/keys";
import { revert } from "./klave/types";

/**
 * @transaction  
 */
export function setTokenIdentity(unused: string): void {
    let keys = Keys.load();
    if (keys.generateBackendPrivateKey()) {
        keys.save();
    }
}

/**
 * @transaction  
 */
export function setWebServerTokenIdentity(spkiPublicKey: string): void {
    let keys = Keys.load();
    if (keys.importWebserverPublicKey(spkiPublicKey)) {
        keys.save();
    }
}

/**
 * @query 
 * @param input containing the following fields:
 * - userId: string
 * - role: string, "admin" or "user" - so far unused
 * @returns success boolean
 */
export function getTokenIdentity(unused: string): void {
    let keys = Keys.load();
    keys.list();
}

/**
 * @transaction
 */
export function createDataRoom(dataRoomId: string): void {
    let dataRooms = DataRooms.load();
    if (dataRooms.addDataRoom(dataRoomId)) {
        dataRooms.save();
    }    
}

/**
 * @transaction
 */
export function updateDataRoom(input: UpdateDataRoomInput): void {
    let dataRoom = DataRoom.load(input.dataRoomId);
    if (!dataRoom) {
        revert(`DataRoom ${input.dataRoomId} does not exist. Create it first.`);
        return;
    }

    if (dataRoom.locked) {
        revert(`DataRoom ${input.dataRoomId} is now locked.`);
        return;
    }

    if (input.operation == "addFile") {
        dataRoom.addFile(input.file);
    }
    else if (input.operation == "removeFile") {
        dataRoom.removeFile(input.file);
    }
    else if (input.operation == "lock") {
        dataRoom.lock();
    }

    dataRoom.save();
}


/**
 * @query 
 * @param input containing the following fields:
 * - userId: string
 * - role: string, "admin" or "user" - so far unused
 * @returns success boolean
 */
export function getFileUploadToken(input: GetFileUploadToken): void {
    let keys = Keys.load();
    keys.list();
}

/**
 * @query 
 */
export function listDataRooms(unused: string): void {
    let dataRooms = DataRooms.load();
    dataRooms.list();
}