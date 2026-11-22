import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import type { ElementRef, OnDestroy } from '@angular/core';
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
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';

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

interface SavingGoal {
  goal_id: number;
  goal_name: string;
  target_amount: number | string;
  target_date?: string;
}

interface GoalContribution {
  goal_id: number;
  amount: number | string;
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

export class DashboardPage implements OnDestroy {
  private spendingChart?: Chart<'bar', number[], string>;
  userName = '';
  balance: number | null = null;
  balanceError = '';
  income: number | null = null;
  incomeError = '';
  expense: number | null = null;
  expenseError = '';
  expenses: number | null = null;
  remainingBudget: number | null = null;
  remainingBudgetError = '';
  recentTransactions: DashboardTransaction[] = [];
  monthlyBudgets: DashboardBudget[] = [];
  recentTransactionsError = '';
  monthlyBudgetError = '';
  isDashboardDataLoading = true;
  savingGoals: SavingGoal[] = [];
  goalContributions: GoalContribution[] = [];
  spendingOverviewLabels: string[] = [];
  spendingOverviewIncome: number[] = [];
  spendingOverviewExpenses: number[] = [];
  private transactions: DashboardTransaction[] = [];

  constructor(private readonly changeDetector: ChangeDetectorRef, private mainService: MainService) {
    addIcons({
      pieChartOutline,
      trendingDownOutline,
      trendingUpOutline,
      walletOutline,
    });
    Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);
  }

  @ViewChild('spendingChart')
  set spendingChartElement(element: ElementRef<HTMLCanvasElement> | undefined) {
    if (!element) {
      this.spendingChart?.destroy();
      this.spendingChart = undefined;
      return;
    }

    this.spendingChart = new Chart<'bar', number[], string>(element.nativeElement, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Income',
            data: [],
            backgroundColor: '#168b69',
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: 'Expenses',
            data: [],
            backgroundColor: '#d65a72',
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (context) =>
                `${context.dataset.label}: ${this.formatCurrency(Number(context.parsed.y ?? 0))}`,
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => this.formatCurrency(Number(value)),
            },
          },
        },
      },
    });
    this.updateSpendingOverview();
  }

  ngOnDestroy(): void {
    this.spendingChart?.destroy();
    this.spendingChart = undefined;
  }

  get currentMonthLabel(): string {
    return new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }

  async ionViewWillEnter(): Promise<void> {
    this.isDashboardDataLoading = true;
    const user = this.mainService.getUserData();
    const userId = Number(user?.user_id);
    this.userName = user?.full_name ?? '';
    this.balance = null;
    this.balanceError = '';
    this.income = null;
    this.incomeError = '';
    this.expense = null;
    this.expenses = null;
    this.expenseError = '';
    this.remainingBudget = null;
    this.remainingBudgetError = '';
    this.recentTransactions = [];
    this.monthlyBudgets = [];
    this.recentTransactionsError = '';
    this.monthlyBudgetError = '';
    this.loadSavingGoals();

    try {
      const [income, expenses, balance, transactions, budgets] = await Promise.all([
        this.mainService.getTotalIncome(),
        this.mainService.getTotalExpense(),
        this.mainService.getTotalBalance(),
        this.mainService.getDashboardTransactions(userId),
        this.mainService.getBudgets(),
      ]);

      this.income = income;
      this.expense = expenses;
      this.expenses = expenses;
      this.balance = balance;
      const dashboardTransactions = transactions
        .filter((transaction) =>
          transaction.transaction_type === 'Income' || transaction.transaction_type === 'Expense',
        )
        .map((transaction) => ({
          transaction_id: transaction.transaction_id,
          category_id: transaction.category_id,
          transaction_type: transaction.transaction_type as 'Income' | 'Expense',
          amount: transaction.amount,
          description: transaction.description,
          transaction_date: transaction.transaction_date,
        }));
      this.transactions = dashboardTransactions;
      this.recentTransactions = [...dashboardTransactions]
        .sort((first, second) =>
          String(second.transaction_date ?? '').localeCompare(String(first.transaction_date ?? '')),
        )
        .slice(0, 3);

      const { start, end } = this.getCurrentMonthBounds();
      const currentMonthBudgets = budgets
        .filter((budget) =>
          Boolean(budget.start_date && budget.end_date) &&
          budget.start_date.slice(0, 10) <= end &&
          budget.end_date.slice(0, 10) >= start,
        )
        .map((budget) => ({
          budget_id: budget.budget_id ?? 0,
          category_id: budget.category_id,
          budget_name: budget.budget_name,
          budget_amount: budget.budget_amount,
          start_date: budget.start_date,
          end_date: budget.end_date,
        }));
      this.monthlyBudgets = currentMonthBudgets.slice(0, 3);
      this.remainingBudget = currentMonthBudgets.reduce(
        (total, budget) => total + Number(budget.budget_amount) - this.getBudgetSpent(budget),
        0,
      );
      this.updateSpendingOverview();
    } catch (error) {
      this.balanceError = 'Could not load balance.';
      this.incomeError = 'Could not load income.';
      this.expenseError = 'Could not load expenses.';
      this.remainingBudgetError = 'Could not load remaining budget.';
      this.recentTransactionsError = 'Could not load recent transactions.';
      this.monthlyBudgetError = 'Could not load monthly budgets.';
      console.error('Failed to load dashboard data:', error);
    } finally {
      this.isDashboardDataLoading = false;
      this.changeDetector.detectChanges();
    }
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

  getSavedAmount(goal: SavingGoal): number {
    return this.goalContributions
      .filter((contribution) => Number(contribution.goal_id) === Number(goal.goal_id))
      .reduce((total, contribution) => total + Number(contribution.amount), 0);
  }

  getSavingGoalProgress(goal: SavingGoal): number {
    const targetAmount = Number(goal.target_amount);
    return targetAmount > 0
      ? Math.min(this.getSavedAmount(goal) / targetAmount, 1)
      : 0;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 2,
    }).format(amount);
  }

  private loadSavingGoals(): void {
    try {
      const savedResources = localStorage.getItem('finance-resources');
      if (!savedResources) {
        this.savingGoals = [];
        this.goalContributions = [];
        return;
      }

      const resources = JSON.parse(savedResources) as {
        savings_goals?: SavingGoal[];
        goal_contributions?: GoalContribution[];
      };
      this.savingGoals = (resources.savings_goals ?? []).slice(0, 3);
      this.goalContributions = resources.goal_contributions ?? [];
    } catch {
      this.savingGoals = [];
      this.goalContributions = [];
    }
  }

  updateSpendingOverview(): void {
    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
    const now = new Date();
    const months: { key: string; label: string }[] = [];

    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.push({ key, label: monthFormatter.format(date) });
    }

    this.spendingOverviewLabels = months.map((month) => month.label);
    this.spendingOverviewIncome = months.map((month) =>
      this.transactions
        .filter((transaction) =>
          transaction.transaction_type === 'Income' &&
          String(transaction.transaction_date ?? '').slice(0, 7) === month.key,
        )
        .reduce((total, transaction) => total + Number(transaction.amount), 0),
    );
    this.spendingOverviewExpenses = months.map((month) =>
      this.transactions
        .filter((transaction) =>
          transaction.transaction_type === 'Expense' &&
          String(transaction.transaction_date ?? '').slice(0, 7) === month.key,
        )
        .reduce((total, transaction) => total + Number(transaction.amount), 0),
    );

    if (!this.spendingChart) return;
    this.spendingChart.data.labels = this.spendingOverviewLabels;
    this.spendingChart.data.datasets[0].data = this.spendingOverviewIncome;
    this.spendingChart.data.datasets[1].data = this.spendingOverviewExpenses;
    this.spendingChart.update('none');
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
