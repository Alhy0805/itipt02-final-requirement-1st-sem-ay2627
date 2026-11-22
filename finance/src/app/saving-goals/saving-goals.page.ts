import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';
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
  IonToolbar
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
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonTitle,
    IonToolbar
  ]
})
export class SavingGoalsPage implements OnInit {
  goals: SavingGoal[] = [];
  contributions: GoalContribution[] = [];
  editingGoalId: number | null = null;

  newGoal: GoalForm = {
    goal_name: '',
    target_amount: null,
    target_date: '',
  };

  ngOnInit(): void {
    const resources = JSON.parse(localStorage.getItem('finance-resources') || '{}');
    this.goals = resources.savings_goals || [];
    this.contributions = resources.goal_contributions || [];
  }

  getSavedAmount(goal: SavingGoal): number {
    let total = 0;

    for (const contribution of this.contributions) {
      if (contribution.goal_id === goal.goal_id) {
        total = total + contribution.amount;
      }
    }

    return total;
  }

  addGoal(): void {
    const goalName = this.newGoal.goal_name.trim();
    const targetAmount = parseFloat(String(this.newGoal.target_amount));

    if (goalName === '' || isNaN(targetAmount) || targetAmount <= 0) {
      return;
    }

    if (this.editingGoalId !== null) {
      if (!window.confirm('Save changes to this saving goal?')) {
        return;
      }

      const savedGoal = this.goals.find((goal) => goal.goal_id === this.editingGoalId);
      if (!savedGoal) {
        return;
      }

      savedGoal.goal_name = goalName;
      savedGoal.target_amount = targetAmount;
      savedGoal.target_date = this.newGoal.target_date;
    } else {
      const goal: SavingGoal = {
        goal_id: Date.now(),
        goal_name: goalName,
        target_amount: targetAmount,
        target_date: this.newGoal.target_date,
      };

      this.goals.unshift(goal);
    }

    this.saveGoals();
    this.resetForm();
  }

  editGoal(goal: SavingGoal): void {
    this.editingGoalId = goal.goal_id;
    this.newGoal.goal_name = goal.goal_name;
    this.newGoal.target_amount = goal.target_amount;
    this.newGoal.target_date = goal.target_date ?? '';
  }

  deleteGoal(goal: SavingGoal): void {
    if (!window.confirm(`Are you sure you want to delete "${goal.goal_name}"?`)) {
      return;
    }

    this.goals = this.goals.filter((savedGoal) => savedGoal.goal_id !== goal.goal_id);
    this.contributions = this.contributions.filter((contribution) => contribution.goal_id !== goal.goal_id);

    if (this.editingGoalId === goal.goal_id) {
      this.resetForm();
    }

    this.saveGoals();
  }

  resetForm(): void {
    this.editingGoalId = null;
    this.newGoal.goal_name = '';
    this.newGoal.target_amount = null;
    this.newGoal.target_date = '';
  }

  private saveGoals(): void {
    const savedResources = localStorage.getItem('finance-resources');
    const resources = JSON.parse(savedResources || '{}');

    resources.savings_goals = this.goals;
    resources.goal_contributions = this.contributions;

    localStorage.setItem('finance-resources', JSON.stringify(resources));
  }
}
