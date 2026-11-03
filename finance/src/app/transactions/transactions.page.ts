import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonInput, IonSearchbar, IonButton, IonDatetime, IonItem, IonSelect, IonSelectOption, IonList, IonHeader, IonListHeader } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { searchCircle, swapVertical } from 'ionicons/icons';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.page.html',
  styleUrls: ['./transactions.page.scss'],
  imports: [IonIcon, IonInput, IonContent, CommonModule, FormsModule, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSearchbar, IonButton, IonDatetime, IonItem, IonSelect, IonSelectOption, IonList, IonHeader, IonListHeader],
})
export class TransactionsPage implements OnInit {
  constructor() {
    addIcons({searchCircle, swapVertical})
  }

  ngOnInit() {}
}
