import { Component, OnInit } from '@angular/core';
import { ClientService } from './service/client.service';
import * as SockJS from 'sockjs-client';
import * as Stomp from 'stompjs';
import { Buffer } from 'buffer';


declare var QB: any;
// declare var QBMediaRecorder: any;
declare var RecordRTC: any;
declare var MediaStreamRecorder: any;
declare var StereoAudioRecorder: any;


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

    public recorder: any = null;

    public stompClient: any = null;
    
    public socket: WebSocket = null;

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

        // Accept Call Listener (opponent will get confirmation)
        QB.webrtc.onAcceptCallListener = function( session, userId, extension ) {
            console.log( 'accept call' );
        };

        // Caller will get remote media stream from opponent
        QB.webrtc.onRemoteStreamListener = function( session, userID, remoteStream ) {

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
        this.connectWS();
        

        console.log( this.currentSession );

        const mediaParams = {
            audio: true,
            video: false,
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

                // start recording
                console.log( 'start recording...' );
                
                // record audio/webm
                this.recorder = RecordRTC( stream, {
                    type: 'audio',
                    recorderType: MediaStreamRecorder,
                    mimeType: 'audio/webm'
//                    timeSlice: 1000
                } );
                
                // record 16khz wav
//                this.recorder = RecordRTC(stream, {
//                    type: 'audio',
//                    recorderType: StereoAudioRecorder,
//                    desiredSampRate: 16000,
//                    numberOfAudioChannels: 1
//                    
//                });


                this.recorder.startRecording();

                // send blob every second
//                const timer = setInterval(() => {
//                    if ( this.callActive ) {
//                        const internal = this.recorder.getInternalRecorder();
//                        const blob = new Blob( internal.getArrayOfBlobs(), {type: 'audio/webm'} );
//                        this.recorder.clearRecordedData();
//                        this.stompClient.send( "/app/hello", {}, blob );
//                        console.log( "blob", blob );
//                    }
//                }, 1000 );
            }
        } );
    }

    hangUp() {
        console.log( 'hangup' );
        this.currentSession.stop( {} );
        this.callActive = false;

        // stop recording
        console.log( 'stop recording' );

        this.recorder.stopRecording(() => {
            const blob = this.recorder.getBlob();
            
            
            const reader = new FileReader();
            reader.addEventListener('loadend', () => {
                const buffer = Buffer.from(reader.result);
                console.log('buffer', buffer);
                
                this.socket.send(buffer);
                this.socket.send('EOS');
            })
            
            
            reader.readAsArrayBuffer(blob);
            
            
//            reader.readAsArrayBuffer( blob );
            //            reader.readAsBinaryString( blob );
            //            this.stompClient.send( "/app/hello", {}, blob );

            
//            const reader = new FileReader();
//            let base64data;
//            reader.readAsDataURL(blob);
//            reader.onloadend = () => {
//                base64data = reader.result;
//                this.stompClient.send('/app/hello', {}, base64data);
//                console.log(base64data);
//            }
            
            
            // download file
//            const a = window.document.createElement('a');
//            a.href = window.URL.createObjectURL(blob);
//            a.download = 'file.webm';
//            document.body.appendChild(a);
//            a.click();
//            document.body.removeChild(a);
//            
//            console.log( "blob", blob );
        } );
    }

    connectWS() {
        console.log( 'connect to WS ...' );
        const socketURI = 'ws://localhost:8000/gs-guide-websocket';
        
        // using sockjs and stomp
        
        //        const socket = new SockJS( 'http://localhost:8000/gs-guide-websocket' );
        
        
//        const contentType = 'audio/x-raw,+layout=(string)interleaved,+rate=(int)16000,+format=(string)S16LE,+channels=(int)1';
//        const socketURI = 'ws://211.192.34.12:8888/client/ws/speech';
        
        
//        this.stompClient = Stomp.over( socket );
//        this.stompClient.connect( {}, function( frame ) {
//            console.log( "stomp connect ..." );
//        } );
        
        // without stomp and sockjs
        this.socket = new WebSocket( socketURI );
        this.socket.binaryType = 'arraybuffer';
        
        this.socket.onopen = () => {
            console.log('connected to websocket ...');
        }
        
        this.socket.onerror = (e) => {
            console.log('websocket error', e);
        }
        
        this.socket.onmessage = (e) => {
            console.log('received message', e.data);
        }
        
        this.socket.onclose = () => {
            console.log('closed websocket');
        }
    }
}
