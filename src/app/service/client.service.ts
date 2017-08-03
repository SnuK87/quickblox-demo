import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Client } from '../model/client.model';

declare var QB: any;

@Injectable()
export class ClientService {


    public roster: Subject<any> = new Subject<any>();

    public selectedClient: Client;

    constructor() {
        console.log( 'construct service' );
    }

    getRoster(): Observable<any> {
        console.log( 'service getRoster()' );

        QB.chat.roster.get(( roster ) => {
            this.roster.next( { roster: roster } );
        } );

        return this.roster.asObservable();
    }

    setSelectedClient( client: Client ) {
        this.selectedClient = client;
    }

    getSelectedClient(): Client {
        return this.selectedClient;
    }
}
