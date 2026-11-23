import { HttpErrorResponse } from '@angular/common/http';
import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterLink } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MainService } from '../services/main-service';

import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let toastControllerMock: { create: ReturnType<typeof vi.fn> };
  let mainServiceMock: {
    checkCredentials: ReturnType<typeof vi.fn>;
    getResources: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    toastControllerMock = {
      create: vi.fn().mockResolvedValue({ present: vi.fn().mockResolvedValue(undefined) }),
    };
    mainServiceMock = {
      checkCredentials: vi.fn(),
      getResources: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ToastController, useValue: toastControllerMock },
        { provide: MainService, useValue: mainServiceMock },
      ],
    });
    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('finance-user');
    localStorage.removeItem('finance-resources');
    vi.unstubAllGlobals();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('links the create-account button to signup', () => {
    const router = TestBed.inject(Router);
    const link = fixture.debugElement.query(By.directive(RouterLink)).injector.get(RouterLink);

    expect(router.serializeUrl(link.urlTree!)).toBe('/signup');
  });

  it('loads the signed-in user and resources before navigating to the dashboard', async () => {
    const user = {
      user_id: 23,
      full_name: 'Test User',
      email: 'user@example.com',
      profile_image: null,
      currency: 'PHP',
    };
    const resources = { accounts: [] };
    mainServiceMock.checkCredentials.mockReturnValue(of({ message: 'Login successful', user }));
    mainServiceMock.getResources.mockReturnValue(of(resources));
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component.email = 'user@example.com';
    component.password = 'secure-pass';

    await component.signIn();

    expect(mainServiceMock.checkCredentials).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secure-pass',
    });
    expect(mainServiceMock.getResources).toHaveBeenCalledWith(23);
    expect(localStorage.getItem('finance-user')).toBe(JSON.stringify(user));
    expect(localStorage.getItem('finance-resources')).toBe(JSON.stringify(resources));
    expect(navigateSpy).toHaveBeenCalledWith('/finance/dashboard', { replaceUrl: true });
  });

  it('shows a toast when the backend rejects the credentials', async () => {
    mainServiceMock.checkCredentials.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: { detail: 'Incorrect password.' },
          }),
      ),
    );
    component.email = 'user@example.com';
    component.password = 'wrong-pass';

    await component.signIn();

    expect(toastControllerMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Incorrect email or password.',
        color: 'danger',
      }),
    );
    expect(component.isSubmitting).toBe(false);
  });
});
