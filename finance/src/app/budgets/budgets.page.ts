import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, ViewChild } from '@angular/core';
import type { ElementRef, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonIcon,
  IonInput,
  IonModal,
  IonSearchbar,
  ToastController,
} from '@ionic/angular';
import { MainService } from '../services/main-service';
import type { Budget, BudgetCategory, BudgetInput } from '../services/main-service';
import { ArcElement, Chart, Legend, PieController, Tooltip } from 'chart.js';
import { addIcons } from 'ionicons';
import {
  addOutline,
  calendarOutline,
  createOutline,
  trashOutline,
  trendingUpOutline,
  walletOutline,
} from 'ionicons/icons';

interface BudgetTransaction {
  category_id: number | string;
  transaction_type: string;
  amount: number | string;
  transaction_date: string;
}

type BudgetPeriodFilter = 'all' | 'active' | 'upcoming' | 'past';

@Component({
  selector: 'app-budgets',
  templateUrl: './budgets.page.html',
  styleUrls: ['./budgets.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonDatetime,
    IonDatetimeButton,
    IonIcon,
    IonInput,
    IonModal,
    IonSearchbar,
  ],
})
export class BudgetsPage implements OnInit, OnDestroy {
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly toastController = inject(ToastController);
  private readonly mainService = inject(MainService);
  private budgetChart?: Chart<'pie', number[], string>;
  private readonly chartColors = [
    '#5653d8',
    '#168b69',
    '#a04bc5',
    '#e58a31',
    '#2586c7',
    '#d65270',
    '#7b8b32',
    '#53657d',
  ];

  showForm = false;
  searchTerm = '';
  periodFilter: BudgetPeriodFilter = 'all';
  selectedBudgetIndex = 0;
  budgets: Budget[] = [];
  categories: BudgetCategory[] = [];
  transactions: BudgetTransaction[] = [];
  userId = 0;
  isLoading = true;
  isSaving = false;
  deletingBudgetId: number | null = null;
  editingBudgetId: number | null = null;
  errorMessage = '';
  newBudget: Budget = this.emptyBudget();
  private hasLoadedBudgets = false;

  constructor() {
    addIcons({
      addOutline,
      calendarOutline,
      createOutline,
      trashOutline,
      trendingUpOutline,
      walletOutline,
    });
    Chart.register(PieController, ArcElement, Tooltip, Legend);
  }

  ngOnInit(): void {
    void this.loadBudgets();
  }

  @ViewChild('budgetChart')
  set budgetChartElement(element: ElementRef<HTMLCanvasElement> | undefined) {
    if (!element) {
      this.budgetChart?.destroy();
      this.budgetChart = undefined;
      return;
    }

    this.budgetChart = new Chart<'pie', number[], string>(element.nativeElement, {
      type: 'pie',
      data: {
        labels: [],
        datasets: [{ data: [], backgroundColor: [], borderColor: '#ffffff', borderWidth: 3, hoverOffset: 8 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (_event, elements) => {
          if (elements.length) this.selectBudget(elements[0].index);
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const budget = this.filteredBudgets[context.dataIndex];
                if (!budget) return '';
                const amount = this.formatCurrency(Number(budget.budget_amount));
                const spent = this.formatCurrency(this.getBudgetSpent(budget));
                return `${budget.budget_name}: ${amount} budget · ${spent} spent`;
              },
            },
          },
        },
      },
    });
    this.updateBudgetChart();
  }

  ngOnDestroy(): void {
    this.budgetChart?.destroy();
    this.budgetChart = undefined;
  }

  ionViewWillEnter(): void {
    if (this.hasLoadedBudgets && !this.isLoading) {
      void this.loadBudgets();
    }
  }

  get totalBudget(): number {
    return this.budgets.reduce((total, budget) => total + Number(budget.budget_amount || 0), 0);
  }

  get filteredBudgetTotal(): number {
    return this.filteredBudgets.reduce((total, budget) => total + Number(budget.budget_amount || 0), 0);
  }

  get activeBudgets(): Budget[] {
    return this.budgets.filter((budget) => this.getBudgetStatus(budget) === 'active');
  }

  get activeBudgetTotal(): number {
    return this.activeBudgets.reduce((total, budget) => total + Number(budget.budget_amount || 0), 0);
  }

  get currentPeriod(): string {
    return new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });
  }

  get filteredBudgets(): Budget[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.budgets.filter((budget) => {
      const matchesSearch =
        !term ||
        budget.budget_name.toLowerCase().includes(term) ||
        this.getCategoryName(budget.category_id).toLowerCase().includes(term);
      const matchesPeriod = this.periodFilter === 'all' || this.getBudgetStatus(budget) === this.periodFilter;
      return matchesSearch && matchesPeriod;
    });
  }

  get selectedBudget(): Budget | null {
    return this.filteredBudgets[this.selectedBudgetIndex] ?? null;
  }

  getBudgetChartColor(index: number): string {
    return this.chartColors[index % this.chartColors.length];
  }

  selectBudget(index: number): void {
    this.selectedBudgetIndex = index;
    this.changeDetector.detectChanges();
  }

  updateBudgetChart(): void {
    const budgets = this.filteredBudgets;
    if (this.selectedBudgetIndex >= budgets.length) this.selectedBudgetIndex = 0;
    if (!this.budgetChart) return;

    this.budgetChart.data.labels = budgets.map((budget) => budget.budget_name);
    this.budgetChart.data.datasets[0].data = budgets.map((budget) => Math.max(0, Number(budget.budget_amount) || 0));
    this.budgetChart.data.datasets[0].backgroundColor = budgets.map((_, index) => this.getBudgetChartColor(index));
    this.budgetChart.update('none');
  }

  getBudgetStatus(budget: Budget): 'active' | 'upcoming' | 'past' {
    const today = this.getToday();
    if (budget.start_date > today) return 'upcoming';
    if (budget.end_date < today) return 'past';
    return 'active';
  }

  getBudgetSpent(budget: Budget): number {
    return this.transactions
      .filter(
        (transaction) =>
          transaction.transaction_type === 'Expense' &&
          Number(transaction.category_id) === Number(budget.category_id) &&
          transaction.transaction_date >= budget.start_date &&
          transaction.transaction_date <= budget.end_date,
      )
      .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
  }

  getBudgetRemaining(budget: Budget): number {
    return Number(budget.budget_amount) - this.getBudgetSpent(budget);
  }

  getBudgetProgress(budget: Budget): number {
    const amount = Number(budget.budget_amount);
    return amount > 0 ? Math.min(this.getBudgetSpent(budget) / amount, 1) : 0;
  }

  setStartDate(event: CustomEvent): void {
    this.newBudget.start_date = this.getDateValue(event);
  }

  setEndDate(event: CustomEvent): void {
    this.newBudget.end_date = this.getDateValue(event);
  }

  async loadBudgets(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      this.userId = this.mainService.getUserId();
      const resources = this.mainService.getLocalStorageData<{
        categories?: BudgetCategory[];
        transactions?: BudgetTransaction[];
      }>();
      this.categories = resources?.categories ?? [];
      this.transactions = resources?.transactions ?? [];
      this.categories = await this.mainService.getBudgetCategories();
      this.budgets = await this.mainService.getBudgets();
      this.updateCachedBudgets();
    } catch (error) {
      console.error('Unable to load budgets:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Unable to load budgets.';
    } finally {
      this.isLoading = false;
      this.hasLoadedBudgets = true;
      this.updateBudgetChart();
      this.changeDetector.detectChanges();
    }
  }

  beginCreate(): void {
    this.errorMessage = '';
    this.editingBudgetId = null;
    this.newBudget = this.emptyBudget();
    this.showForm = true;
  }

  beginEdit(budget: Budget): void {
    this.errorMessage = '';
    this.editingBudgetId = budget.budget_id ?? null;
    this.newBudget = { ...budget };
    this.showForm = true;
  }

  async saveBudget(): Promise<void> {
    if (this.isSaving) return;
    this.errorMessage = '';
    const budgetAmount = Number(this.newBudget.budget_amount);
    const budgetName = this.newBudget.budget_name.trim();

    if (!budgetName) {
      this.errorMessage = 'Enter a budget name.';
      return;
    }
    if (!Number.isFinite(budgetAmount) || budgetAmount <= 0) {
      this.errorMessage = 'Budget amount must be greater than zero.';
      return;
    }
    if (!this.newBudget.category_id) {
      this.errorMessage = 'Select a category for this budget.';
      return;
    }
    if (!this.newBudget.start_date || !this.newBudget.end_date) {
      this.errorMessage = 'Choose a start date and end date.';
      return;
    }
    if (this.newBudget.end_date < this.newBudget.start_date) {
      this.errorMessage = 'End date must be on or after the start date.';
      return;
    }

    this.isSaving = true;
    try {
      const editingId = this.editingBudgetId;
      const payload: BudgetInput = {
        category_id: Number(this.newBudget.category_id),
        budget_name: budgetName,
        budget_amount: budgetAmount,
        start_date: this.newBudget.start_date,
        end_date: this.newBudget.end_date,
      };
      const savedBudget = editingId
        ? await this.mainService.updateBudget(editingId, payload)
        : await this.mainService.createBudget(payload);
      this.budgets = editingId
        ? this.budgets.map((budget) => (budget.budget_id === editingId ? savedBudget : budget))
        : [savedBudget, ...this.budgets];
      this.resetForm();
      this.updateCachedBudgets();
      await this.presentToast(editingId ? 'Budget updated successfully.' : 'Budget added successfully.');
    } catch (error) {
      console.error('Unable to save budget:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Unable to save budget.';
    } finally {
      this.isSaving = false;
      this.updateBudgetChart();
      this.changeDetector.detectChanges();
    }
  }

  async deleteBudget(budget: Budget): Promise<void> {
    if (!budget.budget_id || this.deletingBudgetId !== null) return;
    const confirmed = window.confirm(`Delete "${budget.budget_name}"? This cannot be undone.`);
    if (!confirmed) return;

    this.deletingBudgetId = budget.budget_id;
    this.errorMessage = '';
    try {
      await this.mainService.deleteBudget(budget.budget_id);
      this.budgets = this.budgets.filter((item) => item.budget_id !== budget.budget_id);
      this.updateCachedBudgets();
      await this.presentToast('Budget deleted successfully.');
    } catch (error) {
      console.error('Unable to delete budget:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Unable to delete budget.';
    } finally {
      this.deletingBudgetId = null;
      this.updateBudgetChart();
      this.changeDetector.detectChanges();
    }
  }

  getCategoryName(categoryId: number): string {
    return (
      this.categories.find((category) => Number(category.category_id) === Number(categoryId))?.category_name ?? '—'
    );
  }

  resetForm(): void {
    this.newBudget = this.emptyBudget();
    this.editingBudgetId = null;
    this.showForm = false;
  }

  private updateCachedBudgets(): void {
    this.mainService.updateBudgetCache(this.budgets);
  }

  getToday(): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Asia/Manila',
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values['year']}-${values['month']}-${values['day']}`;
  }

  private getDateValue(event: CustomEvent): string {
    const value = event.detail?.value;
    if (typeof value !== 'string') return '';
    return value.split('T')[0];
  }

  private async presentToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
      color: 'success',
    });
    await toast.present();
  }

  private emptyBudget(): Budget {
    return {
      category_id: 0,
      budget_name: '',
      budget_amount: '',
      start_date: '',
      end_date: '',
      created_at: '',
    };
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  }
}
