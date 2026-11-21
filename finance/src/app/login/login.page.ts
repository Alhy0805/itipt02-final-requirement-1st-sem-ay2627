
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
  ToastController,
} from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
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
    RouterLink,
    CommonModule,
    FormsModule,
  ],
})
export class LoginPage {
  private readonly toastController = inject(ToastController);
  private readonly changeDetector = inject(ChangeDetectorRef);

  email = '';
  password = '';
  rememberMe = false;
  showPassword = false;
  isSubmitting = false;
  formSubmitted = false;
  errorMessage = '';
  isAlertOpen = false;
  alertTitle = 'Login failed';

  api = 'http://127.0.0.1:8000/checkCredentials';

  constructor(private readonly router: Router) {}

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
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const response = await fetch(this.api, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.email,
          password: this.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        this.errorMessage = data.detail || 'Login failed';
        if (response.status === 401) {
          await this.presentToast('Incorrect email or password.');
          return;
        }
        this.openFeedback('Login failed', this.errorMessage);
        return;
      }

      if (!data.user) {
        this.errorMessage = 'The backend returned an incomplete login response.';
        this.openFeedback('Login failed', this.errorMessage);
        return;
      }

      const resourcesResponse = await fetch(
        `http://127.0.0.1:8000/resources/${data.user.user_id}`,
      );

      const resources = await resourcesResponse.json();

      if (!resourcesResponse.ok) {
        throw new Error(
          resources.detail || `Could not load user resources (${resourcesResponse.status}).`,
        );
      }

      // Store current user's data only
      localStorage.setItem('finance-user', JSON.stringify(data.user));
      localStorage.setItem('finance-resources', JSON.stringify(resources));

      this.errorMessage = '';

      // redirection
      await this.router.navigateByUrl('/finance/dashboard', { replaceUrl: true });

    } catch (error) {
      console.error('Login error:', error);
      this.errorMessage =
        error instanceof Error ? error.message : 'Cannot connect to the backend';
      this.openFeedback('Connection error', this.errorMessage);

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
