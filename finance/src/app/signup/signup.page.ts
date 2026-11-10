import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCheckbox,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonText,
} from '@ionic/angular';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  imports: [
    IonButton,
    IonCard,
    IonCardContent,
    IonCheckbox,
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
export class SignupPage {
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  acceptedTerms = false;
  showPassword = false;
  formSubmitted = false;
  formMessage = '';
  isSubmitting = false;
  hasFormError = false;

  readonly api = 'http://127.0.0.1:8000/signup';

  private readonly router = inject(Router);

  get isNameValid(): boolean {
    return this.fullName.trim().length > 0;
  }

  get isEmailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  get isPasswordValid(): boolean {
    return this.password.length >= 6;
  }

  get isConfirmationValid(): boolean {
    return this.confirmPassword.length > 0 && this.password === this.confirmPassword;
  }

  async createAccount(): Promise<void> {
    this.formSubmitted = true;
    this.formMessage = '';
    this.hasFormError = false;

    if (
      !this.isNameValid ||
      !this.isEmailValid ||
      !this.isPasswordValid ||
      !this.isConfirmationValid ||
      !this.acceptedTerms ||
      this.isSubmitting
    ) {
      return;
    }

    this.isSubmitting = true;
    try {
      const response = await fetch(this.api, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: this.fullName.trim(),
          email: this.email.trim(),
          password: this.password,
        }),
      });

      const result: unknown = await response.json();
      if (!response.ok) {
        const detail =
          typeof result === 'object' && result !== null && 'detail' in result && typeof result.detail === 'string'
            ? result.detail
            : 'Could not create your account. Please try again.';
        throw new Error(detail);
      }

      if (
        typeof result !== 'object' ||
        result === null ||
        !('user' in result) ||
        typeof result.user !== 'object' ||
        result.user === null ||
        !('user_id' in result.user) ||
        typeof result.user.user_id !== 'number'
      ) {
        throw new Error('The server returned an incomplete signup response.');
      }

      const user = result.user;
      const resourcesResponse = await fetch(`http://127.0.0.1:8000/resources/${user.user_id}`);
      const resources: unknown = await resourcesResponse.json();
      if (!resourcesResponse.ok) {
        const detail =
          typeof resources === 'object' &&
          resources !== null &&
          'detail' in resources &&
          typeof resources.detail === 'string'
            ? resources.detail
            : `Could not load user resources (${resourcesResponse.status}).`;
        throw new Error(detail);
      }

      localStorage.setItem('finance-user', JSON.stringify(user));
      localStorage.setItem('finance-resources', JSON.stringify(resources));
      this.password = '';
      this.confirmPassword = '';
      this.acceptedTerms = false;
      await this.router.navigateByUrl('/finance/dashboard', { replaceUrl: true });
    } catch (error) {
      console.error('Signup error:', error);
      this.hasFormError = true;
      this.formMessage =
        error instanceof TypeError
          ? 'Could not connect to the server. Please try again.'
          : error instanceof Error
            ? error.message
            : 'Could not create your account. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
