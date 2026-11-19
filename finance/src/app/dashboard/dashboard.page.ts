import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonProgressBar,
} from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { pieChartOutline, trendingDownOutline, trendingUpOutline, walletOutline } from 'ionicons/icons';
import { MainService } from '../services/main-service';
import type { Transaction } from '../services/main-service';

interface DashboardBudget {
  category_id: number | string;
  budget_name: string;
  budget_amount: number | string;
  start_date: string;
  end_date: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  imports: [
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonButton,
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonProgressBar,
    RouterLink,
    CommonModule,
  ],
})
export class DashboardPage implements OnInit {
  get userName(): string {
    const fullName = this.mainService.getUserData()?.full_name;
    return typeof fullName === 'string' && fullName.trim() ? fullName.trim() : 'there';
  }

  balance: number = 0;
  income: number = 0;
  expenses: number = 0;
  totalbudget: number = 0;
  recentTransactions: Transaction[] = [];
  monthlyBudgets: DashboardBudget[] = [];
  monthlyBudgetError = '';

  localStorageData: any = null;

  constructor(private readonly changeDetector: ChangeDetectorRef, private mainService: MainService) {
    addIcons({
      pieChartOutline,
      trendingDownOutline,
      trendingUpOutline,
      walletOutline,
    });
  }
  GetLocalStorageData() {
    this.localStorageData = this.mainService.getLocalStorageData();
  }

  GetUserData() {
    return this.mainService.getUserData();
  }

  ngOnInit(){
  }

  async ionViewWillEnter() {
    const userId = this.mainService.getUserId();
    const [income, expenses, transactions] = await Promise.all([
      this.mainService.getTotalIncome(),
      this.mainService.getTotalExpense(),
      this.mainService.filterTransactionData(userId, 'all', 'newest'),
    ]);

    this.income = income;
    this.expenses = expenses;
    this.balance = this.mainService.getTotalBalance() - expenses;
    this.recentTransactions = transactions.slice(0, 3);

    await this.loadMonthlyBudgets(userId, transactions);
    this.changeDetector.detectChanges();
  }

  getBudgetSpent(budget: DashboardBudget): number {
    return this.dashboardTransactions
      .filter(
        (transaction) =>
          transaction.transaction_type === 'Expense' &&
          Number(transaction.category_id) === Number(budget.category_id) &&
          transaction.transaction_date >= budget.start_date &&
          transaction.transaction_date <= budget.end_date,
      )
      .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  }

  getBudgetProgress(budget: DashboardBudget): number {
    const budgetAmount = Number(budget.budget_amount);
    return budgetAmount > 0 ? Math.min(this.getBudgetSpent(budget) / budgetAmount, 1) : 0;
  }

  private dashboardTransactions: Transaction[] = [];

  private async loadMonthlyBudgets(userId: number, transactions: Transaction[]): Promise<void> {
    this.monthlyBudgetError = '';
    this.dashboardTransactions = transactions;

    try {
      const response = await fetch(`http://127.0.0.1:8000/budget/${encodeURIComponent(userId)}`);
      if (!response.ok) {
        throw new Error(`Could not load monthly budgets (${response.status}).`);
      }

      const budgets: unknown = await response.json();
      if (!Array.isArray(budgets)) {
        throw new Error('The budget API returned an invalid response.');
      }

      const { start, end } = this.getCurrentMonthRange();
      this.monthlyBudgets = (budgets as DashboardBudget[])
        .filter((budget) => budget.start_date <= end && budget.end_date >= start)
        .sort((first, second) => first.start_date.localeCompare(second.start_date))
        .slice(0, 3);
    } catch (error) {
      this.monthlyBudgets = [];
      this.monthlyBudgetError =
        error instanceof Error ? error.message : 'Could not load monthly budgets.';
      console.error('Failed to load monthly budgets:', error);
    }
  }

  private getCurrentMonthRange(): { start: string; end: string } {
    const parts = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      timeZone: 'Asia/Manila',
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const month = `${values['year']}-${values['month']}`;
    const lastDay = new Date(Number(values['year']), Number(values['month']), 0).getDate();
    return { start: `${month}-01`, end: `${month}-${String(lastDay).padStart(2, '0')}` };
  }
}
