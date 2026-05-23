import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
@Injectable({
  providedIn: 'root',
})
export class SignalrService {
  private hubConnection!: signalR.HubConnection;

  startConnection() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5000/liveboardHub')
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .then(() => console.log('SignalR Connected'))
      .catch((err) => console.log('Error while starting connection: ' + err));
  }

  onLiveBoardUpdate(callback: (data: any) => void) {
    // this.hubConnection.on('LiveBoardUpdate', callback);
    this.hubConnection.on('LiveboardUpdated', (data) => {
      console.log('🔥 SIGNALR RECEIVED UPDATE', data);
    });



  }
}
