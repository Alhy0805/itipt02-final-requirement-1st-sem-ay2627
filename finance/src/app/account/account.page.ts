
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonInput,
  IonLabel,
  IonText
} from '@ionic/angular';
import { finalize, TimeoutError, timeout } from 'rxjs';

import { MainService, UserCredentialsUpdate } from '../services/main-service';

@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
  imports: [
    FormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonInput,
    IonLabel,
    IonText
  ],
})
export class AccountPage {

  private mainService = inject(MainService);
  private cdr = inject(ChangeDetectorRef);

  userInfo: any = null;

  current_username = '';
  current_password = '';
  new_username = '';
  new_password = '';
  confirm_password = '';

  isUpdating = false;

  ionViewWillEnter() {
    this.userInfo = this.mainService.getUserData();
    this.current_username = this.userInfo?.full_name || '';

    this.cdr.detectChanges();
  }

  updateCredentials() {

    if (this.isUpdating) return;

    const userId = this.mainService.getUserId();

    if (!this.current_password.trim()) {
      alert('Please enter your current password.');
      return;
    }

    if (this.new_password.trim() !== '' && this.new_password.length < 6) {
      alert('New password must be at least 6 characters.');
      return;
    }

    if (
      this.new_password.trim() !== '' &&
      this.new_password !== this.confirm_password
    ) {
      alert('New passwords do not match.');
      return;
    }

    if (
      this.new_username.trim() === '' &&
      this.new_password.trim() === ''
    ) {
      alert('Enter a new username or password.');
      return;
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      alert('User account not found. Please log in again.');
      return;
    }

    const updateData: UserCredentialsUpdate = {
      current_password: this.current_password,
    };

    if (this.new_username.trim() !== '') {
      updateData.username = this.new_username.trim();
    }

    if (this.new_password.trim() !== '') {
      updateData.password = this.new_password;
    }

    this.isUpdating = true;
    this.mainService.updateUserCredentials(userId, updateData)
      .pipe(
        timeout({ first: 20000 }),
        finalize(() => {
          this.isUpdating = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: any) => {
          if (response.user) {
            localStorage.setItem('finance-user', JSON.stringify(response.user));
            this.userInfo = response.user;
            this.current_username = response.user.full_name;
          }

          this.current_password = '';
          this.new_username = '';
          this.new_password = '';
          this.confirm_password = '';

          alert('Account updated successfully!');
        },
        error: (error: unknown) => {
          alert(this.getUpdateErrorMessage(error));
        },
      });
  }

  private getUpdateErrorMessage(error: unknown): string {
    if (error instanceof TimeoutError) {
      return 'The update request timed out. Please try again.';
    }

    if (error instanceof HttpErrorResponse && typeof error.error?.detail === 'string') {
      return error.error.detail;
    }

    return 'Failed to update account.';
  }
}
