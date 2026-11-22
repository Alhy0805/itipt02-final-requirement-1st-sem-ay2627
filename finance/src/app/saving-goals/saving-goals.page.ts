import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, type OnInit } from '@angular/core';
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
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonProgressBar,
  IonSearchbar
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, calendarOutline, createOutline, trashOutline, trendingUpOutline, walletOutline } from 'ionicons/icons';
import { MainService } from '../services/main-service';
import type { GoalContribution, SavingGoal, SavingGoalInput } from '../services/main-service';

interface GoalForm {
  goal_name: string;
  target_amount: number | null;
  target_date: string;
}

@Component({
  selector: 'app-saving-goals',
  templateUrl: './saving-goals.page.html',
  styleUrls: ['./saving-goals.page.scss'],
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
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonProgressBar,
    IonSearchbar
  ]
})
export class SavingGoalsPage implements OnInit {
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly mainService = inject(MainService);
  goals: SavingGoal[] = [];
  contributions: GoalContribution[] = [];
  editingGoalId: number | null = null;
  isLoading = true;
  isSaving = false;
  deletingGoalId: number | null = null;
  errorMessage = '';
  showForm = false;
  searchTerm = '';
  private hasLoadedGoals = false;

  newGoal: GoalForm = {
    goal_name: '',
    target_amount: null,
    target_date: '',
  };

  constructor() {
    addIcons({
      addOutline,
      calendarOutline,
      createOutline,
      trashOutline,
      trendingUpOutline,
      walletOutline,
    });
  }

  ngOnInit(): void {
    void this.loadGoals();
  }

  ionViewWillEnter(): void {
    if (this.hasLoadedGoals && !this.isLoading) {
      void this.loadGoals();
    }
  }

  getSavedAmount(goal: SavingGoal): number {
    return this.contributions
      .filter((contribution) => Number(contribution.goal_id) === Number(goal.goal_id))
      .reduce((total, contribution) => total + Number(contribution.amount), 0);
  }

  getSavingGoalProgress(goal: SavingGoal): number {
    const targetAmount = Number(goal.target_amount);
    return targetAmount > 0 ? Math.min(this.getSavedAmount(goal) / targetAmount, 1) : 0;
  }

  get filteredGoals(): SavingGoal[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.goals;
    return this.goals.filter((goal) =>
      goal.goal_name.toLowerCase().includes(term),
    );
  }

  get totalTargetAmount(): number {
    return this.goals.reduce((total, goal) => total + Number(goal.target_amount), 0);
  }

  get totalSavedAmount(): number {
    return this.goals.reduce((total, goal) => total + this.getSavedAmount(goal), 0);
  }

  beginCreate(): void {
    this.errorMessage = '';
    this.editingGoalId = null;
    this.newGoal = {
      goal_name: '',
      target_amount: null,
      target_date: '',
    };
    this.showForm = true;
  }

  setTargetDate(event: CustomEvent): void {
    const value = event.detail?.value;
    this.newGoal.target_date =
      typeof value === 'string' ? value.split('T')[0] : '';
  }

  async addGoal(): Promise<void> {
    if (this.isSaving) return;
    const goalName = this.newGoal.goal_name.trim();
    const targetAmount = Number(this.newGoal.target_amount);

    if (goalName === '' || !Number.isFinite(targetAmount) || targetAmount <= 0) {
      this.errorMessage = 'Enter a goal name and a target amount greater than zero.';
      return;
    }

    const editingId = this.editingGoalId;
    if (editingId !== null) {
      if (!window.confirm('Save changes to this saving goal?')) {
        return;
      }
    }

    const payload: SavingGoalInput = {
      goal_name: goalName,
      target_amount: targetAmount,
      target_date: this.newGoal.target_date,
    };

    this.isSaving = true;
    this.errorMessage = '';
    try {
      const savedGoal = editingId
        ? await this.mainService.updateSavingGoal(editingId, payload)
        : await this.mainService.createSavingGoal(payload);
      this.goals = editingId
        ? this.goals.map((goal) => (goal.goal_id === editingId ? savedGoal : goal))
        : [savedGoal, ...this.goals];
      this.resetForm();
      this.showForm = false;
      this.saveGoals();
    } catch (error) {
      console.error('Unable to save saving goal:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Unable to save saving goal.';
    } finally {
      this.isSaving = false;
      this.changeDetector.detectChanges();
    }
  }

  editGoal(goal: SavingGoal): void {
    this.errorMessage = '';
    this.editingGoalId = goal.goal_id;
    this.newGoal.goal_name = goal.goal_name;
    this.newGoal.target_amount = Number(goal.target_amount);
    this.newGoal.target_date = goal.target_date ?? '';
    this.showForm = true;
  }

  async deleteGoal(goal: SavingGoal): Promise<void> {
    if (this.deletingGoalId !== null) return;
    if (!window.confirm(`Are you sure you want to delete "${goal.goal_name}"?`)) {
      return;
    }

    this.deletingGoalId = goal.goal_id;
    this.errorMessage = '';
    try {
      await this.mainService.deleteSavingGoal(goal.goal_id);
      this.goals = this.goals.filter((savedGoal) => savedGoal.goal_id !== goal.goal_id);
      this.contributions = this.contributions.filter((contribution) => contribution.goal_id !== goal.goal_id);
      if (this.editingGoalId === goal.goal_id) this.resetForm();
      this.saveGoals();
    } catch (error) {
      console.error('Unable to delete saving goal:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Unable to delete saving goal.';
    } finally {
      this.deletingGoalId = null;
      this.changeDetector.detectChanges();
    }
  }

  resetForm(): void {
    this.editingGoalId = null;
    this.newGoal.goal_name = '';
    this.newGoal.target_amount = null;
    this.newGoal.target_date = '';
    this.showForm = false;
  }

  private saveGoals(): void {
    this.mainService.updateSavingGoalCache(this.goals, this.contributions);
  }

  private async loadGoals(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    const cached = this.mainService.getLocalStorageData<{
      savings_goals?: SavingGoal[];
      goal_contributions?: GoalContribution[];
    }>();
    this.goals = cached?.savings_goals ?? [];
    this.contributions = cached?.goal_contributions ?? [];

    try {
      this.goals = await this.mainService.getSavingGoals();
      const resources = await this.mainService.getResources(this.mainService.getUserId()) as {
        goal_contributions?: GoalContribution[];
      };
      this.contributions = resources.goal_contributions ?? [];
      this.saveGoals();
    } catch (error) {
      console.error('Unable to load saving goals:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Unable to load saving goals.';
    } finally {
      this.isLoading = false;
      this.hasLoadedGoals = true;
      this.changeDetector.detectChanges();
    }
  }
}
