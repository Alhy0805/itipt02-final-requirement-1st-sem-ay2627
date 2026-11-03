import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonContent, IonIcon, IonInput, IonSearchbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, calendarOutline, trendingUpOutline, walletOutline } from 'ionicons/icons';

interface Budget {
  budget_id?: number;
  category_id: number;
  budget_name: string;
  budget_amount: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

interface BudgetCategory {
  category_id: number;
  category_name: string;
}

interface BudgetResources {
  budgets: Budget[];
  categories: BudgetCategory[];
}

@Component({
  selector: 'app-budgets',
  templateUrl: './budgets.page.html',
  styleUrls: ['./budgets.page.scss'],
  imports: [CommonModule, FormsModule, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonIcon, IonInput, IonSearchbar],
})
export class BudgetsPage implements OnInit {
  showForm = false;
  searchTerm = '';
  budgets: Budget[] = [];
  categories: BudgetCategory[] = [];
  userId = 0;
  isLoading = true;
  isSaving = false;
  errorMessage = '';
  newBudget: Budget = this.emptyBudget();
  private readonly apiUrl = 'http://127.0.0.1:8000';

  constructor() {
    addIcons({ addOutline, calendarOutline, trendingUpOutline, walletOutline });
  }

  ngOnInit(): void {
    void this.loadBudgets();
  }

  get totalBudget(): number {
    return this.budgets.reduce((total, budget) => total + Number(budget.budget_amount || 0), 0);
  }

  get currentPeriod(): string {
    return new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });
  }

  get filteredBudgets(): Budget[] {
    const term = this.searchTerm.trim().toLowerCase();
    return term ? this.budgets.filter((budget) => budget.budget_name.toLowerCase().includes(term)) : this.budgets;
  }

  async loadBudgets(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const savedUser = localStorage.getItem('finance-user');
      if (!savedUser) {
        throw new Error('Please sign in again to load your budgets.');
      }

      const user = JSON.parse(savedUser) as { user_id?: number };
      this.userId = Number(user.user_id);
      if (!Number.isInteger(this.userId) || this.userId <= 0) {
        throw new Error('Your saved user session is invalid. Please sign in again.');
      }

      const response = await fetch(`${this.apiUrl}/resources/${this.userId}`);
      if (!response.ok) {
        throw new Error(await this.getResponseError(response));
      }

      const resources = await response.json() as Partial<BudgetResources>;
      if (!Array.isArray(resources.budgets) || !Array.isArray(resources.categories)) {
        throw new Error('The backend returned incomplete budget or category data.');
      }

      this.budgets = resources.budgets;
      this.categories = resources.categories;
      localStorage.setItem('finance-resources', JSON.stringify(resources));
    } catch (error) {
      console.error('Unable to load budgets:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Unable to load budgets.';
    } finally {
      this.isLoading = false;
    }
  }

  async addBudget(): Promise<void> {
    if (this.isSaving) return;
    this.errorMessage = '';
    const budgetAmount = Number(this.newBudget.budget_amount);

    if (!Number.isFinite(budgetAmount) || budgetAmount <= 0) {
      this.errorMessage = 'Budget amount must be greater than zero.';
      return;
    }
    if (!this.newBudget.category_id) {
      this.errorMessage = 'Select a category for this budget.';
      return;
    }
    if (this.newBudget.end_date < this.newBudget.start_date) {
      this.errorMessage = 'End date must be on or after the start date.';
      return;
    }

    this.isSaving = true;
    try {
      const response = await fetch(`${this.apiUrl}/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: this.userId,
          category_id: Number(this.newBudget.category_id),
          budget_name: this.newBudget.budget_name.trim(),
          budget_amount: budgetAmount,
          start_date: this.newBudget.start_date,
          end_date: this.newBudget.end_date,
        }),
      });

      if (!response.ok) {
        throw new Error(await this.getResponseError(response));
      }

      const createdBudget = await response.json() as Budget;
      this.budgets = [createdBudget, ...this.budgets];
      this.resetForm();

      try {
        const savedResources = localStorage.getItem('finance-resources');
        const resources = savedResources ? JSON.parse(savedResources) as Record<string, unknown> : {};
        localStorage.setItem(
          'finance-resources',
          JSON.stringify({ ...resources, budgets: this.budgets, categories: this.categories }),
        );
      } catch (error) {
        console.error('Unable to update the cached budget list:', error);
        this.errorMessage = 'Budget saved, but the local dashboard cache could not be updated.';
      }
    } catch (error) {
      console.error('Unable to save budget:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Unable to save budget.';
    } finally {
      this.isSaving = false;
    }
  }

  getCategoryName(categoryId: number): string {
    return this.categories.find((category) => Number(category.category_id) === Number(categoryId))?.category_name ?? '—';
  }

  resetForm(): void {
    this.newBudget = this.emptyBudget();
    this.showForm = false;
  }

  private async getResponseError(response: Response): Promise<string> {
    const payload = await response.json().catch(() => null) as { detail?: unknown } | null;
    return typeof payload?.detail === 'string'
      ? payload.detail
      : `Request failed with status ${response.status}.`;
  }

  private emptyBudget(): Budget {
    return { category_id: 0, budget_name: '', budget_amount: 0, start_date: '', end_date: '', created_at: '' };
  }
}
