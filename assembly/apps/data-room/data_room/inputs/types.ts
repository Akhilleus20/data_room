import { JSON } from "@klave/sdk";

@JSON
export class SetWebServerTokenIdentityInput {
    spkiPublicKey: string;
}

@JSON
export class GetFileUploadToken {
    dataRoomId: string;
    digest: string;
}

@JSON
export class FileInput {
    name: string;
    digestB64: string;
    type: string;
    key: string;
    tokenB64: string;
}

@JSON
export class UpdateDataRoomInput {
    dataRoomId: string;
    operation: string;      //addFile / removeFile / lock
    file: FileInput;
}