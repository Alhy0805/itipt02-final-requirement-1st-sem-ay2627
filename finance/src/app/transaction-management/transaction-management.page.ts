import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonIcon,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonInput,
  IonSearchbar,
  IonButton,
  IonDatetime,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonList,
  IonHeader,
  IonListHeader, IonLabel } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { ellipsisVertical, searchCircle, swapVertical } from 'ionicons/icons';
import { MainService } from '../services/main-service';
import type { Transaction, TransactionFilter, TransactionOrder } from '../services/main-service';

@Component({
  selector: 'app-transaction-management',
  templateUrl: './transaction-management.page.html',
  styleUrls: ['./transaction-management.page.scss'],
  imports: [IonLabel, 
    IonIcon,
    IonInput,
    IonContent,
    CommonModule,
    FormsModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonSearchbar,
    IonButton,
    IonDatetime,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonList,
    IonHeader,
    IonListHeader,
  ],
})
export class TransactionManagementPage implements OnInit {
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly mainService = inject(MainService);
  user: any = null;
  userID: any | null = null;
  transaction: Transaction[] = [];
  transaction_type: TransactionOrder = 'newest';
  activeFilter = 'allBtn';
  searchTerm = '';
  loadError = '';
  isLoading = false;

  constructor() {
    addIcons({ ellipsisVertical, searchCircle, swapVertical });
  }

  ngOnInit(): void {
    const savedUser = localStorage.getItem('finance-user');
    if (savedUser) {
      this.user = JSON.parse(savedUser);
    } else {
      this.user = null;
    }
    this.userID = this.user?.user_id ?? null;

    if (this.userID) {
      this.filterTransactions('allBtn');
    } else {
      this.loadError = 'Could not find a user ID. Please sign in again.';
    }
  }

  async filterTransactions(buttonId: string): Promise<void> {
    this.activeFilter = buttonId;
    await this.loadTransactions();
  }

  async searchTransactions(value: string | null | undefined): Promise<void> {
    if (value !== null && value !== undefined) {
      this.searchTerm = value;
    } else {
      this.searchTerm = '';
    }
    await this.loadTransactions();
  }

  async orderTransactions(order: TransactionOrder): Promise<void> {
    this.transaction_type = order;
    await this.loadTransactions();
  }

  async loadTransactions(): Promise<void> {
    if (!this.userID) {
      this.loadError = 'Could not find a user ID. Please sign in again.';
      return;
    }

    this.loadError = '';
    this.isLoading = true;

    const filter: TransactionFilter =
      this.activeFilter === 'incomebtn'
        ? 'Income'
        : this.activeFilter === 'expenseBtn'
          ? 'Expense'
          : 'all';

    try {
      this.transaction = await this.mainService.filterTransactionData(
        this.userID,
        filter,
        this.transaction_type,
        this.searchTerm,
      );
    } catch (error) {
      this.loadError = error instanceof Error ? error.message : 'Could not load transactions.';
      console.error('Failed to load transactions:', error);
    } finally {
      this.isLoading = false;
      this.changeDetector.detectChanges();
    }
  }
}
