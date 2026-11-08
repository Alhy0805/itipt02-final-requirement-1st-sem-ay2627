import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

interface SavingGoal {
  goal_id: number;
  goal_name: string;
  target_amount: number;
  target_date?: string;
}

interface GoalContribution {
  goal_id: number;
  amount: number;
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
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonTitle,
    IonToolbar,
  ],
})
export class SavingGoalsPage implements OnInit {
  goals: SavingGoal[] = [];
  contributions: GoalContribution[] = [];

  newGoal = {
    goal_name: '',
    target_amount: null as number | null,
    target_date: '',
  };

  ngOnInit(): void {
    const savedResources = localStorage.getItem('finance-resources');
    if (savedResources) {
      const resources = JSON.parse(savedResources);
      this.goals = resources.savings_goals ?? [];
      this.contributions = resources.goal_contributions ?? [];
    }
  }

  getSavedAmount(goal: SavingGoal): number {
    return this.contributions
      .filter((contribution) => contribution.goal_id === goal.goal_id)
      .reduce((total, contribution) => total + Number(contribution.amount), 0);
  }

  addGoal(): void {
    const goalName = this.newGoal.goal_name.trim();
    const targetAmount = Number(this.newGoal.target_amount);

    if (!goalName || targetAmount <= 0) {
      return;
    }

    const goal: SavingGoal = {
      goal_id: Date.now(),
      goal_name: goalName,
      target_amount: targetAmount,
      target_date: this.newGoal.target_date,
    };

    this.goals.unshift(goal);
    this.saveGoals();
    this.resetForm();
  }

  deleteGoal(goal: SavingGoal): void {
    this.goals = this.goals.filter((item) => item.goal_id !== goal.goal_id);
    this.contributions = this.contributions.filter((item) => item.goal_id !== goal.goal_id);
    this.saveGoals();
  }

  resetForm(): void {
    this.newGoal = {
      goal_name: '',
      target_amount: null,
      target_date: '',
    };
  }

  private saveGoals(): void {
    const savedResources = localStorage.getItem('finance-resources');
    const resources = savedResources ? JSON.parse(savedResources) : {};

    resources.savings_goals = this.goals;
    resources.goal_contributions = this.contributions;

    localStorage.setItem('finance-resources', JSON.stringify(resources));
  }
}
