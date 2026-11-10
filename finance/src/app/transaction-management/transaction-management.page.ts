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
  IonListHeader,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { ellipsisVertical, searchCircle, swapVertical } from 'ionicons/icons';

interface Transaction {
  transaction_type: string;
  amount: number;
  description: string;
  transaction_date: string;
  notes: string | null;
}

type TransactionOrder = 'newest' | 'oldest' | 'a-z' | 'z-a' | 'highest' | 'lowest';

@Component({
  selector: 'app-transaction-management',
  templateUrl: './transaction-management.page.html',
  styleUrls: ['./transaction-management.page.scss'],
  imports: [
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
  user: any = null;
  userID: any | null = null;
  transaction: Transaction[] = [];
  transactionAPI = '';
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

    let type: string | null = null;
    if (this.activeFilter === 'incomebtn') {
      type = 'Income';
    } else if (this.activeFilter === 'expenseBtn') {
      type = 'Expense';
    }

    const term = this.searchTerm.trim();
    if (term) {
      const params = new URLSearchParams({ search_term: term });
      this.transactionAPI = `http://127.0.0.1:8000/transactionSearch/${this.userID}?${params}`;
    } else {
      this.transactionAPI = `http://127.0.0.1:8000/transactionFilter/${this.userID}/true/${this.transaction_type}`;
    }

    try {
      const response = await fetch(this.transactionAPI);
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const transactions: Transaction[] = await response.json();

      let filteredTransactions: Transaction[];

      if (type) {
        filteredTransactions = transactions.filter((item) => {
          return item.transaction_type === type;
        });
      } else {
        filteredTransactions = transactions;
      }

      this.transaction = this.sortTransactions(filteredTransactions);
    } catch (error) {
      this.loadError = error instanceof Error ? error.message : 'Could not load transactions.';
      console.error('Failed to load transactions:', error);
    } finally {
      this.isLoading = false;
      this.changeDetector.detectChanges();
    }
  }

  sortTransactions(transactions: Transaction[]): Transaction[] {
    const sortedTransactions = [...transactions];

    switch (this.transaction_type) {
      case 'newest':
        return sortedTransactions.sort(
          (first, second) => new Date(second.transaction_date).getTime() - new Date(first.transaction_date).getTime(),
        );
      case 'oldest':
        return sortedTransactions.sort(
          (first, second) => new Date(first.transaction_date).getTime() - new Date(second.transaction_date).getTime(),
        );
      case 'a-z':
        return sortedTransactions.sort((first, second) => first.description.localeCompare(second.description));
      case 'z-a':
        return sortedTransactions.sort((first, second) => second.description.localeCompare(first.description));
      case 'highest':
        return sortedTransactions.sort((first, second) => Number(second.amount) - Number(first.amount));
      case 'lowest':
        return sortedTransactions.sort((first, second) => Number(first.amount) - Number(second.amount));
    }
  }
}
