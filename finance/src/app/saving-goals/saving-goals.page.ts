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
    const savedResources = localStorage.getItem('finance-resources');
    if (savedResources !== null) {
      const resources = JSON.parse(savedResources);

      if (resources.savings_goals) {
        this.goals = resources.savings_goals;
      }

      if (resources.goal_contributions) {
        this.contributions = resources.goal_contributions;
      }
    }
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
      const confirmed = window.confirm('Save changes to this saving goal?');
      if (confirmed === false) {
        return;
      }

      let goalWasFound = false;
      for (const savedGoal of this.goals) {
        if (savedGoal.goal_id === this.editingGoalId) {
          savedGoal.goal_name = goalName;
          savedGoal.target_amount = targetAmount;
          savedGoal.target_date = this.newGoal.target_date;
          goalWasFound = true;
          break;
        }
      }

      if (goalWasFound === false) {
        return;
      }
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
    const confirmed = window.confirm(`Delete "${goal.goal_name}"? This cannot be undone.`);
    if (confirmed === false) {
      return;
    }

    for (let index = this.goals.length - 1; index >= 0; index--) {
      if (this.goals[index].goal_id === goal.goal_id) {
        this.goals.splice(index, 1);
      }
    }

    for (let index = this.contributions.length - 1; index >= 0; index--) {
      if (this.contributions[index].goal_id === goal.goal_id) {
        this.contributions.splice(index, 1);
      }
    }

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
