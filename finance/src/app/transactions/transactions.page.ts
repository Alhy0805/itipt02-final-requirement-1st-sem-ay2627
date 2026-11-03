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
  transaction_type = 'new';
  activeFilter = 'allBtn';
  loadError = '';
  isLoading = false;

  constructor(readonly changeDetector: ChangeDetectorRef) {
    addIcons({ ellipsisVertical, searchCircle, swapVertical });
  }

  ngOnInit(): void {
    const savedUser = localStorage.getItem('finance-user');
    this.user = savedUser ? JSON.parse(savedUser) : null;
    this.userID = this.user.user_id;

    if (this.userID) {
      this.filterTransactions('allBtn');
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

    let type: string | null = null;
    if (buttonId === 'incomebtn') {
      type = 'Income';
    } else if (buttonId === 'expenseBtn') {
      type = 'Expense';
    }

    if (type !== null) {
      this.transactionAPI = `http://127.0.0.1:8000/transactionFilter/${this.userID}/${type}`;
    } else {
      this.transactionAPI = `http://127.0.0.1:8000/transactionFilter/${this.userID}`;
    }

    try {
      const response = await fetch(this.transactionAPI);
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      this.transaction = await response.json();
    } catch (error) {
      this.loadError = error instanceof Error ? error.message : 'Could not load transactions.';
      console.error('Failed to load transactions:', error);
    } finally {
      this.isLoading = false;
      this.changeDetector.detectChanges();
    }
  }
}
