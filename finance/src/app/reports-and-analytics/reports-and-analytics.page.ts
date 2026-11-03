import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
  selector: 'app-reports-and-analytics',
  templateUrl: './reports-and-analytics.page.html',
  styleUrls: ['./reports-and-analytics.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule],
})
export class ReportsAndAnalyticsPage implements OnInit {
  constructor() {}

  ngOnInit() {}
}
