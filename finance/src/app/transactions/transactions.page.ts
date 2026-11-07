import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonInput, IonSearchbar, IonButton, IonDatetime, IonItem, IonSelect, IonSelectOption, IonList, IonHeader, IonListHeader } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { ellipsisVertical, searchCircle, swapVertical } from 'ionicons/icons';

interface Transaction {
  transaction_type: string;
  amount: number;
  description: string;
  transaction_date: string;
  notes: string | null;
}

type TransactionOrder = 'new' | 'old' | 'A-Z' | 'Z-A' | 'highest' | 'lowest';

const ORDER_API_VALUES: Record<TransactionOrder, string> = {
  new: 'newest',
  old: 'oldest',
  'A-Z': 'a-z',
  'Z-A': 'z-a',
  highest: 'highest',
  lowest: 'lowest',
};

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.page.html',
  styleUrls: ['./transactions.page.scss'],
  imports: [IonIcon, IonInput, IonContent, CommonModule, FormsModule, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonSearchbar, IonButton, IonDatetime, IonItem, IonSelect, IonSelectOption, IonList, IonHeader, IonListHeader],
})
export class TransactionsPage implements OnInit {
  user: any = null;
  userID: string | null = null;
  transaction: Transaction[] = [];
  transactionAPI = '';
  transaction_type: TransactionOrder = 'new';
  activeFilter = 'allBtn';
  loadError = '';
  isLoading = false;

  constructor(readonly changeDetector: ChangeDetectorRef) {
    addIcons({ ellipsisVertical, searchCircle, swapVertical });
  }

  ngOnInit(): void {
    const savedUser = localStorage.getItem('finance-user');
    this.user = savedUser ? JSON.parse(savedUser) : null;
    this.userID = this.user?.user_id ?? null;

    if (this.userID) {
      void this.orderTransactions('new');
    } else {
      this.loadError = 'Could not find a user ID. Please sign in again.';
    }
  }

  async filterTransactions(buttonId: string): Promise<void> {
    if (!this.userID) {
      this.loadError = 'Could not find a user ID. Please sign in again.';
      return;
    }

    this.activeFilter = buttonId;
    this.loadError = '';
    this.isLoading = true;

    const type =
      buttonId === 'incomebtn' ? 'Income' : buttonId === 'expenseBtn' ? 'Expense' : null;
    this.transactionAPI = type
      ? `http://127.0.0.1:8000/transactionFilter/${this.userID}/${type}`
      : `http://127.0.0.1:8000/transactionFilter/${this.userID}`;

    try {
      const response = await fetch(this.transactionAPI);
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const transactions: Transaction[] = await response.json();
      this.transaction = this.sortTransactions(transactions);
    } catch (error) {
      this.loadError = error instanceof Error ? error.message : 'Could not load transactions.';
      console.error('Failed to load transactions:', error);
    } finally {
      this.isLoading = false;
      this.changeDetector.detectChanges();
    }
  }

  async orderTransactions(order: TransactionOrder): Promise<void> {
    this.transaction_type = order;
    if (!this.userID) {
      this.loadError = 'Could not find a user ID. Please sign in again.';
      return;
    }

    this.loadError = '';
    this.isLoading = true;
    this.transactionAPI = `http://127.0.0.1:8000/transactionFilter/${this.userID}/true/${ORDER_API_VALUES[order]}`;

    try {
      const response = await fetch(this.transactionAPI);
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const transactions: Transaction[] = await response.json();
      const type =
        this.activeFilter === 'incomebtn'
          ? 'Income'
          : this.activeFilter === 'expenseBtn'
            ? 'Expense'
            : null;
      this.transaction = type
        ? transactions.filter((item) => item.transaction_type === type)
        : transactions;
    } catch (error) {
      this.loadError = error instanceof Error ? error.message : 'Could not load transactions.';
      console.error('Failed to order transactions:', error);
    } finally {
      this.isLoading = false;
      this.changeDetector.detectChanges();
    }
  }

  private sortTransactions(transactions: Transaction[]): Transaction[] {
    const sortedTransactions = [...transactions];

    switch (this.transaction_type) {
      case 'new':
        return sortedTransactions.sort(
          (first, second) =>
            new Date(second.transaction_date).getTime() - new Date(first.transaction_date).getTime(),
        );
      case 'old':
        return sortedTransactions.sort(
          (first, second) =>
            new Date(first.transaction_date).getTime() - new Date(second.transaction_date).getTime(),
        );
      case 'A-Z':
        return sortedTransactions.sort((first, second) =>
          first.description.localeCompare(second.description),
        );
      case 'Z-A':
        return sortedTransactions.sort((first, second) =>
          second.description.localeCompare(first.description),
        );
      case 'highest':
        return sortedTransactions.sort((first, second) => second.amount - first.amount);
      case 'lowest':
        return sortedTransactions.sort((first, second) => first.amount - second.amount);
    }
  }
}
