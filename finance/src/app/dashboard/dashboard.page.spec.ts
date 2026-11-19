import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardPage } from './dashboard.page';

describe('DashboardPage', () => {
  let component: DashboardPage;
  let fixture: ComponentFixture<DashboardPage>;

  beforeEach(() => {
    localStorage.setItem('finance-user', JSON.stringify({ user_id: 42 }));
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        const response = url.endsWith('/Income')
          ? [{ amount: '300.00' }]
          : url.endsWith('/Expense')
            ? [{ amount: '25.00' }]
            : [{ balance: '100.00' }, { balance: '400.00' }];
        return Promise.resolve(new Response(JSON.stringify(response), { status: 200 }));
      }),
    );
    fixture = TestBed.createComponent(DashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem('finance-user');
    vi.unstubAllGlobals();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('uses the current account total without subtracting expenses again', async () => {
    await component.ionViewWillEnter();

    expect(component.income).toBe(300);
    expect(component.expenses).toBe(25);
    expect(component.balance).toBe(500);
  });
});
