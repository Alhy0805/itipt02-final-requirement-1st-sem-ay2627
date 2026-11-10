import { Component } from '@angular/core';
import { IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { colorPaletteOutline, personOutline, settingsOutline, shieldCheckmarkOutline } from 'ionicons/icons';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  imports: [IonContent, IonHeader, IonIcon, IonTitle, IonToolbar],
})
export class SettingsPage {
  constructor() {
    addIcons({ settingsOutline, personOutline, shieldCheckmarkOutline, colorPaletteOutline });
  }
}
