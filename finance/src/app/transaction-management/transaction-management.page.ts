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
import { firstValueFrom } from 'rxjs';
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
export class TransactionManagementPage {
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly mainService = inject(MainService);
  user: any = null;
  userID: any | null = null;
  categories: any[] = [];
  accounts: any[] = [];
  transaction: Transaction[] = [];
  transaction_order: TransactionOrder = 'newest';
  activeFilter = 'allBtn';
  searchTerm = '';
  loadError = '';
  isLoading = false;
  selectedAccountId: number | null = null;
  selectedCategoryId: number | null = null;
  transactionType: string = '';
  formDescription: string = '';
  formAmount: number | null = null;
  formDate = this.getToday();
  formNotes : string = '';

  constructor() {
    addIcons({ ellipsisVertical, searchCircle, swapVertical });
  }

  get categoriesForTransactionType(): any[] {
    if (!this.transactionType) return [];
    return this.categories.filter(
      (category) => category.category_type?.toLowerCase() === this.transactionType,
    );
  }

  private getToday(): string {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  }

  private resetTransactionForm(): void {
    this.selectedAccountId = null;
    this.selectedCategoryId = null;
    this.transactionType = '';
    this.formDescription = '';
    this.formAmount = null;
    this.formDate = this.getToday();
    this.formNotes = '';
  }

  ionViewWillEnter():void {
    this.formDate = this.getToday();
    const savedUser = localStorage.getItem('finance-user');

    if (savedUser) {
      this.user = JSON.parse(savedUser);
    } else {
      this.user = null;
    }
    this.userID = this.user?.user_id ?? null;

    if (this.userID) {
      this.filterTransactions('allBtn');
      this.mainService.getCategories(Number(this.userID)).subscribe({
        next: (categories) => {
          this.categories = categories;
          this.changeDetector.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load categories:', error);
        },
      });
      this.mainService.getAccounts(Number(this.userID)).subscribe({
        next: (accounts) => {
          this.accounts = accounts;
          this.changeDetector.markForCheck();
        },
        error: (error) => {
          console.error('Failed to load accounts:', error);
        },
      });
    } else {
      this.loadError = 'Could not find a user ID. Please sign in again.';
    }
  }

  enterTransaction(): void {
    const missingFields: string[] = [];
    if (!this.selectedCategoryId) missingFields.push('category');
    if (!this.formDescription.trim()) missingFields.push('description');
    if (this.formAmount === null || !Number.isFinite(Number(this.formAmount)) || this.formAmount <= 0) {
      missingFields.push('a valid amount');
    }
    if (!this.transactionType) missingFields.push('transaction type');
    if (!this.selectedAccountId) missingFields.push('wallet');

    if (missingFields.length > 0) {
      window.alert(`Please enter or select: ${missingFields.join(', ')}.`);
      return;
    }

    if(this.transactionType === 'income'){
      this.mainService.addIncome(this.userID, {
    account_id: this.selectedAccountId,
    category_id: this.selectedCategoryId,
    amount: Number(this.formAmount),
    description: this.formDescription.trim(),
    transaction_date: this.formDate,
    notes: this.formNotes.trim() || null,
  }).subscribe({
    next: (income) => {
      console.log('Income added:', income);
    this.resetTransactionForm();
      void this.loadTransactions();
    },
    error: (error) => {
      console.error('Failed to add income:', error);
    },
  });
    }else if(this.transactionType === 'expense'){
    this.mainService.addExpense(this.userID, {
      account_id: this.selectedAccountId,
      category_id: this.selectedCategoryId,
      amount: Number(this.formAmount),
      description: this.formDescription.trim(),
      transaction_date: this.formDate,
      notes: this.formNotes.trim() || null,
    }).subscribe({
      next: (expense) => {
        console.log('Expense added:', expense);
      this.resetTransactionForm();
        void this.loadTransactions();
      },
      error: (error) => {
        console.error('Failed to add expense:', error);
      },
    });
    } else {
      alert(3)
    }
    console.log('Transaction form:', {
      accountId: this.selectedAccountId,
      categoryId: this.selectedCategoryId,
      transactionType: this.transactionType,
      description: this.formDescription,
      amount: this.formAmount,
      date: this.formDate,
      notes: this.formNotes,
    });
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
    this.transaction_order = order;
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
      this.transaction = await firstValueFrom(
        this.mainService.filterTransactionData(
          this.userID,
          filter,
          this.transaction_order,
          this.searchTerm,
        ),
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
