import { Component, OnInit } from '@angular/core';
import { ClientService } from './service/client.service';


declare var QB: any;

@Component( {
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
} )

export class AppComponent implements OnInit {
    title = 'app';
    inputMsg = '';

    credentials = {
        appId: 60785,
        authKey: 'NEX3fqJguxPXe7q',
        authSecret: 'NmXaJb4vBQL4wmL'
    };

    users = [
        { id: 30566376, name: 'Tester', login: 'atlastester', pass: 'test1234' },
        { id: 30789373, name: 'SecondTester', login: 'atlastester2', pass: 'test1234' }
    ];

    selectedUser = null;

    public connected = false;
    public callInc = false;
    public callActive = false;

    public currentSession: any = null;

    constructor( private service: ClientService ) {
    }


    ngOnInit() {

    }

    sendMsg() {
        console.log( 'sending message ...' );

        const msg = {
            type: 'chat',
            body: this.inputMsg,
            extension: {
                save_to_history: 1
            }
        };

        QB.chat.send( 30789373, msg );


        this.getDialogs();
    }

    initConnection() {
        console.log( 'init connection ...' );
        QB.init( this.credentials.appId, this.credentials.authKey, this.credentials.authSecret );

        // Incoming Message Listener
        QB.chat.onMessageListener = function( userId, msg ) {
            console.log( 'message from user: ' + userId, msg );
        };

        // Incoming Subscription Listener
        QB.chat.onSubscribeListener = function( userId ) {
            console.log( 'subscription request from user: ' + userId );
        };

        // Incoming Subscription Confirm Listener
        QB.chat.onConfirmSubscribeListener = function( userId ) {
            console.log( 'confirmed request from/to? user: ' + userId );
        };

        // ####### CALL LISTENER ########

        // Incoming Call Request Listener
        QB.webrtc.onCallListener = ( session, extension ) => {
            console.log( 'Incoming call' );
            this.callInc = true;
            this.currentSession = session;
        };

        // Call Stop Listener (opponent hung up)
        QB.webrtc.onStopCallListener = function( session, userId, extension ) {
            console.log( 'call stopped' );
            session.stop( extension );
        };
    }

    createSession() {
        console.log( 'create session...' );

        QB.createSession( { login: this.selectedUser.login, password: this.selectedUser.pass }, ( error, result ) => {
            if ( error ) {
                console.log( 'error: ', error );
            } else {
                console.log( 'session: ', result );
            }
        } );
    }

    onConnect() {
        if ( this.selectedUser != null ) {
            this.initConnection();
            this.createSession();


            console.log( 'connect to chat...' );
            QB.chat.connect( { userId: this.selectedUser.id, password: this.selectedUser.pass }, ( error ) => {
                if ( error ) {
                    console.log( 'error: ', error );
                } else {
                    this.connected = true;
                    //                    this.clientService.getRoster();
                }
            } );
        }
    }

    getRoster() {
        QB.chat.roster.get( function( roster ) {
            console.log( 'roster', roster );
        } );
    }

    addUserToRoster( userId ) {
        QB.chat.roster.add( userId, function() {
            console.log( 'send roster request to user:' + userId );
        } )
    }

    confirmSubscription() {
        const userId = this.service.getSelectedClient()['id'];
        console.log( 'confirm request for id:' + userId );
        QB.chat.roster.reject( userId, function() {
            console.log( 'confirmed!' );
        } );
    }

    getDialogs() {
        const filter = null;
        QB.chat.dialog.list( filter, ( error, result ) => {
            if ( error ) {
                console.log( 'error: ', error );
            } else {
                console.log( 'dialogs: ', result );
            }

        } );
    }

    startCall() {

        // Create Video Session
        const callees = [30789373];
        const sessionType = QB.webrtc.CallType.AUDIO;
        this.currentSession = QB.webrtc.createNewSession( callees, sessionType );

        // Access local media stream
        const mediaParams = {
            audio: true,
            video: false,
            //            options: {
            //                muted: true,
            //                mirror: true
            //            },
            //            elemId: 'localVideo'
        };

        this.currentSession.getUserMedia( mediaParams, ( error, stream ) => {
            if ( error ) {
                console.log( 'error', error );
            } else {
                console.log( 'stream', stream );

                // make a call
                const extension = {};
                this.currentSession.call( extension, ( error2 ) => {
                    if ( error2 ) {
                        console.log( 'call error', error2 );
                        console.log( 'call error details', error2.detail );
                    }
                } );
            }
        } );
    }

    acceptCall() {
        console.log( 'accept call...' );

        console.log( this.currentSession );

        const mediaParams = {
            audio: true,
            video: false,
            //            options: {
            //                muted: true,
            //                mirror: true
            //            },
            //            elemId: 'localVideo'
        };

        this.currentSession.getUserMedia( mediaParams, ( error, stream ) => {
            if ( error ) {
                console.log( 'error', error );
            } else {
                console.log( 'stream', stream );

                // accept a call
                const extension = {};
                this.currentSession.accept( extension );
                this.callInc = false;
                this.callActive = true;
            }
        } );
    }

    hangUp() {
        console.log( 'hangup' );
        this.currentSession.stop( {} );
        this.callActive = false;
    }
}
