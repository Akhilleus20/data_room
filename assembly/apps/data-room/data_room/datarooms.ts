import { Ledger, JSON, Context } from "@klave/sdk";
import { emit, revert } from "../klave/types";
import { DataRoom } from "./dataroom";

const DataRoomsTable = "DataRoomsTable";

/**
 * An DataRooms is associated with a list of dataRooms and holds dataRooms.
 */
@JSON
export class DataRooms {
    dataRooms: Array<string>;

    constructor() {
        this.dataRooms = new Array<string>();
    }

    /**
     * load the dataRooms from the ledger.
     * @returns true if the dataRooms was loaded successfully, false otherwise.
     */
    static load(): DataRooms {
        let dataRoomsTable = Ledger.getTable(DataRoomsTable).get("ALL");
        if (dataRoomsTable.length == 0) {            
            // emit(`New DataRooms Table created successfully`);
            return new DataRooms;
        }
        let wlt = JSON.parse<DataRooms>(dataRoomsTable);
        // emit(`DataRooms loaded successfully: ${dataRoomsTable}`);
        return wlt;
    }

    /**
     * save the dataRooms to the ledger.
     */
    save(): void {
        let dataRoomsTable = JSON.stringify<DataRooms>(this);
        Ledger.getTable(DataRoomsTable).set("ALL", dataRoomsTable);
        // emit(`DataRooms saved successfully: ${dataRoomsTable}`);
    }

    /**
     * Add a dataroom to the list of dataRooms.
     * @param dataroomId The id of the dataroom to add.     
     */
    addDataRoom(dataroomId: string): boolean {
        let existingDataRoom = DataRoom.load(dataroomId);
        if (existingDataRoom) {
            revert(`DataRoom already exists: ${dataroomId}`);
            return false;
        }
        let dataroom = new DataRoom(dataroomId);        
        dataroom.save();
        this.dataRooms.push(dataroom.id);

        emit(`DataRoom added successfully: ${dataroom.id} `);
        return true;
    }

    /**
     * Remove a dataroom from the list of dataRooms.
     * @param dataroomId The id of the dataroom to remove.
     */
    removeDataRoom(dataroomId: string): boolean {
        let dataroom = DataRoom.load(dataroomId);
        if (!dataroom) {
            revert("DataRoom not found: " + dataroomId);
            return false;
        }
        dataroom.delete();

        let index = this.dataRooms.indexOf(dataroomId);
        this.dataRooms.splice(index, 1);
        emit("DataRoom removed successfully: " + dataroomId);
        return true;
    }

    /**
     * list all the dataRooms in the dataRooms.
     * @returns
     */
    list(): void {
        let dataRooms: string = "";
        for (let i = 0; i < this.dataRooms.length; i++) {
            let dataroom = this.dataRooms[i];
            if (dataRooms.length > 0) {
                dataRooms += ", ";
            }
            dataRooms += dataroom;
        }
        if (dataRooms.length == 0) {
            emit(`No dataroom found in the list of dataRooms`);
        }
        emit(`DataRooms available: ${dataRooms}`);
    }

}