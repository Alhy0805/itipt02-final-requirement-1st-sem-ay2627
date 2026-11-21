import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, RouterLink } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let toastControllerMock: { create: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    toastControllerMock = {
      create: vi.fn().mockResolvedValue({ present: vi.fn().mockResolvedValue(undefined) }),
    };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ToastController, useValue: toastControllerMock }],
    });
    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
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

  it('shows a toast when the backend rejects the credentials', async () => {
    component.email = 'user@example.com';
    component.password = 'wrong-pass';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Incorrect password.' }), { status: 401 }),
      ),
    );

    await component.signIn();

    expect(toastControllerMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Incorrect email or password.',
        color: 'danger',
      }),
    );
    expect(component.isSubmitting).toBe(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sign in');
    expect(fixture.nativeElement.textContent).not.toContain('Signing in...');
  });
});
