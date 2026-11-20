import { ChangeDetectorRef, Component } from '@angular/core';
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
import { finalize } from 'rxjs';
import { MainService } from '../services/main-service';

interface DashboardAccount {
  balance: number | string;
}

interface DashboardTransaction {
  transaction_id: number;
  category_id: number | null;
  transaction_type: 'Income' | 'Expense';
  amount: number | string;
  description: string;
  transaction_date: string;
}

interface DashboardBudget {
  budget_id: number;
  category_id: number;
  budget_name: string;
  budget_amount: number | string;
  start_date: string;
  end_date: string;
}

interface DashboardResources {
  accounts?: DashboardAccount[];
  transactions?: DashboardTransaction[];
  budgets?: DashboardBudget[];
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
export class DashboardPage {
  userName = '';
  balance: number | null = null;
  balanceError = '';
  income: number | null = null;
  incomeError = '';
  expense: number | null = null;
  expenseError = '';
  recentTransactions: DashboardTransaction[] = [];
  monthlyBudgets: DashboardBudget[] = [];
  recentTransactionsError = '';
  monthlyBudgetError = '';
  isDashboardDataLoading = true;
  private transactions: DashboardTransaction[] = [];

  constructor(private readonly changeDetector: ChangeDetectorRef, private mainService: MainService) {
    addIcons({
      pieChartOutline,
      trendingDownOutline,
      trendingUpOutline,
      walletOutline,
    });
  }

  get currentMonthLabel(): string {
    return new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }

  ionViewWillEnter(): void {
    const user = this.mainService.getUserData();
    const userId = Number(user?.user_id);
    this.userName = user?.full_name ?? '';
    this.balance = null;
    this.balanceError = '';
    this.income = null;
    this.incomeError = '';
    this.expense = null;
    this.expenseError = '';
    this.recentTransactions = [];
    this.monthlyBudgets = [];
    this.recentTransactionsError = '';
    this.monthlyBudgetError = '';
    this.isDashboardDataLoading = true;



    this.mainService
      .getResources(userId)
      .pipe(
        finalize(() => {
          this.isDashboardDataLoading = false;
          this.changeDetector.markForCheck();
        }),
      )
      .subscribe({
        next: (resources: DashboardResources) => {
          this.transactions = resources.transactions ?? [];
          const { start, end } = this.getCurrentMonthBounds();

          this.balance = (resources.accounts ?? []).reduce(
            (total, account) => total + Number(account.balance),
            0,
          );
          this.income = this.sumTransactions('Income');
          this.expense = this.sumTransactions('Expense');
          this.recentTransactions = [...this.transactions]
            .sort((first, second) => second.transaction_date.localeCompare(first.transaction_date))
            .slice(0, 3);
          this.monthlyBudgets = (resources.budgets ?? [])
            .filter(
              (budget) => budget.start_date.slice(0, 10) <= end && budget.end_date.slice(0, 10) >= start,
            )
            .slice(0, 3);
        },
        error: (error) => {
          this.balanceError = 'Could not load balance.';
          this.incomeError = 'Could not load income.';
          this.expenseError = 'Could not load expenses.';
          this.recentTransactionsError = 'Could not load recent transactions.';
          this.monthlyBudgetError = 'Could not load monthly budgets.';
          console.error('Failed to load dashboard data:', error);
        },
      });
  }

  getBudgetSpent(budget: DashboardBudget): number {
    const start = budget.start_date.slice(0, 10);
    const end = budget.end_date.slice(0, 10);

    return this.transactions
      .filter(
        (transaction) =>
          transaction.transaction_type === 'Expense' &&
          Number(transaction.category_id) === Number(budget.category_id) &&
          transaction.transaction_date.slice(0, 10) >= start &&
          transaction.transaction_date.slice(0, 10) <= end,
      )
      .reduce((total, transaction) => total + Number(transaction.amount), 0);
  }

  private sumTransactions(type: DashboardTransaction['transaction_type']): number {
    return this.transactions
      .filter((transaction) => transaction.transaction_type === type)
      .reduce((total, transaction) => total + Number(transaction.amount), 0);
  }

  getBudgetProgress(budget: DashboardBudget): number {
    const budgetAmount = Number(budget.budget_amount);
    return budgetAmount > 0 ? Math.min(this.getBudgetSpent(budget) / budgetAmount, 1) : 0;
  }

  private getCurrentMonthBounds(): { start: string; end: string } {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();

    return {
      start: `${year}-${month}-01`,
      end: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
    };
  }
}
