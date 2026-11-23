import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonAlert,
  IonCard,
  IonCardContent,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonText,
  ToastController,
} from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

import { MainService } from '../services/main-service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    IonButton,
    IonAlert,
    IonCard,
    IonCardContent,
    IonContent,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonText,
    RouterLink,
    CommonModule,
    FormsModule,
  ],
})
export class LoginPage {
  private readonly toastController = inject(ToastController);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly mainService = inject(MainService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  showPassword = false;
  isSubmitting = false;
  formSubmitted = false;
  errorMessage = '';
  isAlertOpen = false;
  alertTitle = 'Login failed';

  get isEmailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  get isPasswordValid(): boolean {
    return this.password.length >= 6;
  }

  async signIn(): Promise<void> {
    this.formSubmitted = true;
    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Enter your email and password.';
      this.openFeedback('Missing details', this.errorMessage);
      return;
    }

    if (!this.isEmailValid || !this.isPasswordValid || this.isSubmitting) return;

    this.isSubmitting = true;

    try {
      const data = await firstValueFrom(
        this.mainService.checkCredentials({
          email: this.email.trim(),
          password: this.password,
        }),
      );

      if (!data.user) {
        throw new Error('The backend returned an incomplete login response.');
      }

      const resources = await firstValueFrom(this.mainService.getResources(data.user.user_id));

      localStorage.setItem('finance-user', JSON.stringify(data.user));
      localStorage.setItem('finance-resources', JSON.stringify(resources));

      this.errorMessage = '';
      await this.router.navigateByUrl('/finance/dashboard', { replaceUrl: true });
    } catch (error) {
      console.error('Login error:', error);
      this.errorMessage = this.getErrorMessage(error, 'Cannot connect to the backend');
      if (error instanceof HttpErrorResponse && error.status === 401) {
        await this.presentToast('Incorrect email or password.');
      } else {
        this.openFeedback(error instanceof HttpErrorResponse ? 'Connection error' : 'Login failed', this.errorMessage);
      }
    } finally {
      this.isSubmitting = false;
      this.changeDetector.markForCheck();
    }
  }

  openFeedback(title: string, message: string): void {
    this.alertTitle = title;
    this.errorMessage = message;
    this.isAlertOpen = true;
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const detail = error.error?.detail;
      return typeof detail === 'string' ? detail : fallback;
    }
    return error instanceof Error ? error.message : fallback;
  }

  private async presentToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger',
    });
    await toast.present();
  }
}
