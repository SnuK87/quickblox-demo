import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ClientService } from '../service/client.service';
import { Subscription } from 'rxjs/Subscription';
import { Client } from '../model/client.model';

@Component( {
    selector: 'app-clientlist',
    templateUrl: './clientlist.component.html',
    styleUrls: ['./clientlist.component.css']
} )
export class ClientlistComponent implements OnInit, OnDestroy {
    subscription: Subscription;

    clients: Array<Client> = [];

    selectedClient: Client = null;

    constructor( private service: ClientService ) {

    }

    ngOnInit() {
        this.subscription = this.service.getRoster().subscribe( roster => {
            const keys = Object.keys( roster['roster'] );

            for ( let i = 0; i < keys.length; i++ ) {
                this.clients.push( new Client( keys[i] ) );
                console.log( roster['roster'][keys[i]] );
            }
        } );
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    selectClient( selectedId: string ) {
        this.selectedClient = this.clients[0];
        this.service.setSelectedClient(this.clients[0]);
    }
}
