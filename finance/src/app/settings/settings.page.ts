import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonToggle,
} from '@ionic/angular';

@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonToggle,
  ],
})
export class SettingsPage implements OnInit {
  username = 'Mark Justin Erciña';
  email = 'mark@financetracker.app';
  currency = 'PHP';
  dateFormat = 'MM/DD/YYYY';
  timeZone = 'Asia/Manila';

  constructor() {}

  ngOnInit(): void {}
}
