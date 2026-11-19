import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonProgressBar,
} from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { pieChartOutline, trendingDownOutline, trendingUpOutline, walletOutline } from 'ionicons/icons';
import { MainService } from '../services/main-service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  imports: [
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonButton,
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonProgressBar,
    RouterLink,
    CommonModule,
  ],
})
export class DashboardPage implements OnInit {
  balance: number = 0;
  income: number = 0;
  expenses: number = 0;
  totalbudget: number = 0;

  localStorageData: any = null;

  constructor(private readonly changeDetector: ChangeDetectorRef, private mainService: MainService) {
    addIcons({
      pieChartOutline,
      trendingDownOutline,
      trendingUpOutline,
      walletOutline,
    });
  }
  GetLocalStorageData() {
    this.localStorageData = this.mainService.getLocalStorageData();
  }

  GetUserData() {
    return this.mainService.getUserData();
  }

  ngOnInit(){
  }

  async ionViewWillEnter() {
    const [income, expenses, balance] = await Promise.all([
      this.mainService.getTotalIncome(),
      this.mainService.getTotalExpense(),
      this.mainService.getTotalBalance(),
    ]);

    this.income = income;
    this.expenses = expenses;
    this.balance = balance;

    this.changeDetector.detectChanges();
  }
}
