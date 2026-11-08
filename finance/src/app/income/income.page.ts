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
  trendingUpOutline,
  walletOutline,
} from 'ionicons/icons';

interface Income {
  transaction_id: number;
  transaction_type: 'Income';
  account_id: number;
  category_id: number | null;
  amount: number;
  description: string;
  transaction_date: string;
  notes: string | null;
}

interface IncomeAccount {
  account_id: number;
  account_name: string;
}

interface IncomeCategory {
  category_id: number;
  category_name: string;
  category_type: string;
}

interface NewIncome {
  account_id: number | null;
  category_id: number | null;
  amount: number | null;
  description: string;
  transaction_date: string;
  notes: string;
}

interface CachedResources {
  accounts?: IncomeAccount[];
  categories?: IncomeCategory[];
  transactions?: Income[];
  [key: string]: unknown;
}

@Component({
  selector: 'app-income',
  templateUrl: './income.page.html',
  styleUrls: ['./income.page.scss'],
  imports: [IonButton, IonContent, IonIcon, CommonModule, FormsModule],
})
export class IncomePage implements OnInit {
  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly incomeAPI = 'http://127.0.0.1:8000';
  incomes: Income[] = [];
  accounts: IncomeAccount[] = [];
  categories: IncomeCategory[] = [];
  newIncome: NewIncome = this.emptyIncome();
  searchTerm = '';
  errorMessage = '';
  successMessage = '';
  isLoading = true;
  isSaving = false;
  showForm = false;
  deletingIncomeId: number | null = null;
  userId: number | null = null;

  constructor() {
    addIcons({
      addOutline,
      calendarOutline,
      closeOutline,
      searchOutline,
      trashOutline,
      trendingUpOutline,
      walletOutline,
    });
  }

  ngOnInit(): void {
    void this.loadIncomes();
  }

  get filteredIncomes(): Income[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.incomes;

    return this.incomes.filter((income) =>
      [
        income.description,
        income.notes ?? '',
        this.getCategoryName(income.category_id),
        this.getAccountName(income.account_id),
      ].some((value) => value.toLowerCase().includes(term)),
    );
  }

  get totalIncome(): number {
    return this.incomes.reduce((total, income) => total + Number(income.amount || 0), 0);
  }

  get monthlyIncome(): number {
    const currentMonth = this.getToday().slice(0, 7);
    return this.incomes
      .filter((income) => income.transaction_date.slice(0, 7) === currentMonth)
      .reduce((total, income) => total + Number(income.amount || 0), 0);
  }

  get currentMonth(): string {
    return new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }

  async loadIncomes(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const savedUser = localStorage.getItem('finance-user');
      if (!savedUser) throw new Error('Please sign in again to view your income.');

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
        this.categories = (resources.categories ?? []).filter((category) => category.category_type === 'Income');
      }

      const requests: Promise<Response>[] = [fetch(`${this.incomeAPI}/transactionFilter/${userId}/Income`)];
      if (this.accounts.length === 0) {
        requests.push(fetch(`${this.incomeAPI}/accounts/${userId}`));
      }

      const responses = await Promise.all(requests);
      for (const response of responses) {
        if (!response.ok) throw new Error(await this.getResponseError(response));
      }

      this.incomes = (await responses[0].json()) as Income[];
      if (responses[1]) this.accounts = (await responses[1].json()) as IncomeAccount[];
    } catch (error) {
      console.error('Unable to load income:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Unable to load income.';
    } finally {
      this.isLoading = false;
      this.changeDetector.detectChanges();
    }
  }

  toggleForm(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.showForm = !this.showForm;
    if (this.showForm) this.newIncome = this.emptyIncome();
  }

  async saveIncome(): Promise<void> {
    if (this.isSaving || !this.userId) return;

    const amount = Number(this.newIncome.amount);
    const description = this.newIncome.description.trim();
    if (!description) {
      this.errorMessage = 'Enter a description for this income.';
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      this.errorMessage = 'Amount must be greater than zero.';
      return;
    }
    if (!this.newIncome.account_id) {
      this.errorMessage = 'Select the account where this income will be deposited.';
      return;
    }
    if (!this.newIncome.transaction_date) {
      this.errorMessage = 'Choose an income date.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';
    try {
      const response = await fetch(`${this.incomeAPI}/addincome/${this.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: this.newIncome.account_id,
          category_id: this.newIncome.category_id,
          amount,
          description,
          transaction_date: this.newIncome.transaction_date,
          notes: this.newIncome.notes.trim() || null,
        }),
      });
      if (!response.ok) throw new Error(await this.getResponseError(response));

      const savedIncome = (await response.json()) as Income;
      this.incomes = [savedIncome, ...this.incomes];
      this.updateCachedTransactions();
      this.showForm = false;
      this.newIncome = this.emptyIncome();
      this.successMessage = 'Income added successfully.';
    } catch (error) {
      console.error('Unable to save income:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Unable to save income.';
    } finally {
      this.isSaving = false;
      this.changeDetector.detectChanges();
    }
  }

  async deleteIncome(income: Income): Promise<void> {
    if (!this.userId || this.deletingIncomeId !== null || this.isSaving) return;
    if (!window.confirm(`Delete "${income.description}"? This cannot be undone.`)) return;

    this.deletingIncomeId = income.transaction_id;
    this.errorMessage = '';
    this.successMessage = '';
    try {
      const response = await fetch(`${this.incomeAPI}/income/${this.userId}/${income.transaction_id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(await this.getResponseError(response));

      this.incomes = this.incomes.filter((item) => item.transaction_id !== income.transaction_id);
      this.updateCachedTransactions();
      this.successMessage = 'Income deleted successfully.';
    } catch (error) {
      console.error('Unable to delete income:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Unable to delete income.';
    } finally {
      this.deletingIncomeId = null;
      this.changeDetector.detectChanges();
    }
  }

  getCategoryName(categoryId: number | null): string {
    return (
      this.categories.find((category) => Number(category.category_id) === Number(categoryId))?.category_name ?? 'Other'
    );
  }

  getAccountName(accountId: number): string {
    return this.accounts.find((account) => Number(account.account_id) === Number(accountId))?.account_name ?? 'Account';
  }

  private updateCachedTransactions(): void {
    const savedResources = localStorage.getItem('finance-resources');
    const resources = savedResources ? (JSON.parse(savedResources) as CachedResources) : {};
    const otherTransactions = (resources.transactions ?? []).filter(
      (transaction) => transaction.transaction_type !== 'Income',
    );
    localStorage.setItem(
      'finance-resources',
      JSON.stringify({ ...resources, transactions: [...otherTransactions, ...this.incomes] }),
    );
  }

  private emptyIncome(): NewIncome {
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
