import { JSON } from "@klave/sdk";

@JSON 
export class KeysList {
    backendPublicKey: string;
    webserverPublicKey: string;

    constructor(backend:string, webserver: string) {
        this.backendPublicKey = backend;
        this.webserverPublicKey = webserver;
    }
}

@JSON 
export class TokenIdentityOutput {
    requestId: string;
    result: KeysList;    
}
