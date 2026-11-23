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
import { createOutline, ellipsisVertical, searchCircle, swapVertical, trashOutline } from 'ionicons/icons';
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
  editingTransactionId: number | null = null;

  constructor() {
    addIcons({ createOutline, ellipsisVertical, searchCircle, swapVertical, trashOutline });
  }

  get categoriesForTransactionType(): any[] {
    return this.categories
        .filter(category => category.category_type?.toLowerCase() === this.transactionType)
        .sort((a, b) => {
            const aOther = a.category_name.toLowerCase().startsWith('other');
            const bOther = b.category_name.toLowerCase().startsWith('other');

            if (aOther && !bOther) return 1;
            if (!aOther && bOther) return -1;

            return a.category_name.localeCompare(b.category_name);
        });
      }

  private getToday(): string {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  }

  private resetTransactionForm(): void {
    this.editingTransactionId = null;
    this.selectedAccountId = null;
    this.selectedCategoryId = null;
    this.transactionType = '';
    this.formDescription = '';
    this.formAmount = null;
    this.formDate = this.getToday();
    this.formNotes = '';
  }

  cancelEdit(): void {
    if (this.editingTransactionId === null) return;
    this.resetTransactionForm();
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
      this.refreshLocalResources();
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

    if (this.editingTransactionId !== null) {
      const updatePayload = {
        account_id: this.selectedAccountId,
        category_id: this.selectedCategoryId,
        amount: Number(this.formAmount),
        description: this.formDescription.trim(),
        transaction_date: this.formDate,
        notes: this.formNotes.trim() || null,
      };
      const update$ = this.transactionType === 'income'
        ? this.mainService.updateIncome(this.userID, this.editingTransactionId, updatePayload)
        : this.mainService.updateExpense(this.userID, this.editingTransactionId, updatePayload);

      update$.subscribe({
        next: () => {
          this.refreshLocalResources();
          this.resetTransactionForm();
          void this.loadTransactions();
        },
        error: (error) => {
          console.error('Failed to update transaction:', error);
        },
      });
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
    this.refreshLocalResources();
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
      this.refreshLocalResources();
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

  beginEdit(item: Transaction): void {
    if (!item.transaction_id) {
      window.alert('This transaction could not be edited because it has no transaction ID.');
      return;
    }

    this.editingTransactionId = item.transaction_id;
    this.transactionType = item.transaction_type.toLowerCase();
    this.selectedAccountId = item.account_id ?? null;
    this.selectedCategoryId = item.category_id ?? null;
    this.formDescription = item.description;
    this.formAmount = Number(item.amount);
    this.formDate = item.transaction_date;
    this.formNotes = item.notes ?? '';
  }

  deleteTransaction(item: Transaction): void {
    if (!item.transaction_id) {
      window.alert('This transaction could not be deleted because it has no transaction ID.');
      return;
    }
    if (!window.confirm(`Delete "${item.description}"? This cannot be undone.`)) return;

    const delete$ = item.transaction_type.toLowerCase() === 'income'
      ? this.mainService.deleteIncome(this.userID, item.transaction_id)
      : this.mainService.deleteExpense(this.userID, item.transaction_id);

    delete$.subscribe({
      next: () => {
        this.refreshLocalResources();
        void this.loadTransactions();
      },
      error: (error) => {
        console.error('Failed to delete transaction:', error);
      },
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

  private refreshLocalResources(): void {
    if (!this.userID) return;

    this.mainService.getResources(Number(this.userID)).subscribe({
      next: (resources) => {
        localStorage.setItem('finance-resources', JSON.stringify(resources));
      },
      error: (error) => {
        console.error('Failed to refresh local resources:', error);
      },
    });
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
