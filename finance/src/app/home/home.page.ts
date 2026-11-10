import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonAlert,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCheckbox,
  IonCol,
  IonContent,
  IonGrid,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonRow,
  IonText,
} from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonLabel, CommonModule, FormsModule],
})
export class HomePage implements OnInit {
  user_id: number = 0;
  accounts: Account[] = [];
  api: string = '';

  constructor() {}

  async getAccounts(): Promise<void> {
    try {
      // Get user information from localStorage
      const storedUser = localStorage.getItem('finance-user');

      if (!storedUser) {
        throw new Error('User session not found');
      }

      // Convert JSON string into an object
      const user = JSON.parse(storedUser);

      // Get user ID
      this.user_id = Number(user.user_id);

      if (!Number.isInteger(this.user_id) || this.user_id <= 0) {
        throw new Error('Invalid user ID');
      }

      // Build API URL
      this.api = `http://127.0.0.1:8000/accounts/${this.user_id}`;

      // Fetch accounts
      const response = await fetch(this.api);

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      this.accounts = (await response.json()) as Account[];

      console.log('User ID:', this.user_id);
      console.log('Accounts loaded:', this.accounts);
    } catch (error) {
      console.error('Unable to load accounts:', error);
    }
  }

  ngOnInit(): void {
    void this.getAccounts();
  }
}

interface Account {
  account_id: number;
  user_id: number;
  account_name: string;
  account_type_ids: number[];
  account_types: { account_type_id: number; type_name: string }[];
  balance: number | string;
  created_at: string;
}
