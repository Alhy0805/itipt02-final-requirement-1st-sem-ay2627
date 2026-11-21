import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenu,
  IonMenuButton,
  IonMenuToggle,
  IonRouterOutlet,
  IonSplitPane,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  homeOutline,
  logOutOutline,
  pieChartOutline,
  personOutline,
  swapHorizontalOutline,
  trophyOutline,
  walletOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-finance',
  standalone: true,
  templateUrl: './finance.page.html',
  styleUrls: ['./finance.page.scss'],
  imports: [
    IonButton,
    IonContent,
    IonHeader,
    IonIcon,
    IonMenu,
    IonMenuButton,
    IonMenuToggle,
    IonRouterOutlet,
    IonSplitPane,
    IonTitle,
    IonToolbar,
    RouterLink,
    RouterLinkActive,
  ],
})
export class FinancePage {
  private readonly router = inject(Router);

  constructor() {
    addIcons({
      homeOutline,
      swapHorizontalOutline,
      walletOutline,
      pieChartOutline,
      trophyOutline,
      barChartOutline,
      personOutline,
      logOutOutline,
    });
  }

  logout(): void {
    localStorage.removeItem('finance-user');
    localStorage.removeItem('finance-resources');
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
