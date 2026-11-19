import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { MainService } from '../services/main-service';

@Component({
  selector: 'app-service-test',
  templateUrl: './service-test.page.html',
  styleUrls: ['./service-test.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule],
})
export class ServiceTestPage implements OnInit {
  constructor(private mainService: MainService) {}

  ngOnInit() {
    const data = this.mainService.getLocalStorageData();

        console.log(data);
  }
}
