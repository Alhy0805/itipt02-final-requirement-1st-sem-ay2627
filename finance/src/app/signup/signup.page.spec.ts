import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SignupPage } from './signup.page';

describe('SignupPage', () => {
  let component: SignupPage;
  let fixture: ComponentFixture<SignupPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(SignupPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('finance-user');
    localStorage.removeItem('finance-resources');
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('creates an account through the signup endpoint', async () => {
    component.fullName = 'Alex Santos';
    component.email = 'alex@example.com';
    component.password = 'secure-pass';
    component.confirmPassword = 'secure-pass';
    component.acceptedTerms = true;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: 'Account created successfully.',
            user: {
              user_id: 23,
              full_name: 'Alex Santos',
              email: 'alex@example.com',
              profile_image: null,
              currency: 'PHP',
            },
          }),
          { status: 201 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ user_id: 23, accounts: [], categories: [] }), { status: 200 }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    await component.createAccount();

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://127.0.0.1:8000/signup',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          full_name: 'Alex Santos',
          email: 'alex@example.com',
          password: 'secure-pass',
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'http://127.0.0.1:8000/resources/23');
    expect(localStorage.getItem('finance-user')).toContain('"user_id":23');
    expect(localStorage.getItem('finance-resources')).toContain('"accounts":[]');
    expect(navigateSpy).toHaveBeenCalledWith('/finance/dashboard', { replaceUrl: true });
    expect(component.password).toBe('');
    expect(component.confirmPassword).toBe('');
  });

  it('shows the backend message when the email is already registered', async () => {
    component.fullName = 'Alex Santos';
    component.email = 'alex@example.com';
    component.password = 'secure-pass';
    component.confirmPassword = 'secure-pass';
    component.acceptedTerms = true;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: 'An account with this email already exists.' }), {
          status: 409,
        }),
      ),
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await component.createAccount();

    expect(component.hasFormError).toBe(true);
    expect(component.formMessage).toBe('An account with this email already exists.');
  });
});
