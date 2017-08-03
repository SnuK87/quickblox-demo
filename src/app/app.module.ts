import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { ClientlistComponent } from './clientlist/clientlist.component';

import { ClientService } from './service/client.service';

@NgModule({
  declarations: [
    AppComponent,
    ClientlistComponent
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [ClientService],
  bootstrap: [AppComponent]
})
export class AppModule { }
