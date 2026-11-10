import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonButton, IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  calendarOutline,
  closeOutline,
  searchOutline,
  trashOutline,
  trendingDownOutline,
  walletOutline,
} from 'ionicons/icons';

interface Expense {
  transaction_id: number;
  transaction_type: 'Expense';
  account_id: number;
  category_id: number | null;
  amount: number;
  description: string;
  transaction_date: string;
  notes: string | null;
}

interface ExpenseAccount {
  account_id: number;
  account_name: string;
  account_types: { account_type_id: number; type_name: string }[];
}

interface ExpenseCategory {
  category_id: number;
  category_name: string;
  category_type: string;
  user_id?: number | null;
}

interface NewExpense {
  account_id: number | null;
  category_id: number | null;
  amount: number | null;
  description: string;
  transaction_date: string;
  notes: string;
}

interface CachedResources {
  accounts?: ExpenseAccount[];
  categories?: ExpenseCategory[];
  transactions?: Expense[];
  [key: string]: unknown;
}

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.page.html',
  styleUrls: ['./expenses.page.scss'],
  imports: [IonButton, IonContent, IonIcon, CommonModule, FormsModule],
})
export class ExpensesPage implements OnInit {
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly expenseAPI = 'http://127.0.0.1:8000';
  expenses: Expense[] = [];
  accounts: ExpenseAccount[] = [];
  categories: ExpenseCategory[] = [];
  newExpense: NewExpense = this.emptyExpense();
  searchTerm = '';
  errorMessage = '';
  successMessage = '';
  isLoading = true;
  isSaving = false;
  showForm = false;
  deletingExpenseId: number | null = null;
  userId: number | null = null;

  constructor() {
    addIcons({
      addOutline,
      calendarOutline,
      closeOutline,
      searchOutline,
      trashOutline,
      trendingDownOutline,
      walletOutline,
    });
  }

  ngOnInit(): void {
    void this.loadExpenses();
  }

  get filteredExpenses(): Expense[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.expenses;

    return this.expenses.filter((expense) =>
      [
        expense.description,
        expense.notes ?? '',
        this.getCategoryName(expense.category_id),
        this.getAccountLabel(expense.account_id),
      ].some((value) => value.toLowerCase().includes(term)),
    );
  }

  get totalExpenses(): number {
    return this.expenses.reduce((total, expense) => total + Number(expense.amount || 0), 0);
  }

  get monthlyExpenses(): number {
    const currentMonth = this.getToday().slice(0, 7);
    return this.expenses
      .filter((expense) => expense.transaction_date.slice(0, 7) === currentMonth)
      .reduce((total, expense) => total + Number(expense.amount || 0), 0);
  }

  get currentMonth(): string {
    return new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }

  async loadExpenses(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const savedUser = localStorage.getItem('finance-user');
      if (!savedUser) throw new Error('Please sign in again to view your expenses.');

      const user = JSON.parse(savedUser) as { user_id?: number };
      const userId = Number(user.user_id);
      if (!Number.isInteger(userId) || userId <= 0) {
        throw new Error('Your saved user session is invalid. Please sign in again.');
      }
      this.userId = userId;

      const savedResources = localStorage.getItem('finance-resources');
      if (savedResources) {
        const resources = JSON.parse(savedResources) as CachedResources;
        this.accounts = resources.accounts ?? [];
        this.categories = (resources.categories ?? []).filter((category) => category.category_type === 'Expense');
      }

      const requests = [
        fetch(`${this.expenseAPI}/transactionFilter/${userId}/Expense`),
        fetch(`${this.expenseAPI}/categories/${userId}`),
        fetch(`${this.expenseAPI}/accounts/${userId}`),
      ];

      const responses = await Promise.all(requests);
      for (const response of responses) {
        if (!response.ok) throw new Error(await this.getResponseError(response));
      }

      this.expenses = (await responses[0].json()) as Expense[];
      this.categories = this.uniqueCategories(
        ((await responses[1].json()) as ExpenseCategory[]).filter((category) => category.category_type === 'Expense'),
      );
      this.accounts = (await responses[2].json()) as ExpenseAccount[];
      this.updateCachedAccounts();
      this.updateCachedCategories();
    } catch (error) {
      console.error('Unable to load expenses:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Unable to load expenses.';
    } finally {
      this.isLoading = false;
      this.changeDetector.detectChanges();
    }
  }

  toggleForm(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.showForm = !this.showForm;
    if (this.showForm) this.newExpense = this.emptyExpense();
  }

  async saveExpense(): Promise<void> {
    if (this.isSaving || !this.userId) return;

    const amount = Number(this.newExpense.amount);
    const description = this.newExpense.description.trim();
    if (!description) {
      this.errorMessage = 'Enter a description for this expense.';
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      this.errorMessage = 'Amount must be greater than zero.';
      return;
    }
    if (!this.newExpense.account_id) {
      this.errorMessage = 'Select the account this expense was paid from.';
      return;
    }
    if (!this.newExpense.transaction_date) {
      this.errorMessage = 'Choose an expense date.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    try {
      const response = await fetch(`${this.expenseAPI}/addexpense/${this.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: this.newExpense.account_id,
          category_id: this.newExpense.category_id,
          amount,
          description,
          transaction_date: this.newExpense.transaction_date,
          notes: this.newExpense.notes.trim() || null,
        }),
      });
      if (!response.ok) throw new Error(await this.getResponseError(response));

      const savedExpense = (await response.json()) as Expense;
      this.expenses = [savedExpense, ...this.expenses];
      this.updateCachedTransactions();
      this.showForm = false;
      this.newExpense = this.emptyExpense();
      this.successMessage = 'Expense added successfully.';
    } catch (error) {
      console.error('Unable to save expense:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Unable to save expense.';
    } finally {
      this.isSaving = false;
      this.changeDetector.detectChanges();
    }
  }

  async deleteExpense(expense: Expense): Promise<void> {
    if (!this.userId || this.deletingExpenseId !== null || this.isSaving) return;
    if (!window.confirm(`Delete "${expense.description}"? This cannot be undone.`)) return;

    this.deletingExpenseId = expense.transaction_id;
    this.errorMessage = '';
    this.successMessage = '';
    try {
      const response = await fetch(`${this.expenseAPI}/expense/${this.userId}/${expense.transaction_id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(await this.getResponseError(response));

      this.expenses = this.expenses.filter((item) => item.transaction_id !== expense.transaction_id);
      this.updateCachedTransactions();
      this.successMessage = 'Expense deleted successfully.';
    } catch (error) {
      console.error('Unable to delete expense:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Unable to delete expense.';
    } finally {
      this.deletingExpenseId = null;
      this.changeDetector.detectChanges();
    }
  }

  getCategoryName(categoryId: number | null): string {
    return (
      this.categories.find((category) => Number(category.category_id) === Number(categoryId))?.category_name ?? 'Other'
    );
  }

  getAccountLabel(accountId: number): string {
    const account = this.accounts.find((item) => Number(item.account_id) === Number(accountId));
    return account?.account_name ?? 'Unknown account';
  }

  private updateCachedTransactions(): void {
    const savedResources = localStorage.getItem('finance-resources');
    const resources = savedResources ? (JSON.parse(savedResources) as CachedResources) : {};
    const otherTransactions = (resources.transactions ?? []).filter(
      (transaction) => transaction.transaction_type !== 'Expense',
    );
    localStorage.setItem(
      'finance-resources',
      JSON.stringify({ ...resources, transactions: [...otherTransactions, ...this.expenses] }),
    );
  }

  private updateCachedCategories(): void {
    const savedResources = localStorage.getItem('finance-resources');
    const resources = savedResources ? (JSON.parse(savedResources) as CachedResources) : {};
    const otherCategories = (resources.categories ?? []).filter((category) => category.category_type !== 'Expense');
    localStorage.setItem(
      'finance-resources',
      JSON.stringify({ ...resources, categories: [...otherCategories, ...this.categories] }),
    );
  }

  private updateCachedAccounts(): void {
    const savedResources = localStorage.getItem('finance-resources');
    const resources = savedResources ? (JSON.parse(savedResources) as CachedResources) : {};
    localStorage.setItem('finance-resources', JSON.stringify({ ...resources, accounts: this.accounts }));
  }

  private uniqueCategories(categories: ExpenseCategory[]): ExpenseCategory[] {
    const categoryMap = new Map<string, ExpenseCategory>();
    for (const category of categories) {
      const key = `${category.category_type}:${category.category_name.trim().toLocaleLowerCase()}`;
      if (!categoryMap.has(key)) categoryMap.set(key, category);
    }
    return [...categoryMap.values()];
  }

  private emptyExpense(): NewExpense {
    return {
      account_id: this.accounts[0]?.account_id ?? null,
      category_id: null,
      amount: null,
      description: '',
      transaction_date: this.getToday(),
      notes: '',
    };
  }

  private getToday(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private async getResponseError(response: Response): Promise<string> {
    const payload = (await response.json().catch(() => null)) as { detail?: unknown } | null;
    return typeof payload?.detail === 'string' ? payload.detail : `Request failed with status ${response.status}.`;
  }
}
