import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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
  notificationsOutline,
  pieChartOutline,
  pricetagsOutline,
  repeatOutline,
  settingsOutline,
  swapHorizontalOutline,
  trophyOutline,
  trendingDownOutline,
  trendingUpOutline,
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
  constructor() {
    addIcons({
      homeOutline,
      swapHorizontalOutline,
      trendingUpOutline,
      trendingDownOutline,
      walletOutline,
      pricetagsOutline,
      pieChartOutline,
      trophyOutline,
      repeatOutline,
      barChartOutline,
      notificationsOutline,
      settingsOutline,
    });
  }
}
